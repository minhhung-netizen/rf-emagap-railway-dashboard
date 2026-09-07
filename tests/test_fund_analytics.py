import json
import tempfile
import unittest
from dataclasses import replace
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

import app.main as main
from app.database import SignalStore
from app.services.auth import hash_password
from app.services.fund_analytics import NavSnapshot, RiskPolicy, build_fund_performance, build_market_risk, xirr
from app.services.portfolio_gate import DEFAULT_GUARDRAILS


def snapshot(day, nav, flow=0, holdings=None, benchmark=None):
    holdings = holdings or []
    return NavSnapshot(
        trade_date=day, nav=nav, external_flow=flow,
        cash=nav-sum(h['quantity']*h['price'] for h in holdings),
        holdings=holdings, benchmark_value=benchmark,
    ).model_dump(mode='json')


def holding(ticker='MBB', price=25000, quantity=200, **kwargs):
    return dict(ticker=ticker, sector='banking', sleeve='RF', price=price, quantity=quantity, **kwargs)


class FundAnalyticsTest(unittest.TestCase):
    def test_extreme_flow_history_stays_json_safe_and_requests_review(self):
        rows = [snapshot((date(2026, 1, 1)+timedelta(days=i)).isoformat(), 1,
                         flow=-1e18 if i else 0) for i in range(30)]
        performance = build_fund_performance(rows)
        self.assertIsNone(performance['metrics']['twr_pct'])
        json.dumps(performance, allow_nan=False)
        risk = build_market_risk(rows, DEFAULT_GUARDRAILS, today=date(2026, 1, 30))
        self.assertTrue(risk['pause_recommended'])
        json.dumps(risk, allow_nan=False)

    def test_end_of_day_flow_does_not_inflate_twr_or_drawdown(self):
        rows = [snapshot('2026-01-05',100), snapshot('2026-01-06',160,50), snapshot('2026-01-07',140,-20)]
        p = build_fund_performance(rows)
        self.assertAlmostEqual(p['metrics']['twr_pct'],10)
        self.assertAlmostEqual(p['metrics']['net_pnl_vnd'],10)
        self.assertAlmostEqual(p['metrics']['current_drawdown_pct'],0)
        self.assertEqual(p['metrics']['longest_drawdown_days'],0)

    def test_drawdown_includes_unrealized_losses_and_recovery_duration(self):
        rows = [snapshot('2026-01-05',100),snapshot('2026-01-06',80),snapshot('2026-01-07',90),snapshot('2026-01-08',100)]
        p = build_fund_performance(rows)
        self.assertAlmostEqual(p['metrics']['max_drawdown_pct'],-20)
        self.assertEqual(p['metrics']['longest_drawdown_days'],3)
        self.assertEqual(p['metrics']['underwater_days'],0)

    def test_xirr_uses_actual_calendar_days_and_refuses_ambiguous_flows(self):
        self.assertAlmostEqual(xirr([(date(2025,1,1),-100),(date(2026,1,1),110)]),10)
        self.assertIsNone(xirr([(date(2025,1,1),-100),(date(2025,6,1),230),(date(2026,1,1),-132)]))

    def test_benchmark_requires_all_dates_and_consistent_identity(self):
        rows=[snapshot('2026-01-05',100,benchmark=1000),snapshot('2026-01-06',110,benchmark=1020)]
        self.assertAlmostEqual(build_fund_performance(rows)['metrics']['active_return_pp'],8)
        rows[-1]['benchmark_value']=None
        self.assertIsNone(build_fund_performance(rows)['metrics']['benchmark_return_pct'])
        rows[-1]['benchmark_value']=1020
        rows[-1]['benchmark_name']='VN30 (price)'
        self.assertIsNone(build_fund_performance(rows)['metrics']['benchmark_return_pct'])

    def test_daily_sharpe_requires_enough_consecutive_weekday_navs(self):
        rows=[]
        day=date(2026,1,5)
        nav=100
        while len(rows)<23:
            if day.weekday()<5:
                nav*=1.01 if len(rows)%2 else .995
                rows.append(snapshot(day.isoformat(),nav))
            day+=timedelta(days=1)
        self.assertIsNotNone(build_fund_performance(rows)['metrics']['sharpe'])
        self.assertIsNone(build_fund_performance(rows[:10])['metrics']['sharpe'])
        rows.pop(5)
        self.assertIsNone(build_fund_performance(rows)['metrics']['sharpe'])

    def test_validation_blocks_nonfinite_unreconciled_and_duplicate_holdings(self):
        for changes in [{'nav':float('nan')},{'nav':100,'cash':90},{'external_flow':100},
                        {'holdings':[holding(),holding()], 'nav':10000000,'cash':0}]:
            with self.subTest(changes=changes), self.assertRaises(ValidationError):
                NavSnapshot.model_validate({'trade_date':'2026-01-05','nav':100,'cash':100,**changes})

    def test_attribution_reconciles_with_unallocated_pnl(self):
        rows=[snapshot('2026-01-05',10000000),snapshot('2026-01-06',10100000,holdings=[holding(daily_pnl=120000)])]
        p=build_fund_performance(rows)
        self.assertEqual(p['attribution']['sleeve'][0]['pnl_vnd'],120000)
        self.assertEqual(p['unattributed_pnl_vnd'],-20000)

    def test_market_weights_stop_budgets_and_stress(self):
        rows=[snapshot('2026-01-05',10000000,holdings=[holding(target_weight_pct=10,stop_price=20000,risk_budget_pct=1)])]
        r=build_market_risk(rows,DEFAULT_GUARDRAILS,today=date(2026,1,5))
        self.assertEqual(r['exposure_pct'],50)
        self.assertEqual(r['positions'][0]['deviation_pp'],40)
        self.assertEqual(r['positions'][0]['stop_risk_pct'],10)
        self.assertTrue(r['positions'][0]['risk_budget_exceeded'])
        self.assertEqual(r['breakdown']['ticker'][0]['excess_pp'],40)
        self.assertEqual(r['scenarios'][0]['pnl_vnd'],-500000)
        self.assertTrue(r['pause_recommended'])

    def test_correlations_use_common_samples_and_sleeve_pnl(self):
        rows=[]
        day=date(2026,1,5)
        while len(rows)<23:
            if day.weekday()<5:
                value=(-1 if len(rows)%2 else 1)*(.5+len(rows)/100)
                a=holding(total_return_pct=value,daily_pnl=value*1000)
                b={**holding('FPT',total_return_pct=-value,daily_pnl=-value*1000),'sleeve':'EMA','sector':'technology'}
                rows.append(snapshot(day.isoformat(),100000000,holdings=[a,b]))
            day+=timedelta(days=1)
        r=build_market_risk(rows,DEFAULT_GUARDRAILS,today=day)
        self.assertAlmostEqual(r['correlations'][0]['correlation'],-1)
        self.assertAlmostEqual(r['correlations'][-1]['correlation'],-1)

    def test_nav_age_pause_policy_and_invalid_thresholds(self):
        r=build_market_risk([snapshot('2026-01-05',100)],DEFAULT_GUARDRAILS,today=date(2026,1,15))
        self.assertTrue(r['stale'])
        self.assertTrue(r['pause_recommended'])
        with self.assertRaises(ValidationError):
            RiskPolicy(warning_drawdown_pct=20,pause_drawdown_pct=10)


