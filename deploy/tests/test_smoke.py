#!/usr/bin/env python3
"""Offline unit tests for deploy/smoke_test.py using a local stub HTTP server."""

import http.server
import json
import sys
import threading
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import smoke_test  # noqa: E402


class _StubHandler(http.server.BaseHTTPRequestHandler):
    ready_ok = True

    def log_message(self, format, *args):  # noqa: A002
        return

    def _send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/health":
            self._send_json(200, {"status": "ok", "service": "CandyCash API"})
        elif self.path == "/api/ready":
            if self.__class__.ready_ok:
                self._send_json(200, {"status": "ready", "db": "connected"})
            else:
                self._send_json(503, {"status": "not ready", "db": "disconnected"})
        elif self.path in ("/", "/login"):
            html = b"<!doctype html><html><body><h1>CandyCash</h1></body></html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
        elif self.path == "/api/auth/me":
            cookie = self.headers.get("Cookie", "")
            if "candycash_session=stub-token" in cookie:
                self._send_json(200, {"success": True, "user": {"email": "admin@candycash.local"}})
            else:
                self._send_json(401, {"success": False, "error": "Unauthorized"})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/api/auth/login":
            length = int(self.headers.get("Content-Length", "0"))
            data = json.loads(self.rfile.read(length).decode("utf-8"))
            if data.get("email") == "admin@candycash.local" and data.get("password") == "secret":
                self._send_json(
                    200,
                    {"success": True, "user": {"email": "admin@candycash.local"}},
                    extra_headers={"Set-Cookie": "candycash_session=stub-token; Path=/; HttpOnly"},
                )
            else:
                self._send_json(401, {"success": False, "error": "Invalid credentials"})
        elif self.path == "/api/auth/logout":
            self._send_json(200, {"success": True, "message": "Logged out successfully"})
        else:
            self._send_json(404, {"error": "not found"})


class SmokeTestUnitSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _StubHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        _StubHandler.ready_ok = True

    def test_smoke_passes_without_login(self):
        smoke_test.run_smoke_tests(f"http://127.0.0.1:{self.port}")

    def test_smoke_passes_with_login(self):
        smoke_test.run_smoke_tests(
            f"http://127.0.0.1:{self.port}",
            email="admin@candycash.local",
            password="secret",
        )

    def test_smoke_fails_when_ready_returns_503(self):
        _StubHandler.ready_ok = False
        with self.assertRaises(AssertionError):
            smoke_test.run_smoke_tests(f"http://127.0.0.1:{self.port}")


if __name__ == "__main__":
    unittest.main()
