import json
import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError

import app.main as main
from app.database import SignalStore
from app.services.auth import hash_password
from app.services import trade_ledger as ledger
from app.services.fund_analytics import NavSnapshot, build_fund_performance


DAY = '2026-01-05'


def entry(ref, kind='deposit', day=DAY, **kwargs):
    return dict(reference=ref, kind=kind, trade_date=day, **kwargs)


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = SignalStore(Path(self.temp.name) / 'test.db')

    def tearDown(self):
        self.temp.cleanup()

    def add(self, *rows):
        return ledger.add_entries(self.store, ledger.EntryBatch(entries=list(rows)), 1)

    def price(self, day=DAY, price=26000, ticker='MBB'):
        return ledger.add_price(self.store, ledger.VerifiedPrice(trade_date=day, ticker=ticker,
            price=price, source='broker statement', evidence='Checked close in VND', confirmed=True), 1)

    def seed(self):
        self.add(entry('cash', amount=10000000), entry('buy', 'buy', ticker='MBB',
            sleeve='RF', quantity=100, price=25000, fees=2500))

    def close(self, day=DAY):
        return ledger.close_nav(self.store, ledger.CloseRequest(trade_date=day), 1)

    def test_partial_sell_cost_fees_dividends_and_total_pnl_identity(self):
        self.seed()
        self.add(entry('sell','sell',ticker='MBB',sleeve='RF',quantity=40,price=27000,fees=1080),
                 entry('div','dividend',ticker='MBB',amount=10000), entry('exp','expense',amount=1000))
        self.price()
        r=ledger.report(self.store, DAY)
        self.assertEqual(r['cash'],8585420)
        self.assertEqual(r['realized_pnl'],77920)
        self.assertEqual(r['holdings'][0]['cost'],1501500)
        self.assertEqual(r['unrealized_pnl'],58500)
        self.assertEqual(r['nav'],10145420)
        self.assertEqual(r['total_pnl'],r['realized_pnl']+r['unrealized_pnl']+r['dividend_income']-r['expenses'])

    def test_atomic_rollback_and_idempotency(self):
        row=entry('cash',amount=1000)
        self.assertEqual(self.add(row)['inserted'],1)
        self.assertEqual(self.add(row)['inserted'],0)
        with self.assertRaises(ValueError):
            self.add(entry('new',amount=100), entry('cash',amount=2000))
        self.assertEqual(len(ledger.report(self.store,DAY)['entries']),1)

    def test_oversell_insufficient_cash_and_backdated_replay(self):
        self.seed()
        for row in [entry('short','sell',ticker='MBB',sleeve='RF',quantity=101,price=26000),
                    entry('withdraw', 'withdraw',amount=9999999),
                    entry('early', 'withdraw',day='2026-01-04',amount=1)]:
            with self.assertRaises(ValueError): self.add(row)
        self.assertEqual(len(ledger.report(self.store,DAY)['entries']),2)

    def test_void_audit_and_dependency_protection(self):
        self.seed()
        with self.assertRaises(ValueError): ledger.void_entry(self.store,1,'wrong deposit',2)
        ledger.void_entry(self.store,2,'wrong execution',2)
        r=ledger.report(self.store,DAY)
        self.assertEqual(r['holdings'],[])
        self.assertEqual(r['entries'][1]['voided_by'],2)
        self.assertEqual(r['cash'],10000000)
        with self.assertRaises(ValueError):
            self.add(entry('buy','buy',ticker='MBB',sleeve='RF',quantity=100,price=25000,fees=2500))

    def test_missing_stale_future_and_price_revisions(self):
        self.seed()
        self.price(day='2026-01-04')
        self.price(day='2026-01-06')
        self.assertIsNone(ledger.report(self.store,DAY)['nav'])
        with self.assertRaises(ValueError): self.close()
        self.price(price=26000)
        self.price(price=27000)
        self.assertEqual(ledger.report(self.store,DAY)['nav'],10197500)
        self.assertEqual(len(ledger.report(self.store,DAY)['prices']),4)

    def test_close_publishes_nav_and_locks_entries_prices_manual_replacement(self):
        self.seed(); self.price()
        s=self.close()['snapshot']
        self.assertEqual(s['nav'],10097500)
        self.assertEqual(s['external_flow'],0)
        self.assertEqual(len(self.store.list_nav_snapshots()),1)
        for fn in [lambda:self.add(entry('late',amount=1)), lambda:self.price(),
                   lambda:ledger.void_entry(self.store,2,'wrong trade',1), lambda:self.close(),
                   lambda:self.store.import_nav_snapshots([s],user_id=1,replace_existing=True)]:
            with self.assertRaises(ValueError): fn()
        self.add(entry('next',day='2026-01-06',amount=1000))

    def test_flow_aggregation_across_nav_gap(self):
        self.seed();self.price();self.close()
        self.add(entry('more',day='2026-01-06',amount=1000000),
                 entry('less','withdraw',day='2026-01-07',amount=200000))
        self.price(day='2026-01-08')
        s=self.close('2026-01-08')['snapshot']
        self.assertEqual(s['external_flow'],800000)
        self.assertAlmostEqual(build_fund_performance(self.store.list_nav_snapshots())['metrics']['twr_pct'],0)

    def test_existing_manual_nav_requires_matching_baseline(self):
        self.seed();self.price(day='2026-01-06')
        old=NavSnapshot(trade_date=DAY,nav=10000000,cash=10000000).model_dump(mode='json')
        self.store.import_nav_snapshots([old],user_id=1)
        with self.assertRaises(ValueError): self.close('2026-01-06')
        self.assertIsNone(ledger.report(self.store,DAY)['locked_through'])
        self.price()
        old=NavSnapshot(trade_date=DAY,nav=10097500,cash=7497500,
            holdings=[dict(ticker='MBB',sleeve='RF',sector='unknown',quantity=100,price=26000)]).model_dump(mode='json')
        self.store.import_nav_snapshots([old],user_id=1,replace_existing=True)
        self.close('2026-01-06')
        self.assertEqual(len(self.store.list_nav_snapshots()),2)

    def test_validation(self):
        for row in [entry('x',amount=float('nan')),entry('x',amount=-1),entry('x',amount=1,fees=1),
                    entry('x',amount=1,day=(ledger.today()+timedelta(days=1)).isoformat()),
                    entry('x','buy',ticker='MBB',price=100,quantity=0),entry('x','dividend',amount=1)]:
            with self.assertRaises(ValidationError): ledger.Entry(**row)
        with self.assertRaises(ValidationError):
            ledger.VerifiedPrice(trade_date=DAY,ticker='MBB',price=1,source='abc',evidence='abc',confirmed=False)

    def test_rf_ema_are_separate_lots_but_same_ticker_mark(self):
        self.seed()
        self.add(entry('ema','buy',ticker='MBB',sleeve='EMA',quantity=100,price=26000))
        self.price()
        self.assertEqual(len(ledger.report(self.store,DAY)['holdings']),2)
        with self.assertRaises(ValueError):
            self.add(entry('sector','buy',ticker='MBB',sleeve='OTHER',sector='banking',quantity=1,price=1))

    def test_linkage_and_price_audit(self):
        signal=self.store.insert_signal(ticker='MBB',exchange='HOSE',action='buy',price=25,
            timeframe='60',strategy='RF',note='',source_time=None,payload={},
            enrichment={'status':'ok','history':[{'time':DAY,'close':26},{'time':DAY,'close':-1}]})
        current=ledger.today().isoformat()
        self.add(entry('cash',day=current,amount=10000000), entry('buy','buy',day=current,
            ticker='MBB',sleeve='RF',quantity=100,price=25000,signal_id=signal['id']))
        self.price(day=current,price=26000)
        self.price()
        r=ledger.report(self.store,current)
        w=r['webhooks'][0]
        self.assertEqual(w['fill_count'],1)
        self.assertEqual(w['signal_price_vnd'],25000)
        self.assertAlmostEqual(w['deviation_pct'],(25/26-1)*100)
        self.assertEqual(r['price_health'][0]['invalid_bars'],1)
        self.assertEqual(r['price_health'][0]['deviation_pct'],0)
        for row in [entry('wrong','buy',day=current,ticker='CSV',price=1,quantity=1,signal_id=signal['id']),
                    entry('wrong','sell',day=current,ticker='MBB',price=1,quantity=1,signal_id=signal['id']),
                    entry('wrong','buy',ticker='MBB',price=1,quantity=1,signal_id=signal['id'])]:
            with self.assertRaises(ValueError):self.add(row)
        json.dumps(r,allow_nan=False)


