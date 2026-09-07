import unittest

from app.services.webhook_payload import (
    parse_forgiving_json,
    parse_tradingview_alert_text,
)


class WebhookPayloadParsingTest(unittest.TestCase):
    def test_repairs_tradingview_equals_after_key(self):
        data = parse_forgiving_json(
            '{"ticker":={"adjustment":"dividends","symbol":"HOSE:HHS"},'
            '"action":"sell","price":"11700"}'
        )

        self.assertEqual(data["ticker"]["symbol"], "HOSE:HHS")
        self.assertEqual(data["action"], "sell")

    def test_repairs_leading_equals_before_json(self):
        data = parse_forgiving_json(
            '={"ticker":{"adjustment":"dividends","symbol":"HOSE:GVR"},'
            '"action":"buy"}'
        )

        self.assertEqual(data["ticker"]["symbol"], "HOSE:GVR")
        self.assertEqual(data["action"], "buy")

    def test_repairs_misquoted_json_with_adjusted_ticker(self):
        data = parse_forgiving_json(
            '"{"ticker":={"adjustment":"dividends","symbol":"HOSE:VRE"},'
            '"action":"sell","price":"31400"}"'
        )

        self.assertEqual(data["ticker"]["symbol"], "HOSE:VRE")
        self.assertEqual(data["action"], "sell")

    def test_repairs_json_string_wrapped_payload(self):
        data = parse_forgiving_json(
            '"{\\"ticker\\":={\\"adjustment\\":\\"dividends\\",'
            '\\"symbol\\":\\"HOSE:SBT\\"},\\"action\\":\\"sell\\"}"'
        )

        self.assertEqual(data["ticker"]["symbol"], "HOSE:SBT")
        self.assertEqual(data["action"], "sell")

    def test_parses_vietnamese_tradingview_order_fill_text(self):
        data = parse_tradingview_alert_text(
            '"RF Stock Rebalance (HL2, 100, 5, rebalance): '
            'lệnh sell @6900 được thực hiện MBB. Vị thế mới là 0"\n'
            "RF Stock Rebalance (HL2, 100, 5, rebalance)\n"
            "HOSE:MBB, 1h • Hoạt động"
        )

        self.assertEqual(data["ticker"], "HOSE:MBB")
        self.assertEqual(data["action"], "sell")
        self.assertEqual(data["price"], "6900")
        self.assertEqual(data["timeframe"], "1h")
        self.assertEqual(data["strategy"], "RF Stock Rebalance")
        self.assertEqual(data["payload_format"], "tradingview_order_fill_text")

    def test_rejects_plain_text_without_an_order(self):
        with self.assertRaisesRegex(ValueError, "order action and price"):
            parse_tradingview_alert_text("HOSE:MBB, 1h - strategy is active")


if __name__ == "__main__":
    unittest.main()
