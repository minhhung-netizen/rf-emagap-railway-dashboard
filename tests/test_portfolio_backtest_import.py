import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from fastapi import HTTPException
from starlette.requests import Request

import app.main as dashboard_main
from app.database import SignalStore


def importer_request(token: str | None) -> Request:
    headers = [] if token is None else [(b"x-backtest-ingest-token", token.encode())]
    return Request({"type": "http", "headers": headers})


class PortfolioBacktestImportTest(unittest.TestCase):
    def test_import_requires_a_separate_token_and_saves_latest_snapshot(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            store = SignalStore(Path(temp_dir) / "signals.db")
            settings = replace(dashboard_main.settings, backtest_ingest_token="local-only-token")
            payload = dashboard_main.PortfolioBacktestImportPayload(
                source="rf-emagap-combined",
                report_date="2026-08-31",
                title="RF + EMA Gap Portfolio Monitor",
                summary={"variants": {"production": {"base": {"cagr": 0.2}}}},
            )
            with patch.object(dashboard_main, "store", store), patch.object(
                dashboard_main, "settings", settings
            ):
                with self.assertRaises(HTTPException) as denied:
                    dashboard_main.import_portfolio_backtest(payload, importer_request(None))
                self.assertEqual(denied.exception.status_code, 401)

                response = dashboard_main.import_portfolio_backtest(
                    payload, importer_request("local-only-token")
                )
                latest = dashboard_main.latest_portfolio_backtest()["backtest"]

            self.assertEqual(response["status"], "saved")
            self.assertEqual(latest["source"], "rf-emagap-combined")
            self.assertEqual(latest["summary"]["variants"]["production"]["base"]["cagr"], 0.2)
