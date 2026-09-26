import unittest
from app.services.enrichment import (
    DnseEnricher,
    DnseRestClient,
    FireAntEnricher,
    MarketDataEnricher,
    VnstockEnricher,
    VnstockRateLimiter,
    _dnse_ohlc_records,
    _normalize_dnse_stock_history,
    _fireant_dividend_events,
    _normalize_fireant_history,
    coerce_float,
    normalize_action,
    normalize_stock_price,
    normalize_ticker,
)


class EnrichmentHelpersTest(unittest.TestCase):
    def test_vnstock_rate_limiter_stays_below_free_tier_limit(self):
        clock = [0.0]
        sleeps = []

        def sleep(seconds):
            sleeps.append(seconds)
            clock[0] += seconds

        limiter = VnstockRateLimiter(
            max_requests_per_minute=3,
            min_request_interval_seconds=0,
            monotonic=lambda: clock[0],
            sleeper=sleep,
        )

        for _ in range(4):
            limiter.wait()

        self.assertEqual(sleeps, [60.0])

    def test_vnstock_rate_limiter_caps_configuration_at_nineteen(self):
        limiter = VnstockRateLimiter(
            max_requests_per_minute=20,
            min_request_interval_seconds=0,
        )

        self.assertEqual(limiter.max_requests, 19)

    def test_normalize_ticker_removes_exchange_prefix(self):
        self.assertEqual(normalize_ticker("HOSE:VPB"), ("VPB", "HOSE"))

    def test_normalize_ticker_keeps_plain_symbol(self):
        self.assertEqual(normalize_ticker(" vpb "), ("VPB", None))

    def test_normalize_ticker_accepts_tradingview_adjusted_symbol_object(self):
        self.assertEqual(
            normalize_ticker({"adjustment": "dividends", "symbol": "HOSE:HHS"}),
            ("HHS", "HOSE"),
        )

    def test_normalize_ticker_accepts_tradingview_adjusted_symbol_string(self):
        self.assertEqual(
            normalize_ticker('={"adjustment":"dividends","symbol":"HOSE:HHS"}'),
            ("HHS", "HOSE"),
        )

    def test_normalize_action_aliases(self):
        self.assertEqual(normalize_action("long"), "buy")
        self.assertEqual(normalize_action("exit"), "sell")
        self.assertEqual(normalize_action("confirm-buy"), "confirm_buy")
        self.assertEqual(normalize_action("confirmation_sell"), "confirm_sell")
        self.assertEqual(normalize_action("confi m_buy"), "confirm_buy")
        self.assertEqual(normalize_action("confim_buy"), "confirm_buy")
        self.assertEqual(normalize_action("confi m_sell"), "confirm_sell")
        self.assertEqual(normalize_action("confim_sell"), "confirm_sell")

    def test_coerce_float_accepts_tradingview_strings(self):
        self.assertEqual(coerce_float("19,500"), 19500.0)
        self.assertIsNone(coerce_float(""))

    def test_normalize_stock_price_converts_vnd_to_thousand_unit(self):
        self.assertEqual(normalize_stock_price("74400"), 74.4)
        self.assertEqual(normalize_stock_price("13.95"), 13.95)

    def test_normalize_stock_price_keeps_vnindex_points(self):
        self.assertEqual(normalize_stock_price("1876", ticker="VNINDEX"), 1876)
        self.assertEqual(
            normalize_stock_price("1876.75", ticker="VNINDEX", exchange="HOSE"),
            1876.75,
        )
        self.assertEqual(normalize_stock_price("1876", exchange="VNINDEX"), 1876)

    def test_enricher_handles_non_exception_vnstock_failures(self):
        class ExplodingEnricher(VnstockEnricher):
            def _enrich_with_vnstock(self, ticker):
                raise SystemExit("vnstock exited")

        result = ExplodingEnricher().enrich("VPB")

        self.assertEqual(result["status"], "unavailable")
        self.assertEqual(result["ticker"], "VPB")
        self.assertEqual(result["history"], [])
        self.assertEqual(result["metrics"], {})

    def test_enricher_caches_by_ticker(self):
        class CountingEnricher(VnstockEnricher):
            def __init__(self):
                super().__init__(cache_ttl_seconds=60, min_request_interval_seconds=0)
                self.calls = 0

            def _enrich_with_vnstock(self, ticker):
                self.calls += 1
                return {
                    "status": "ok",
                    "ticker": ticker,
                    "history": [{"close": 10}],
                    "metrics": {},
                }

        enricher = CountingEnricher()

        first = enricher.enrich("VPB")
        second = enricher.enrich("VPB")
        first["history"][0]["close"] = 99

        self.assertEqual(enricher.calls, 1)
        self.assertEqual(second["history"][0]["close"], 10)

    def test_enricher_force_bypasses_cache(self):
        class CountingEnricher(VnstockEnricher):
            def __init__(self):
                super().__init__(cache_ttl_seconds=60, min_request_interval_seconds=0)
                self.calls = 0

            def _enrich_with_vnstock(self, ticker):
                self.calls += 1
                return {
                    "status": "ok",
                    "ticker": ticker,
                    "history": [{"close": self.calls}],
                    "metrics": {},
                }

        enricher = CountingEnricher()

        first = enricher.enrich("VPB")
        second = enricher.enrich("VPB", force=True)

        self.assertEqual(enricher.calls, 2)
        self.assertEqual(first["history"][0]["close"], 1)
        self.assertEqual(second["history"][0]["close"], 2)

    def test_market_data_enricher_prefers_vnstock(self):
        class Stub:
            def __init__(self, source):
                self.source = source
                self.calls = 0

            def enrich(self, ticker, force=False):
                self.calls += 1
                return {
                    "status": "ok",
                    "source": self.source,
                    "history": [{"close": 25}],
                }

        vnstock = Stub("vnstock")
        fireant = Stub("fireant")
        dnse = Stub("dnse")
        result = MarketDataEnricher(
            fireant=fireant,
            dnse=dnse,
            vnstock=vnstock,
            prefer_vnstock=True,
        ).enrich("SSI", force=True)

        self.assertEqual(result["source"], "vnstock")
        self.assertEqual(vnstock.calls, 1)
        self.assertEqual(fireant.calls, 0)
        self.assertEqual(dnse.calls, 0)

    def test_dnse_ohlc_records_supports_tradingview_array_shape(self):
        records = _dnse_ohlc_records(
            {
                "t": [1700000000, 1700086400],
                "o": [10, 11],
                "h": [12, 13],
                "l": [9, 10],
                "c": [11, 12],
                "v": [100, 200],
            }
        )

        self.assertEqual(records[-1]["close"], 12)
        self.assertEqual(records[-1]["volume"], 200)

    def test_dnse_stock_history_normalizes_vnd_prices(self):
        records = _normalize_dnse_stock_history(
            [{"time": 1700000000, "open": 74000, "high": 75000, "low": 73000, "close": 74500}]
        )

        self.assertEqual(records[0]["close"], 74.5)
        self.assertTrue(records[0]["time"].startswith("2023-"))

    def test_dnse_enricher_uses_latest_trade_as_current_close(self):
        class FakeClient:
            def __init__(self, **kwargs):
                pass

            def get_ohlc(self, **kwargs):
                return 200, '{"t":[1700000000],"o":[10],"h":[12],"l":[9],"c":[11],"v":[100]}'

            def get_latest_trade(self, **kwargs):
                return 200, '{"price":11.5}'

        enricher = DnseEnricher(
            api_key="key",
            api_secret="secret",
            min_request_interval_seconds=0,
            client=FakeClient(),
        )

        result = enricher.enrich("VPB")

        self.assertEqual(result["status"], "ok")
        self.assertEqual(result["source"], "dnse")
        self.assertEqual(result["history"][-1]["close"], 11.5)

    def test_fireant_enricher_returns_daily_history_and_dividend_events(self):
        class FakeClient:
            def get_historical_quotes(self, **kwargs):
                return [
                    {
                        "date": "2026-06-09T00:00:00",
                        "priceOpen": 74000,
                        "priceHigh": 75000,
                        "priceLow": 73000,
                        "priceClose": 74500,
                        "totalVolume": 1000,
                    }
                ]

            def get_timescale_marks(self, **kwargs):
                return [
                    {
                        "id": "event-1",
                        "label": "D",
                        "date": "2026-06-20T00:00:00",
                        "title": "Ngày GDKHQ trả cổ tức bằng tiền",
                    }
                ]

            def get_dividends(self, **kwargs):
                return [{"year": 2025, "cashDividend": 1000}]

        result = FireAntEnricher(
            access_token="token",
            min_request_interval_seconds=0,
            client=FakeClient(),
        ).enrich("FPT")

        self.assertEqual(result["source"], "fireant")
        self.assertEqual(result["history"][0]["close"], 74.5)
        self.assertEqual(result["dividend_events"][0]["ex_date"], "2026-06-20")
        self.assertEqual(result["dividend_summary"][0]["cashDividend"], 1000)

    def test_fireant_helpers_filter_non_dividend_marks(self):
        history = _normalize_fireant_history(
            [
                {
                    "date": "2026-06-10",
                    "priceOpen": 10,
                    "priceHigh": 12,
                    "priceLow": 9,
                    "priceClose": 11,
                    "totalVolume": 200,
                }
            ]
        )
        events = _fireant_dividend_events(
            "FPT",
            [
                {"id": "1", "date": "2026-06-20", "title": "Cổ tức bằng cổ phiếu"},
                {"id": "2", "date": "2026-06-21", "title": "Báo cáo tài chính"},
            ],
        )

        self.assertEqual(history[0]["volume"], 200)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["external_id"], "FPT:1")

    def test_market_data_uses_fireant_history_and_dnse_latest_price(self):
        class FireAntStub:
            def enrich(self, ticker, force=False):
                return {
                    "status": "ok",
                    "source": "fireant",
                    "history": [{"time": "2026-06-10", "close": 10}],
                    "dividend_events": [],
                }

        class DnseStub:
            def latest_price(self, ticker):
                return 11

        result = MarketDataEnricher(
            fireant=FireAntStub(),
            dnse=DnseStub(),
            vnstock=None,
        ).enrich("FPT")

        self.assertEqual(result["source"], "fireant")
        self.assertEqual(result["latest_price_source"], "dnse")
        self.assertEqual(result["history"][-1]["close"], 11)

    def test_market_data_enricher_falls_back_to_vnstock(self):
        class Stub:
            def __init__(self, result):
                self.result = result

            def enrich(self, ticker, force=False):
                return dict(self.result)

        enricher = MarketDataEnricher(
            dnse=Stub({"status": "unavailable", "message": "DNSE down", "history": []}),
            vnstock=Stub({"status": "ok", "history": [{"close": 20}], "metrics": {}}),
        )

        result = enricher.enrich("VPB")

        self.assertEqual(result["source"], "vnstock")
        self.assertEqual(result["fallback_from"], "dnse")
        self.assertEqual(result["history"][-1]["close"], 20)

    def test_dnse_rest_client_builds_signed_headers_without_exposing_secret(self):
        client = DnseRestClient(
            api_key="public-key",
            api_secret="private-secret",
            base_url="https://openapi.dnse.com.vn",
            api_version="2026-05-07",
        )

        headers = client._signed_headers("GET", "/price/VPB/trades/latest")

        self.assertEqual(headers["x-api-key"], "public-key")
        self.assertEqual(headers["version"], "2026-05-07")
        self.assertIn('algorithm="hmac-sha256"', headers["X-Signature"])
        self.assertNotIn("private-secret", str(headers))


if __name__ == "__main__":
    unittest.main()
