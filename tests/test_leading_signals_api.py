import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app import main
from app.database import SignalStore
from app.services.auth import SESSION_COOKIE, hash_password, new_session


class LeadingSignalsApiTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.store = SignalStore(Path(self.directory.name) / "signals.db")
        store_patch = patch.object(main, "store", self.store)
        store_patch.start()
        self.addCleanup(store_patch.stop)
        self.client = TestClient(main.app)
        self.addCleanup(self.client.close)
        self.store.upsert_sector_mapping(ticker="SSI", sector="financials")
        self.signal = self.insert_signal("setup_bull", "Inertial RSI")
        self.buy = self.insert_signal("buy", "RF Stock MTF")

    def insert_signal(self, action, strategy):
        return self.store.insert_signal(
            ticker="SSI", exchange="HOSE", action=action, price=26.4,
            timeframe="D", strategy=strategy, note=None,
            source_time=datetime.now(timezone.utc).isoformat(),
            payload={}, enrichment={"status": "pending", "history": [], "metrics": {}},
        )

    def authenticate(self, role):
        user = self.store.create_user(
            username=role, password_hash=hash_password("test-password"),
            role=role, features=["overview"],
        )
        token, token_hash, expires_at = new_session(1)
        self.store.create_session(token_hash=token_hash, user_id=user["id"], expires_at=expires_at)
        self.client.cookies.set(SESSION_COOKIE, token)

    def test_overview_only_viewer_receives_sector_without_extra_permissions(self):
        self.authenticate("user")

        response = self.client.get("/api/leading-signals")

        self.assertEqual(response.status_code, 200)
        row = response.json()["leading_signals"][0]
        self.assertEqual(row["sector"], "financials")
        self.assertTrue(row["is_active"])
        self.assertEqual(self.client.get("/api/sectors").status_code, 403)

    def test_viewer_cannot_delete_early_signal(self):
        self.authenticate("user")

        response = self.client.delete(f"/api/signals/{self.signal['id']}")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(len(self.store.list_all_signals()), 2)

    def test_admin_deletes_only_the_selected_early_signal(self):
        self.authenticate("admin")

        response = self.client.delete(f"/api/signals/{self.signal['id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["id"] for row in self.store.list_all_signals()], [self.buy["id"]])
        self.assertEqual(self.client.get("/api/leading-signals").json()["leading_signals"], [])


if __name__ == "__main__":
    unittest.main()
