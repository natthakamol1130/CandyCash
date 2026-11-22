#!/usr/bin/env python3
"""Post-deployment HTTP smoke tests for CandyCash (stdlib only)."""

import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.request


def _request(url, method="GET", data=None, headers=None, opener=None, timeout=15):
    req_headers = dict(headers or {})
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        req_headers.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=req_headers, method=method)
    open_fn = opener.open if opener is not None else urllib.request.urlopen
    try:
        with open_fn(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")


def _retry(check_fn, retries=5, delay=0.5):
    last_err = None
    for attempt in range(retries):
        try:
            return check_fn()
        except (AssertionError, urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_err = exc
            if attempt < retries - 1:
                time.sleep(delay)
    raise AssertionError(str(last_err))


def check_health(base_url, timeout=15):
    def _once():
        status, text = _request(f"{base_url}/api/health", timeout=timeout)
        if status != 200:
            raise AssertionError(f"GET /api/health returned {status}: {text}")
        payload = json.loads(text)
        if payload.get("status") != "ok":
            raise AssertionError(f"Unexpected /api/health payload: {payload}")

    _retry(_once)
    print("[PASS] GET /api/health -> 200 OK")


def check_ready(base_url, timeout=15):
    def _once():
        status, text = _request(f"{base_url}/api/ready", timeout=timeout)
        if status != 200:
            raise AssertionError(f"GET /api/ready returned {status}: {text}")
        payload = json.loads(text)
        if payload.get("status") != "ready" or payload.get("db") != "connected":
            raise AssertionError(f"Unexpected /api/ready payload: {payload}")

    _retry(_once)
    print("[PASS] GET /api/ready -> 200 Ready (db=connected)")


def check_frontend(base_url, timeout=15):
    def _once_home():
        status, text = _request(f"{base_url}/", timeout=timeout)
        if status != 200 or ("CandyCash" not in text and "<html" not in text.lower()):
            raise AssertionError(f"GET / failed: status={status}")

    _retry(_once_home)
    print("[PASS] GET / -> 200 OK (Frontend HTML)")

    def _once_login():
        login_status, login_text = _request(f"{base_url}/login", timeout=timeout)
        if login_status != 200 or ("CandyCash" not in login_text and "<html" not in login_text.lower()):
            raise AssertionError(f"GET /login failed: status={login_status}")

    _retry(_once_login)
    print("[PASS] GET /login -> 200 OK (Login page)")


def check_login_roundtrip(base_url, email, password, timeout=15):
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

    status, text = _request(
        f"{base_url}/api/auth/login",
        method="POST",
        data={"email": email, "password": password},
        opener=opener,
        timeout=timeout,
    )
    if status != 200:
        raise AssertionError(f"POST /api/auth/login returned {status}: {text}")
    login_body = json.loads(text)
    if not login_body.get("success"):
        raise AssertionError(f"Login failed: {login_body}")
    print("[PASS] POST /api/auth/login -> 200 OK (session cookie issued)")

    me_status, me_text = _request(
        f"{base_url}/api/auth/me",
        opener=opener,
        timeout=timeout,
    )
    if me_status != 200:
        raise AssertionError(f"GET /api/auth/me returned {me_status}: {me_text}")
    me_body = json.loads(me_text)
    if not me_body.get("success") or me_body.get("user", {}).get("email") != email:
        raise AssertionError(f"Unexpected /api/auth/me payload: {me_body}")
    print("[PASS] GET /api/auth/me -> 200 OK")

    out_status, _ = _request(
        f"{base_url}/api/auth/logout",
        method="POST",
        opener=opener,
        timeout=timeout,
    )
    if out_status != 200:
        raise AssertionError(f"POST /api/auth/logout returned {out_status}")
    print("[PASS] POST /api/auth/logout -> 200 OK")


def run_smoke_tests(base_url, email="", password="", timeout=15):
    base_url = base_url.rstrip("/")
    check_health(base_url, timeout=timeout)
    check_ready(base_url, timeout=timeout)
    check_frontend(base_url, timeout=timeout)
    if bool(email) != bool(password):
        raise AssertionError("Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.")
    if email and password:
        check_login_roundtrip(base_url, email, password, timeout=timeout)
    else:
        print("[SKIP] Login round-trip skipped (SMOKE_EMAIL / SMOKE_PASSWORD not set)")


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <BASE_URL>", file=sys.stderr)
        return 2
    base_url = sys.argv[1]
    email = os.environ.get("SMOKE_EMAIL") or os.environ.get("SMOKE_TEST_EMAIL", "")
    password = os.environ.get("SMOKE_PASSWORD") or os.environ.get("SMOKE_TEST_PASSWORD", "")
    run_smoke_tests(base_url, email=email, password=password)
    print("All smoke tests passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
