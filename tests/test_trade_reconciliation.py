import json
import re
import tempfile
import unittest
import zipfile
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from openpyxl import Workbook

from app.database import SignalStore
from app.services import trade_reconciliation as service


HEADERS = ["STT", "Giao dịch", "Mã", "Khối lượng khớp", "Giá khớp bình quân", "Giá trị khớp"]


def workbook(rows=None, day="05/01/2026", account="SYNTH0001", subaccount="Thường", totals=None):
    """Synthetic report only; no user statement data or account identifiers."""
    book = Workbook()
    sheet = book.active
    sheet.title = "match_orders"
    sheet.append([f"Ngày giao dịch: {day} 15:30:00"])
    sheet.append([f"Số tài khoản: {account}"])
    sheet.append([f"Tiểu khoản: {subaccount}"])
    if totals is not None:
        for side, amount in totals.items():
            sheet.append([f"Tổng giá trị {side}: {amount}"])
    sheet.append(HEADERS)
    for i, row in enumerate(rows or [], 1):
        sheet.append([i, *row])
    buffer = BytesIO()
    book.save(buffer)
    book.close()
    return buffer.getvalue()


def parse(rows, **kwargs):
    return service.parse_workbook(workbook(rows, **kwargs), "report.xlsx")


def buy(qty=100, price=10000, ticker="ABC"):
    return ["Mua", ticker, qty, price, qty * price]


def sell(qty=50, price=12000, ticker="ABC"):
    return ["Bán", ticker, qty, price, qty * price]


class WorkbookTests(unittest.TestCase):
    def test_template_numeric_strings_totals_and_authoritative_average(self):
        report = parse([["Mua", "abc", "1,000", "11,487.500000", "11,487,500"],
                        ["Bán", "ABC", "700", "11,542.857143", "8,080,000"]],
                       totals={"mua": "11,487,500", "bán": "8,080,000", "khớp": "19,567,500"})
        self.assertEqual(report["trade_date"], "2026-01-05")
        self.assertEqual(report["currency"], "VND")
        self.assertEqual(len(report["rows"]), 1)
        row = report["rows"][0]
        self.assertEqual(row["residual_buy_quantity"], 300)
        self.assertEqual(row["matched_quantity"], 700)
        self.assertEqual(row["buy_average_price"], 11487.5)
        self.assertAlmostEqual(row["sell_average_price"], 8080000 / 700)
        self.assertEqual(row["buy_amount_exact"], "11487500")

    def test_duplicate_rows_aggregate_and_digest_ignores_filename_order_numeric_format(self):
        original = service.parse_workbook(workbook([buy(50), buy(50), sell(20)]), "one.xlsx")
        reordered = service.parse_workbook(workbook([sell(20), ["Mua", "ABC", "100.0", "10000.000000", "1000000.00"]]), "two.xlsx")
        self.assertEqual(original["digest"], reordered["digest"])
        self.assertEqual(original["rows"], reordered["rows"])
        self.assertEqual(original["rows"][0]["buy_quantity"], 100)

    def test_masked_label_and_account_subaccount_scopes_are_isolated(self):
        a = parse([buy()], account="SYNTH0001")
        b = parse([buy()], account="OTHER0001")
        c = parse([buy()], account="SYNTH0001", subaccount="Ký quỹ")
        self.assertNotIn("SYNTH0001", json.dumps(a, ensure_ascii=False))
        self.assertIn("0001", a["account_label"])
        self.assertNotEqual(a["scope"], b["scope"])
        self.assertNotEqual(a["scope"], c["scope"])

    def test_incorrect_A1_dimension_does_not_truncate_rows(self):
        data = workbook([buy(), sell()])
        target = BytesIO()
        with zipfile.ZipFile(BytesIO(data)) as source, zipfile.ZipFile(target, "w") as destination:
            for item in source.infolist():
                content = source.read(item.filename)
                if item.filename == "xl/worksheets/sheet1.xml":
                    content = re.sub(rb'<dimension ref="[^"]+"', b'<dimension ref="A1"', content)
                destination.writestr(item, content)
        result = service.parse_workbook(target.getvalue(), "dimension.xlsx")
        self.assertEqual(result["rows"][0]["sell_quantity"], 50)

    def test_reject_missing_invalid_future_date_and_missing_account(self):
        for values in [dict(day="31/02/2026"), dict(day="05/01/2099"), dict(account="")]:
            with self.subTest(values=values), self.assertRaises(ValueError):
                parse([buy()], **values)
        book = Workbook()
        book.active.append(HEADERS)
        book.active.append([1, *buy()])
        buffer = BytesIO(); book.save(buffer); book.close()
        with self.assertRaisesRegex(ValueError, "Ngày giao dịch"):
            service.parse_workbook(buffer.getvalue(), "missing.xlsx")

    def test_reject_invalid_numeric_side_ticker_formulas_and_totals(self):
        invalid = [
            ["Mua", "ABC", "1,00", 10000, 1000000],
            ["Mua", "ABC", 0.5, 10000, 5000],
            ["Mua", "ABC", 0, 10000, 0],
            ["Mua", "ABC", 100, "NaN", 1000000],
            ["Mua", "ABC", 100, "Infinity", 1000000],
            ["Mua", "ABC", 100, "1e-999999999", "1e-999999997"],
            ["Mua", "ABC", 100, 9999, 1000000],
            ["Buy", "ABC", 100, 10000, 1000000],
            ["Mua", "<script>", 100, 10000, 1000000],
            ["Mua", "ABC", "=50+50", 10000, 1000000],
        ]
        for row in invalid:
            with self.subTest(row=row), self.assertRaises(ValueError):
                parse([row])
        with self.assertRaisesRegex(ValueError, "Tổng giá trị"):
            parse([buy()], totals={"mua": 999999})

    def test_reject_malformed_empty_multiple_report_sheets_and_limits(self):
        for data, name in [(b"not an excel", "report.xlsx"), (workbook([buy()]), "report.xls"), (workbook([]), "empty.xlsx")]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                service.parse_workbook(data, name)
        book = Workbook()
        for sheet in (book.active, book.create_sheet("second")):
            sheet.append(["Ngày giao dịch: 05/01/2026"])
            sheet.append(["Số tài khoản: SYNTH0001"])
            sheet.append(HEADERS)
            sheet.append([1, *buy()])
        buffer = BytesIO(); book.save(buffer); book.close()
        with self.assertRaisesRegex(ValueError, "đúng một bảng"):
            service.parse_workbook(buffer.getvalue(), "multiple.xlsx")
        with patch.object(service, "MAX_FILE_BYTES", 1), self.assertRaisesRegex(ValueError, "10 MB"):
            parse([buy()])
        with patch.object(service, "MAX_EXPANDED_BYTES", 1), self.assertRaisesRegex(ValueError, "50 MB"):
            parse([buy()])