class FundAnalyticsAPITest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.store=SignalStore(Path(self.temp.name)/'test.db')
        self.store_patch=patch.object(main,'store',self.store)
        self.store_patch.start()
        self.settings_patch=patch.object(main,'settings',replace(main.settings,webhook_secret='test-secret'))
        self.settings_patch.start()
        self.client=TestClient(main.app)
        self.store.create_user(username='admin-test',password_hash=hash_password('test-password'),role='admin',features=[])
        self.client.post('/api/auth/login',json={'username':'admin-test','password':'test-password'})

    def tearDown(self):
        self.client.close()
        self.settings_patch.stop()
        self.store_patch.stop()
        self.temp.cleanup()

    def test_atomic_import_replacement_revision_and_validation(self):
        first=snapshot('2026-01-05',100)
        self.assertEqual(self.client.post('/api/admin/nav-snapshots',json={'snapshots':[first]}).status_code,200)
        changed=snapshot('2026-01-05',110)
        # A conflict must roll back rows earlier in the same batch.
        r=self.client.post('/api/admin/nav-snapshots',json={'snapshots':[snapshot('2026-01-06',120),changed]})
        self.assertEqual(r.status_code,409)
        self.assertEqual(len(self.store.list_nav_snapshots()),1)
        r=self.client.post('/api/admin/nav-snapshots',json={'snapshots':[changed],'replace_existing':True})
        self.assertEqual(r.status_code,200)
        with self.store.connect() as c:
            self.assertEqual(c.execute('SELECT COUNT(*) FROM nav_snapshot_revisions').fetchone()[0],2)
        bad={**first,'nav':999}
        self.assertEqual(self.client.post('/api/admin/nav-snapshots',json={'snapshots':[bad]}).status_code,422)

    def test_portfolio_access_and_readonly_permissions(self):
        self.client.cookies.clear()
        self.assertEqual(self.client.get('/api/fund-performance').status_code,401)
        for username,features,strategies,expected in [('restricted',['performance','overview'],['RF'],403),('viewer',['performance','overview'],[],200),('no-features',[],[],403)]:
            self.store.create_user(username=username,password_hash=hash_password('test-password'),role='user',features=features,strategies=strategies)
            self.client.post('/api/auth/login',json={'username':username,'password':'test-password'})
            self.assertEqual(self.client.get('/api/fund-performance').status_code,expected)
            self.assertEqual(self.client.get('/api/market-risk').status_code,expected)
            self.assertEqual(self.client.get('/api/admin/nav-snapshots').status_code,403)
            self.assertEqual(self.client.post('/api/admin/nav-snapshots',json={'snapshots':[snapshot('2026-01-05',100)]}).status_code,403)

    def test_optional_nav_pause_logs_authenticated_buy_but_preserves_exit(self):
        policy=RiskPolicy(pause_new_allocations=True).model_dump()
        self.client.patch('/api/admin/fund-risk-policy',json=policy)
        buy={'ticker':'HOSE:MBB','strategy':'RF Stock MTF','action':'buy','price':25000,'secret':'test-secret'}
        with patch.object(main,'enqueue_signal_enrichment'):
            r=self.client.post('/webhook',json=buy)
            self.assertEqual(r.status_code,200)
            self.assertEqual(r.json()['reason'],'nav_risk_pause')
            self.assertEqual(self.store.list_all_signals(),[])
            self.client.patch('/api/admin/fund-risk-policy',json={**policy,'pause_new_allocations':False})
            self.assertEqual(self.client.post('/webhook',json=buy).json()['status'],'accepted')
            self.client.patch('/api/admin/fund-risk-policy',json=policy)
            self.assertEqual(self.client.post('/webhook',json={**buy,'action':'sell'}).json()['status'],'accepted')
        self.assertEqual(self.client.get('/api/fund-performance').json()['status'],'empty')


if __name__ == '__main__':
    unittest.main()