class LedgerAPITests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.store=SignalStore(Path(self.temp.name)/'test.db')
        self.store_patch=patch.object(main,'store',self.store)
        self.store_patch.start()
        self.client=TestClient(main.app)
        self.store.create_user(username='ledger-admin',password_hash=hash_password('test-password'),role='admin',features=[])
        self.client.post('/api/auth/login',json={'username':'ledger-admin','password':'test-password'})

    def tearDown(self):
        self.client.close();self.store_patch.stop();self.temp.cleanup()

    def test_api_validation_permissions_and_publish(self):
        path='/api/admin/ledger'
        self.assertEqual(self.client.get(path).status_code,200)
        self.assertEqual(self.client.post(path+'/entries',json={'entries':[entry('cash',amount=1000)]}).status_code,200)
        self.assertEqual(self.client.post(path+'/entries',json={'entries':[entry('cash',amount=2000)]}).status_code,409)
        self.assertEqual(self.client.post(path+'/entries',json={'entries':[entry('bad',amount=-1)]}).status_code,422)
        r=self.client.post(path+'/close',json={'trade_date':DAY})
        self.assertEqual(r.status_code,200,r.text)
        self.assertEqual(self.client.get('/api/fund-performance').json()['metrics']['nav'],1000)
        self.client.cookies.clear()
        self.assertEqual(self.client.get(path).status_code,401)
        self.store.create_user(username='viewer',password_hash=hash_password('test-password'),role='user',features=['performance'])
        self.client.post('/api/auth/login',json={'username':'viewer','password':'test-password'})
        self.assertEqual(self.client.get(path).status_code,403)
        self.assertEqual(self.client.post(path+'/close',json={'trade_date':DAY}).status_code,403)


if __name__ == '__main__':
    unittest.main()