class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = SignalStore(Path(self.temp.name) / "test.db")

    def tearDown(self):
        self.temp.cleanup()

    def add(self, rows, *, replace=False, **kwargs):
        parsed = parse(rows, **kwargs)
        return service.import_report(self.store, parsed, "tester", replace), parsed

    def test_daily_net_residual_and_weighted_buy_cost_only(self):
        self.add([buy(100, 10000), sell(40)])
        self.add([buy(100, 20000), sell(50)], day="06/01/2026")
        report = service.build_report(self.store)
        self.assertEqual(report["method"], "daily_buy_surplus_weighted_average")
        position = report["positions"][0]
        self.assertEqual(position["quantity"], 110)
        self.assertEqual(position["total_cost"], 1600000)
        self.assertAlmostEqual(position["average_cost"], 1600000 / 110)
        newest = report["rows"][0]
        self.assertEqual(newest["opening_quantity"], 60)
        self.assertEqual(newest["opening_average_cost"], 10000)
        self.assertEqual(newest["residual_buy_cost"], 1000000)
        self.assertEqual(newest["closing_quantity"], 110)

    def test_equal_and_excess_sales_never_reduce_previous_buy_inventory(self):
        self.add([buy(100, 10000)])
        self.add([buy(100, 20000), sell(100)], day="06/01/2026")
        self.add([buy(50, 20000), sell(1000)], day="07/01/2026")
        self.add([sell(99999)], day="08/01/2026")
        report = service.build_report(self.store)
        self.assertEqual(len(report["rows"]), 1)
        self.assertEqual(report["positions"][0]["quantity"], 100)
        self.assertEqual(report["positions"][0]["average_cost"], 10000)
        self.assertEqual(report["totals"]["ignored_rows_count"], 3)
        self.assertNotIn("unmatched_sell_quantity", report["totals"])
        self.add([buy(100, 20000)], day="09/01/2026")
        position = service.build_report(self.store)["positions"][0]
        self.assertEqual(position["quantity"], 200)
        self.assertEqual(position["average_cost"], 15000)

    def test_sell_only_import_does_not_offset_future_buy(self):
        self.add([sell(1000)])
        self.assertEqual(service.build_report(self.store)["positions"], [])
        self.add([buy(10)], day="06/01/2026")
        self.assertEqual(service.build_report(self.store)["positions"][0]["quantity"], 10)

    def test_out_of_order_and_backdated_replacement_recompute_all_later_balances(self):
        self.add([buy(100, 20000)], day="07/01/2026")
        self.add([buy(100, 10000)], day="05/01/2026")
        report = service.build_report(self.store)
        self.assertEqual(report["positions"][0]["average_cost"], 15000)
        self.assertEqual(report["rows"][0]["opening_quantity"], 100)
        self.add([buy(50, 10000)], day="05/01/2026", replace=True)
        report = service.build_report(self.store)
        self.assertEqual(report["rows"][0]["opening_quantity"], 50)
        self.assertEqual(report["positions"][0]["quantity"], 150)
        self.assertAlmostEqual(report["positions"][0]["average_cost"], 2500000 / 150)

    def test_duplicate_conflict_and_atomic_replacement(self):
        result, parsed = self.add([buy()])
        self.assertEqual(result["inserted"], 1)
        self.assertEqual(service.assess_import(self.store, parsed), "duplicate")
        self.assertTrue(service.import_report(self.store, parsed, "another")["duplicate"])
        changed = parse([buy(200)])
        self.assertEqual(service.assess_import(self.store, changed), "conflict")
        before = service.build_report(self.store)
        with self.assertRaises(service.ReconciliationConflict):
            service.import_report(self.store, changed, "another")
        self.assertEqual(service.build_report(self.store), before)
        result = service.import_report(self.store, changed, "another", True)
        self.assertTrue(result["replaced"])
        self.assertEqual(service.build_report(self.store)["positions"][0]["quantity"], 200)
        self.assertEqual(service.build_report(self.store)["totals"]["imports_count"], 1)

    def test_accounts_and_subaccounts_never_mix_costs(self):
        _, first = self.add([buy(100, 10000)], account="SYNTH0001")
        self.add([buy(100, 20000)], account="OTHER0001")
        self.add([buy(100, 30000)], account="SYNTH0001", subaccount="Ký quỹ")
        report = service.build_report(self.store)
        self.assertEqual(len(report["scopes"]), 3)
        self.assertEqual(len(report["positions"]), 1)
        self.assertTrue(report["selected_scope"])
        scoped = service.build_report(self.store, first["scope"])
        self.assertEqual(len(scoped["positions"]), 1)
        self.assertEqual(scoped["positions"][0]["average_cost"], 10000)
        with self.assertRaises(ValueError):
            service.build_report(self.store, "unknown")

    def test_colliding_masked_accounts_have_stable_distinct_selector_labels(self):
        _, first = self.add([buy(100, 10000)], account="SYNTH0001")
        _, second = self.add([buy(100, 20000)], account="OTHER0001")
        self.assertEqual(first["account_label"], second["account_label"])
        report = service.build_report(self.store)
        labels = {item["scope"]: item["account_label"] for item in report["scopes"]}
        self.assertEqual(len(set(labels.values())), 2)
        for parsed in (first, second):
            self.assertEqual(labels[parsed["scope"]], parsed["account_label"] + " · #" + parsed["scope"][-6:])
        selected = report["selected_scope"]
        self.add([buy(10)], day="06/01/2026", account="SYNTH0001")
        later = service.build_report(self.store)
        self.assertEqual(later["selected_scope"], selected)
        self.assertEqual({item["scope"]: item["account_label"] for item in later["scopes"]}, labels)

    def test_notes_persist_with_valid_daily_surplus_and_removed_rows_are_pruned(self):
        _, parsed = self.add([buy(), buy(10, ticker="XYZ")])
        saved = service.save_note(self.store, parsed["scope"], parsed["trade_date"], "abc", " Theo dõi mua ", "tester")
        self.assertEqual(saved["note"], "Theo dõi mua")
        report = service.build_report(self.store)
        self.assertEqual(next(r for r in report["rows"] if r["ticker"] == "ABC")["note"], "Theo dõi mua")
        self.add([buy(200)], replace=True)
        self.assertEqual(service.build_report(self.store)["rows"][0]["note"], "Theo dõi mua")
        self.add([sell()], replace=True)
        with self.store.connect() as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM reconciliation_notes").fetchone()[0], 0)
        with self.assertRaises(ValueError):
            service.save_note(self.store, parsed["scope"], parsed["trade_date"], "ABC", "cannot note sell", "tester")
        with self.assertRaises(ValueError):
            service.save_note(self.store, parsed["scope"], parsed["trade_date"], "XYZ", "x" * 2001, "tester")

    def test_decimal_source_values_are_preserved_and_no_ledger_or_nav_writes(self):
        self.add([["Mua", "ABC", 3, "0.1", "0.3"], ["Bán", "ABC", 1, "0.2", "0.2"]])
        self.add([["Mua", "ABC", 3, "0.2", "0.6"]], day="06/01/2026")
        position = service.build_report(self.store)["positions"][0]
        self.assertEqual(position["quantity"], 5)
        self.assertAlmostEqual(position["total_cost"], 0.8)
        self.assertAlmostEqual(position["average_cost"], 0.16)
        with self.store.connect() as conn:
            raw = json.loads(conn.execute("SELECT rows_json FROM reconciliation_imports ORDER BY trade_date").fetchone()[0])
            self.assertEqual(raw[0]["buy_amount"], "0.3")
            for table in ("ledger_entries", "ledger_closes", "nav_snapshots"):
                self.assertEqual(conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
