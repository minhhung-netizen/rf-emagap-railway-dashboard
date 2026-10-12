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


def workbook(day="05/01/2026", *, account="SYNTH0001", buys=100, sells=50, price=10000):
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
        sheet.append([1, "Mua", "ABC", buys, price, buys * price])
    if sells:
        sheet.append([2, "Bán", "ABC", sells, 12000, sells * 12000])
    target = io.BytesIO()
    book.save(target)
    book.close()
    return target.getvalue()


class TradeReconciliationAPITest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.store = SignalStore(Path(directory.name) / "signals.db")
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

    def report(self):
        response = self.client.get(BASE)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

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

    def test_negative_and_zero_daily_nets_never_decrement_accumulated_buy_surplus(self):
        self.assertEqual(self.upload("import", workbook(sells=0)).status_code, 200)
        for day, buys, sells in (("06/01/2026", 50, 100), ("07/01/2026", 50, 50), ("08/01/2026", 0, 200)):
            response = self.upload("import", workbook(day, buys=buys, sells=sells))
            self.assertEqual(response.status_code, 200, response.text)
        report = self.report()
        self.assertEqual(len(report["rows"]), 1)
        self.assertEqual(report["positions"][0]["quantity"], 100)
        self.assertEqual(report["positions"][0]["total_cost"], 1000000)
        self.assertEqual(report["positions"][0]["average_cost"], 10000)

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
        self.client.cookies.clear()
        self.assertEqual(self.client.get(BASE).status_code, 401)
        self.assertEqual(self.upload("preview").status_code, 401)
        for features, strategies, expected in (([], [], 403), (["tradeReconciliation"], ["RF"], 403), (["tradeReconciliation"], [], 200)):
            with self.subTest(features=features, strategies=strategies):
                self.authenticate("user", features=features, strategies=strategies)
                self.assertEqual(self.client.get(BASE).status_code, expected)
                self.assertEqual(self.upload("preview").status_code, 403)
                self.assertEqual(self.upload("import").status_code, 403)
                self.assertEqual(self.client.put(f"{BASE}/notes", json={}).status_code, 403)

    def test_invalid_uploads_are_actionable_and_have_no_side_effects(self):
        before = self.calculated(self.report())
        for content, filename in ((b"not an Excel workbook", "file.xlsx"), (workbook(), "file.csv")):
            with self.subTest(filename=filename):
                response = self.upload("preview", content, filename=filename)
                self.assertEqual(response.status_code, 422, response.text)
        response = self.client.post(f"{BASE}/preview", content=b"", headers={"Content-Length": "50000001", "X-Filename": "file.xlsx"})
        self.assertEqual(response.status_code, 413, response.text)
        self.assertEqual(self.calculated(self.report()), before)


if __name__ == "__main__":
    unittest.main()
