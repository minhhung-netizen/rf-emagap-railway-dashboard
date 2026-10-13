import io
import tempfile
import unittest
from pathlib import Path
from urllib.parse import quote
from unittest.mock import patch

from fastapi.testclient import TestClient
from openpyxl import Workbook

from app import main
from app.database import SignalStore
from app.services.auth import SESSION_COOKIE, hash_password, new_session


BASE = "/api/trade-reconciliation"


def workbook(day="05/01/2026", *, account="SYNTH0001", buys=100, sells=50, price=10000, ticker="ABC"):
    """Synthetic broker report; never use actual customer account data in fixtures."""
    book = Workbook()
    sheet = book.active
    sheet.title = "match_orders"
    sheet.append([f"Ngày giao dịch: {day} 15:30:00"])
    sheet.append([f"Số tài khoản: {account}"])
    sheet.append(["Tiểu khoản: Thường"])
    sheet.append([])
    sheet.append(["STT", "Giao dịch", "Mã", "Khối lượng khớp", "Giá khớp bình quân", "Giá trị khớp"])
    if buys:
        sheet.append([1, "Mua", ticker, buys, price, buys * price])
    if sells:
        sheet.append([2, "Bán", ticker, sells, 12000, sells * 12000])
    target = io.BytesIO()
    book.save(target)
    book.close()
    return target.getvalue()


class TradeReconciliationAPITest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.database_path = Path(directory.name) / "signals.db"
        self.store = SignalStore(self.database_path)
        store_patch = patch.object(main, "store", self.store)
        store_patch.start()
        self.addCleanup(store_patch.stop)
        # Avoid application lifespan: these tests must not fetch market data.
        self.client = TestClient(main.app)
        self.addCleanup(self.client.close)
        self.user_number = 0
        self.authenticate("admin")

    def authenticate(self, role, *, features=None, strategies=None):
        self.user_number += 1
        user = self.store.create_user(
            username=f"reconciliation-{role}-{self.user_number}",
            password_hash=hash_password("synthetic-test-password"),
            role=role,
            features=features or [],
            strategies=strategies or [],
        )
        token, token_hash, expires_at = new_session(1)
        self.store.create_session(token_hash=token_hash, user_id=user["id"], expires_at=expires_at)
        self.client.cookies.set(SESSION_COOKIE, token)
        return user

    def upload(self, action, data=None, *, replace=False, filename="Báo cáo mẫu.xlsx"):
        return self.client.post(
            f"{BASE}/{action}",
            params={"replace_existing": "true"} if replace else {},
            content=data if data is not None else workbook(),
            headers={"Content-Type": "application/octet-stream", "X-Filename": quote(filename)},
        )

    def report(self, scope=None):
        response = self.client.get(BASE, params={"scope": scope} if scope else {})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def set_base(self, scope, *, ticker="ABC", quantity=10000):
        return self.client.put(f"{BASE}/bases", json={"scope": scope, "ticker": ticker, "base_quantity": quantity})

    def delete_import(self, scope, imported):
        return self.client.delete(f"{BASE}/imports/{imported['id']}", params={"scope": scope, "expected_revision": imported["revision"]})

    def delete_account(self, scope, revision):
        return self.client.delete(f"{BASE}/accounts/{scope}", params={"expected_revision": revision})

    def reconciliation_snapshot(self):
        with self.store.connect() as connection:
            return {table: [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY 1,2")]
                    for table in ("reconciliation_imports", "reconciliation_notes", "reconciliation_bases")}

    @staticmethod
    def calculated(report):
        return {key: report[key] for key in ("rows", "positions", "totals")}

    def test_preview_reads_excel_without_mutating_any_ledger(self):
        before = self.report()
        response = self.upload("preview")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.calculated(self.report()), self.calculated(before))
        self.assertEqual(self.store.list_all_signals(), [])
        self.assertEqual(self.store.list_nav_snapshots(), [])
        with self.store.connect() as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM ledger_entries").fetchone()[0], 0)

    def test_import_is_idempotent_and_conflict_requires_explicit_replacement(self):
        response = self.upload("import")
        self.assertEqual(response.status_code, 200, response.text)
        first = self.calculated(self.report())
        self.assertEqual(len(first["rows"]), 1)
        self.assertEqual(len(first["positions"]), 1)
        duplicate = self.upload("import", filename="renamed.xlsx")
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertEqual(self.calculated(self.report()), first)
        changed = workbook(buys=150)
        conflict = self.upload("import", changed)
        self.assertEqual(conflict.status_code, 409, conflict.text)
        self.assertEqual(self.calculated(self.report()), first)
        replacement = self.upload("import", changed, replace=True)
        self.assertEqual(replacement.status_code, 200, replacement.text)
        self.assertNotEqual(self.calculated(self.report()), first)
        self.assertEqual(len(self.report()["rows"]), 1)
        self.assertEqual(self.store.list_all_signals(), [])
        self.assertEqual(self.store.list_nav_snapshots(), [])

    def test_account_scope_isolated_and_filters_do_not_merge_accounts(self):
        for account in ("SYNTH0001", "OTHER0001"):
            response = self.upload("import", workbook(account=account))
            self.assertEqual(response.status_code, 200, response.text)
        report = self.report()
        self.assertEqual(len(report["scopes"]), 2)
        self.assertEqual(len({item["scope"] for item in report["scopes"]}), 2)
        # Each report is for one selected account, even when scope is omitted.
        self.assertEqual(len(report["positions"]), 1)
        scope = report["rows"][0]["scope"]
        filtered = self.client.get(BASE, params={"scope": scope})
        self.assertEqual(filtered.status_code, 200, filtered.text)
        self.assertEqual(len(filtered.json()["positions"]), 1)

    def test_backdated_replay_and_replacement_recalculate_positive_buy_surpluses(self):
        # Imported out of order: 50 surplus shares at 20,000 and 100 at 10,000.
        later = self.upload("import", workbook("06/01/2026", buys=100, sells=50, price=20000))
        self.assertEqual(later.status_code, 200, later.text)
        earlier = self.upload("import", workbook("05/01/2026", buys=100, sells=0))
        self.assertEqual(earlier.status_code, 200, earlier.text)
        report = self.report()
        position = report["positions"][0]
        self.assertEqual(position["quantity"], 150)
        self.assertEqual(position["total_cost"], 2000000)
        self.assertAlmostEqual(position["average_cost"], 2000000 / 150)
        day_two = next(row for row in report["rows"] if row["trade_date"] == "2026-01-06")
        self.assertEqual(day_two["opening_quantity"], 100)
        self.assertEqual(day_two["closing_quantity"], 150)
        self.assertEqual(day_two["residual_buy_quantity"], 50)
        self.assertEqual(day_two["buy_average_price"], 20000)
        replacement = self.upload("import", workbook("05/01/2026", buys=100, sells=0, price=30000), replace=True)
        self.assertEqual(replacement.status_code, 200, replacement.text)
        position = self.report()["positions"][0]
        self.assertEqual(position["quantity"], 150)
        self.assertEqual(position["total_cost"], 4000000)
        self.assertAlmostEqual(position["average_cost"], 4000000 / 150)

    def test_negative_daily_nets_reduce_surplus_and_zero_daily_net_keeps_average(self):
        self.assertEqual(self.upload("import", workbook(sells=0)).status_code, 200)
        for day, buys, sells in (("06/01/2026", 50, 100), ("07/01/2026", 50, 50)):
            response = self.upload("import", workbook(day, buys=buys, sells=sells))
            self.assertEqual(response.status_code, 200, response.text)
        report = self.report()
        self.assertEqual(report["method"], "daily_net_inventory_with_base")
        self.assertEqual(len(report["rows"]), 3)
        self.assertEqual(report["positions"][0]["quantity"], 50)
        self.assertEqual(report["positions"][0]["total_cost"], 500000)
        self.assertEqual(report["positions"][0]["average_cost"], 10000)
        sell_row = next(row for row in report["rows"] if row["trade_date"] == "2026-01-06")
        self.assertEqual(sell_row["tracked_sell_quantity"], 50)
        self.assertEqual(sell_row["ignored_sell_quantity"], 0)
        self.assertEqual(sell_row["closing_quantity"], 50)
        flat_row = next(row for row in report["rows"] if row["trade_date"] == "2026-01-07")
        self.assertEqual(flat_row["closing_quantity"], 50)
        self.assertEqual(flat_row["closing_average_cost"], 10000)

    def test_partial_sale_new_buy_and_backdated_replacement_replay_weighted_cost(self):
        # Imports deliberately arrive out of order; dates determine the replay.
        trades = (("08/01/2026", 300, 0, 40000), ("07/01/2026", 0, 300, 10000),
                  ("05/01/2026", 1000, 0, 20000), ("06/01/2026", 500, 0, 30000))
        for day, buys, sells, price in trades:
            response = self.upload("import", workbook(day, buys=buys, sells=sells, price=price))
            self.assertEqual(response.status_code, 200, response.text)
        report = self.report()
        sell_row = next(row for row in report["rows"] if row["trade_date"] == "2026-01-07")
        self.assertEqual(sell_row["opening_quantity"], 1500)
        self.assertEqual(sell_row["closing_quantity"], 1200)
        self.assertAlmostEqual(sell_row["opening_average_cost"], 35000000 / 1500)
        self.assertEqual(sell_row["closing_average_cost"], sell_row["opening_average_cost"])
        position = report["positions"][0]
        self.assertEqual(position["quantity"], 1500)
        self.assertEqual(position["total_cost"], 40000000)
        self.assertAlmostEqual(position["average_cost"], 40000000 / 1500)
        replacement = self.upload("import", workbook("05/01/2026", buys=500, sells=0, price=10000), replace=True)
        self.assertEqual(replacement.status_code, 200, replacement.text)
        position = self.report()["positions"][0]
        self.assertEqual(position["quantity"], 1000)
        self.assertEqual(position["total_cost"], 26000000)
        self.assertEqual(position["average_cost"], 26000)

    def test_protected_base_partial_close_oversell_and_reopen_never_consume_base(self):
        self.assertEqual(self.upload("import", workbook(buys=2000, sells=0, ticker="CII")).status_code, 200)
        scope = self.report()["selected_scope"]
        saved = self.set_base(scope, ticker="CII")
        self.assertEqual(saved.status_code, 200, saved.text)
        position = self.report()["positions"][0]
        self.assertEqual(position["base_quantity"], 10000)
        self.assertEqual(position["quantity"], 2000)
        self.assertEqual(position["total_quantity"], 12000)
        self.assertEqual(position["average_cost"], 10000)
        self.assertEqual(position["total_cost"], 20000000)
        response = self.upload("import", workbook("06/01/2026", buys=0, sells=500, ticker="CII"))
        self.assertEqual(response.status_code, 200, response.text)
        position = self.report()["positions"][0]
        self.assertEqual(position["quantity"], 1500)
        self.assertEqual(position["total_quantity"], 11500)
        self.assertEqual(position["average_cost"], 10000)
        response = self.upload("import", workbook("07/01/2026", buys=0, sells=2000, ticker="CII"))
        self.assertEqual(response.status_code, 200, response.text)
        report = self.report()
        position = report["positions"][0]
        self.assertEqual(position["base_quantity"], 10000)
        self.assertEqual(position["quantity"], 0)
        self.assertEqual(position["total_quantity"], 10000)
        self.assertIsNone(position["average_cost"])
        self.assertEqual(position["total_cost"], 0)
        self.assertEqual(position["status"], "base_only")
        oversell = next(row for row in report["rows"] if row["trade_date"] == "2026-01-07")
        self.assertEqual(oversell["tracked_sell_quantity"], 1500)
        self.assertEqual(oversell["ignored_sell_quantity"], 500)
        self.assertEqual(oversell["closing_total_quantity"], 10000)
        response = self.upload("import", workbook("08/01/2026", buys=1000, sells=0, price=20000, ticker="CII"))
        self.assertEqual(response.status_code, 200, response.text)
        position = self.report()["positions"][0]
        self.assertEqual(position["quantity"], 1000)
        self.assertEqual(position["total_quantity"], 11000)
        self.assertEqual(position["average_cost"], 20000)
        self.assertEqual(position["total_cost"], 20000000)
        changed = self.set_base(scope, ticker="CII", quantity=12000)
        self.assertEqual(changed.status_code, 200, changed.text)
        changed_position = self.report()["positions"][0]
        self.assertEqual(changed_position["total_quantity"], 13000)
        for field in ("quantity", "average_cost", "total_cost"):
            self.assertEqual(changed_position[field], position[field])

    def test_base_settings_persist_after_store_reopen_and_are_account_scoped(self):
        self.assertEqual(self.upload("import", workbook(sells=0)).status_code, 200)
        first = self.report()["selected_scope"]
        self.assertEqual(self.set_base(first).status_code, 200)
        # A ticker without executions can have an already-owned protected base.
        self.assertEqual(self.set_base(first, ticker="CII", quantity=5000).status_code, 200)
        self.assertEqual(self.upload("import", workbook(account="OTHER0001", sells=0, price=20000)).status_code, 200)
        report = self.report()
        second = next(item["scope"] for item in report["scopes"] if item["scope"] != first)
        self.assertEqual(self.set_base(second, quantity=20000).status_code, 200)
        reopened = SignalStore(self.database_path)
        with patch.object(main, "store", reopened):
            first_response = self.client.get(BASE, params={"scope": first})
            second_response = self.client.get(BASE, params={"scope": second})
        self.assertEqual(first_response.status_code, 200, first_response.text)
        self.assertEqual(second_response.status_code, 200, second_response.text)
        positions = {item["ticker"]: item for item in first_response.json()["positions"]}
        self.assertEqual(positions["ABC"]["base_quantity"], 10000)
        self.assertEqual(positions["ABC"]["total_quantity"], 10100)
        self.assertEqual(positions["CII"]["base_quantity"], 5000)
        self.assertEqual(positions["CII"]["quantity"], 0)
        self.assertIsNone(positions["CII"]["average_cost"])
        other = second_response.json()["positions"][0]
        self.assertEqual(other["base_quantity"], 20000)
        self.assertEqual(other["total_quantity"], 20100)
        self.assertEqual(other["average_cost"], 20000)
        self.assertEqual({row["ticker"] for row in first_response.json()["bases"]}, {"ABC", "CII"})

    def test_base_rejects_invalid_quantities_tickers_and_unknown_accounts_atomically(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        self.assertEqual(self.set_base(scope).status_code, 200)
        before = self.report()
        for quantity in (-1, True, False, 0.5, 10000.0, "10000", None, 10**12 + 1):
            with self.subTest(quantity=quantity):
                response = self.set_base(scope, quantity=quantity)
                self.assertEqual(response.status_code, 422, response.text)
        for unknown_scope, ticker in (("missing", "ABC"), (scope, "<script>"), (scope, "")):
            with self.subTest(scope=unknown_scope, ticker=ticker):
                response = self.set_base(unknown_scope, ticker=ticker)
                self.assertEqual(response.status_code, 422, response.text)
        after = self.report()
        self.assertEqual(self.calculated(after), self.calculated(before))
        self.assertEqual(after["bases"], before["bases"])
        zero = self.set_base(scope, quantity=0)
        self.assertEqual(zero.status_code, 200, zero.text)
        self.assertEqual(self.report()["positions"][0]["base_quantity"], 0)
        self.assertEqual(self.report()["positions"][0]["quantity"], 50)

    def test_notes_are_allowed_on_sell_and_flat_days_and_survive_replacement(self):
        self.assertEqual(self.upload("import", workbook(sells=0)).status_code, 200)
        row = self.report()["rows"][0]
        payload = {"scope": row["scope"], "trade_date": "2026-01-05", "ticker": "ABC", "note": "Theo dõi phần dư"}
        saved = self.client.put(f"{BASE}/notes", json=payload)
        self.assertEqual(saved.status_code, 200, saved.text)
        replacement = self.upload("import", workbook(buys=0, sells=100), replace=True)
        self.assertEqual(replacement.status_code, 200, replacement.text)
        self.assertEqual(self.report()["rows"][0]["note"], payload["note"])
        for day, buys, sells in (("06/01/2026", 0, 100), ("07/01/2026", 50, 50)):
            response = self.upload("import", workbook(day, buys=buys, sells=sells))
            self.assertEqual(response.status_code, 200, response.text)
            dated_payload = {**payload, "trade_date": "2026-01-06" if day == "06/01/2026" else "2026-01-07", "note": "Đã đối chiếu"}
            saved = self.client.put(f"{BASE}/notes", json=dated_payload)
            self.assertEqual(saved.status_code, 200, saved.text)
        report = self.report()
        self.assertEqual(len(report["rows"]), 3)
        self.assertTrue(all(row["note"] for row in report["rows"]))

    def test_notes_persist_and_cannot_create_rows_that_were_never_imported(self):
        self.assertEqual(self.upload("import").status_code, 200)
        row = self.report()["rows"][0]
        payload = {"scope": row["scope"], "trade_date": "2026-01-05", "ticker": "ABC", "note": "Chờ kiểm tra chiều mua"}
        response = self.client.put(f"{BASE}/notes", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.report()["rows"][0]["note"], payload["note"])
        at_limit = self.client.put(f"{BASE}/notes", json={**payload, "note": "x" * 2000})
        self.assertEqual(at_limit.status_code, 200, at_limit.text)
        for changes in ({"ticker": "UNKNOWN"}, {"trade_date": "2026-01-06"}, {"scope": "missing"}, {"note": "x" * 2001}):
            with self.subTest(changes=changes):
                response = self.client.put(f"{BASE}/notes", json={**payload, **changes})
                self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(len(self.report()["rows"]), 1)
        cleared = self.client.put(f"{BASE}/notes", json={**payload, "note": ""})
        self.assertEqual(cleared.status_code, 200, cleared.text)
        self.assertEqual(self.report()["rows"][0]["note"], "")

    def test_authorization_enforces_feature_strategy_scope_and_read_only_mutations(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        self.assertEqual(self.set_base(scope).status_code, 200)
        self.client.cookies.clear()
        self.assertEqual(self.client.get(BASE).status_code, 401)
        self.assertEqual(self.upload("preview").status_code, 401)
        self.assertEqual(self.client.put(f"{BASE}/bases", json={}).status_code, 401)
        for features, strategies, expected in (([], [], 403), (["tradeReconciliation"], ["RF"], 403), (["tradeReconciliation"], [], 200)):
            with self.subTest(features=features, strategies=strategies):
                self.authenticate("user", features=features, strategies=strategies)
                response = self.client.get(BASE)
                self.assertEqual(response.status_code, expected)
                if expected == 200:
                    self.assertEqual(response.json()["bases"][0]["base_quantity"], 10000)
                    self.assertEqual(response.json()["positions"][0]["total_quantity"], 10050)
                self.assertEqual(self.upload("preview").status_code, 403)
                self.assertEqual(self.upload("import").status_code, 403)
                self.assertEqual(self.client.put(f"{BASE}/notes", json={}).status_code, 403)
                self.assertEqual(self.client.put(f"{BASE}/bases", json={}).status_code, 403)

    def test_invalid_uploads_are_actionable_and_have_no_side_effects(self):
        before = self.calculated(self.report())
        for content, filename in ((b"not an Excel workbook", "file.xlsx"), (workbook(), "file.csv")):
            with self.subTest(filename=filename):
                response = self.upload("preview", content, filename=filename)
                self.assertEqual(response.status_code, 422, response.text)
        response = self.client.post(f"{BASE}/preview", content=b"", headers={"Content-Length": "50000001", "X-Filename": "file.xlsx"})
        self.assertEqual(response.status_code, 413, response.text)
        self.assertEqual(self.calculated(self.report()), before)

    def test_delete_import_removes_only_its_notes_preserves_base_and_replays_later_sales(self):
        for day, buys, sells, price in (("05/01/2026", 100, 0, 10000), ("06/01/2026", 100, 0, 20000), ("07/01/2026", 0, 50, 10000)):
            response = self.upload("import", workbook(day, buys=buys, sells=sells, price=price))
            self.assertEqual(response.status_code, 200, response.text)
        scope = self.report()["selected_scope"]
        self.assertEqual(self.set_base(scope).status_code, 200)
        for day in ("2026-01-05", "2026-01-06"):
            response = self.client.put(f"{BASE}/notes", json={"scope": scope, "trade_date": day, "ticker": "ABC", "note": f"Theo dõi {day}"})
            self.assertEqual(response.status_code, 200, response.text)
        before = self.report(scope)
        self.assertEqual(before["positions"][0]["quantity"], 150)
        self.assertEqual(before["positions"][0]["average_cost"], 15000)
        imported = next(item for item in before["imports"] if item["trade_date"] == "2026-01-06")
        self.assertRegex(imported["revision"], r"^[0-9a-f]{64}$")
        response = self.delete_import(scope, imported)
        self.assertEqual(response.status_code, 200, response.text)
        after = self.report(scope)
        self.assertEqual(len(after["imports"]), 2)
        self.assertEqual({row["trade_date"] for row in after["rows"]}, {"2026-01-05", "2026-01-07"})
        self.assertEqual(after["bases"], before["bases"])
        position = after["positions"][0]
        self.assertEqual(position["quantity"], 50)
        self.assertEqual(position["base_quantity"], 10000)
        self.assertEqual(position["total_quantity"], 10050)
        self.assertEqual(position["average_cost"], 10000)
        self.assertEqual(position["total_cost"], 500000)
        notes = self.reconciliation_snapshot()["reconciliation_notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["trade_date"], "2026-01-05")
        self.assertEqual(self.store.list_all_signals(), [])
        self.assertEqual(self.store.list_nav_snapshots(), [])
        with self.store.connect() as connection:
            self.assertEqual(connection.execute("SELECT COUNT(*) FROM ledger_entries").fetchone()[0], 0)

    def test_delete_last_import_preserves_a_readable_base_only_account(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        self.assertEqual(self.set_base(scope).status_code, 200)
        before = self.report(scope)
        response = self.delete_import(scope, before["imports"][0])
        self.assertEqual(response.status_code, 200, response.text)
        after = self.report(scope)
        self.assertEqual(after["imports"], [])
        self.assertEqual(after["rows"], [])
        self.assertEqual(after["bases"], before["bases"])
        self.assertEqual(after["selected_scope"], scope)
        position = after["positions"][0]
        self.assertEqual(position["status"], "base_only")
        self.assertEqual(position["quantity"], 0)
        self.assertEqual(position["total_quantity"], 10000)
        self.assertIsNone(position["average_cost"])
        # The retained account can still be explicitly cleared later.
        response = self.delete_account(scope, after["revision"])
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.report()["scopes"], [])

    def test_delete_account_clears_only_that_scope_then_reimport_has_no_old_notes_or_base(self):
        self.assertEqual(self.upload("import", workbook(sells=0)).status_code, 200)
        scope = self.report()["selected_scope"]
        self.assertEqual(self.set_base(scope).status_code, 200)
        self.assertEqual(self.set_base(scope, ticker="CII", quantity=5000).status_code, 200)
        note = {"scope": scope, "trade_date": "2026-01-05", "ticker": "ABC", "note": "Ghi chú tài khoản cần xóa"}
        self.assertEqual(self.client.put(f"{BASE}/notes", json=note).status_code, 200)
        self.assertEqual(self.upload("import", workbook("06/01/2026", sells=0)).status_code, 200)
        self.assertEqual(self.upload("import", workbook(account="OTHER0001", sells=0, price=20000)).status_code, 200)
        second_scope = next(item["scope"] for item in self.report()["scopes"] if item["scope"] != scope)
        self.assertEqual(self.set_base(second_scope, quantity=20000).status_code, 200)
        self.assertEqual(self.client.put(f"{BASE}/notes", json={**note, "scope": second_scope, "note": "Ghi chú được giữ"}).status_code, 200)
        unaffected = self.report(second_scope)
        before_snapshot = self.reconciliation_snapshot()
        revision = self.report(scope)["revision"]
        self.assertRegex(revision, r"^[0-9a-f]{64}$")
        response = self.delete_account(scope, revision)
        self.assertEqual(response.status_code, 200, response.text)
        after_snapshot = self.reconciliation_snapshot()
        for table in before_snapshot:
            self.assertEqual(after_snapshot[table], [row for row in before_snapshot[table] if row["scope"] != scope])
        after = self.report(second_scope)
        # Selector labels lose their hash suffix once the colliding account is
        # gone; quantities/costs and the persisted account contents stay intact.
        for key in ("rows", "positions"):
            self.assertEqual([{field: value for field, value in row.items() if field != "account_label"} for row in after[key]],
                             [{field: value for field, value in row.items() if field != "account_label"} for row in unaffected[key]])
        self.assertEqual(after["totals"], unaffected["totals"])
        self.assertEqual(after["bases"], unaffected["bases"])
        self.assertEqual(after["revision"], unaffected["revision"])
        self.assertEqual([item["scope"] for item in after["scopes"]], [second_scope])
        self.assertEqual(self.upload("import", workbook()).status_code, 200)
        restarted = self.report(scope)
        self.assertEqual(restarted["bases"], [])
        self.assertEqual(restarted["rows"][0]["note"], "")
        self.assertEqual(restarted["positions"][0]["quantity"], 50)
        self.assertEqual(restarted["positions"][0]["base_quantity"], 0)

    def test_delete_missing_and_cross_scope_imports_return_404_without_changes(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        imported = self.report(scope)["imports"][0]
        self.assertEqual(self.upload("import", workbook(account="OTHER0001")).status_code, 200)
        second_scope = next(item["scope"] for item in self.report()["scopes"] if item["scope"] != scope)
        before = self.reconciliation_snapshot()
        for target_scope, target_id in ((scope, imported["id"] + 1000), (second_scope, imported["id"]), ("acct_missing", imported["id"])):
            with self.subTest(scope=target_scope, import_id=target_id):
                response = self.client.delete(f"{BASE}/imports/{target_id}", params={"scope": target_scope, "expected_revision": imported["revision"]})
                self.assertEqual(response.status_code, 404, response.text)
                self.assertEqual(self.reconciliation_snapshot(), before)
        response = self.delete_account("acct_missing", "0" * 64)
        self.assertEqual(response.status_code, 404, response.text)
        self.assertEqual(self.reconciliation_snapshot(), before)
        self.assertEqual(self.delete_import(scope, imported).status_code, 200)
        after = self.reconciliation_snapshot()
        response = self.delete_import(scope, imported)
        self.assertEqual(response.status_code, 404, response.text)
        self.assertEqual(self.reconciliation_snapshot(), after)

    def test_stale_import_revision_blocks_replacement_and_note_changes_even_with_same_id(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        imported = self.report(scope)["imports"][0]
        replacement = self.upload("import", workbook(buys=200), replace=True)
        self.assertEqual(replacement.status_code, 200, replacement.text)
        replaced = self.report(scope)["imports"][0]
        self.assertEqual(replaced["id"], imported["id"])
        self.assertNotEqual(replaced["revision"], imported["revision"])
        before = self.reconciliation_snapshot()
        response = self.delete_import(scope, imported)
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(self.reconciliation_snapshot(), before)
        note = {"scope": scope, "trade_date": "2026-01-05", "ticker": "ABC", "note": "Mới cập nhật sau khi mở hộp xác nhận"}
        self.assertEqual(self.client.put(f"{BASE}/notes", json=note).status_code, 200)
        before = self.reconciliation_snapshot()
        response = self.delete_import(scope, replaced)
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(self.reconciliation_snapshot(), before)
        current = self.report(scope)["imports"][0]
        self.assertEqual(self.delete_import(scope, current).status_code, 200)

    def test_stale_account_revision_covers_new_imports_base_and_note_changes(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        for change in ("import", "base", "note"):
            with self.subTest(change=change):
                revision = self.report(scope)["revision"]
                if change == "import":
                    changed = self.upload("import", workbook("06/01/2026"))
                elif change == "base":
                    changed = self.set_base(scope)
                else:
                    changed = self.client.put(f"{BASE}/notes", json={"scope": scope, "trade_date": "2026-01-05", "ticker": "ABC", "note": "Cập nhật mới"})
                self.assertEqual(changed.status_code, 200, changed.text)
                self.assertNotEqual(self.report(scope)["revision"], revision)
                before = self.reconciliation_snapshot()
                response = self.delete_account(scope, revision)
                self.assertEqual(response.status_code, 409, response.text)
                self.assertEqual(self.reconciliation_snapshot(), before)

    def test_delete_requires_valid_scope_positive_id_and_revision_without_side_effects(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        imported = self.report(scope)["imports"][0]
        before = self.reconciliation_snapshot()
        requests = [(f"{BASE}/imports/{imported['id']}", {"scope": scope}),
                    (f"{BASE}/imports/{imported['id']}", {"expected_revision": imported["revision"]}),
                    (f"{BASE}/imports/{imported['id']}", {"scope": "", "expected_revision": imported["revision"]}),
                    (f"{BASE}/imports/{imported['id']}", {"scope": "x" * 65, "expected_revision": imported["revision"]}),
                    (f"{BASE}/accounts/{scope}", {}),
                    (f"{BASE}/accounts/{'x' * 65}", {"expected_revision": imported["revision"]})]
        for revision in ("", "0" * 63, "0" * 65, "z" * 64):
            requests.extend([(f"{BASE}/imports/{imported['id']}", {"scope": scope, "expected_revision": revision}),
                             (f"{BASE}/accounts/{scope}", {"expected_revision": revision})])
        for import_id in (0, -1, "not-an-id"):
            requests.append((f"{BASE}/imports/{import_id}", {"scope": scope, "expected_revision": imported["revision"]}))
        for path, params in requests:
            with self.subTest(path=path, params=params):
                response = self.client.delete(path, params=params)
                self.assertEqual(response.status_code, 422, response.text)
                self.assertEqual(self.reconciliation_snapshot(), before)

    def test_delete_endpoints_require_admin_for_anonymous_and_all_viewer_accounts(self):
        self.assertEqual(self.upload("import").status_code, 200)
        scope = self.report()["selected_scope"]
        report = self.report(scope)
        imported = report["imports"][0]
        before = self.reconciliation_snapshot()
        self.client.cookies.clear()
        self.assertEqual(self.delete_import(scope, imported).status_code, 401)
        self.assertEqual(self.delete_account(scope, report["revision"]).status_code, 401)
        self.assertEqual(self.reconciliation_snapshot(), before)
        for features, strategies in (([], []), (["tradeReconciliation"], []), (["tradeReconciliation"], ["RF"])):
            with self.subTest(features=features, strategies=strategies):
                self.authenticate("user", features=features, strategies=strategies)
                self.assertEqual(self.delete_import(scope, imported).status_code, 403)
                self.assertEqual(self.delete_account(scope, report["revision"]).status_code, 403)
                self.assertEqual(self.reconciliation_snapshot(), before)


if __name__ == "__main__":
    unittest.main()
