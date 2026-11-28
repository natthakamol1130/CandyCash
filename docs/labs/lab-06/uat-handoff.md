# CandyCash — Sprint 1 UAT Plan & Handoff Pack (Lab 6 — Part A)

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)  
> **Product Team:** `maimuu` (Prefix: `sb1c2a258`)  
> - ณัฐกมล มอญปาน (`67070505215`, `@natthakamol1130`)  
> - สุประวีณ์ สุทธิเสรีนิวัฒน์ (`67070505227`, `@Suprawi5227`)  
> **Partner UAT Team:** `<Partner Team Name>` (`<Student 1 Name & ID>`, `<Student 2 Name & ID>`)  
> **Related Issue:** [#38 — [L6-01]: Sprint 1 UAT Plan & Handoff Pack](https://github.com/natthakamol1130/CandyCash/issues/38)

---

## 1. Deployed Release Baseline & Target URLs (Safe Handoff)

| Item | Value | Notes |
| :--- | :--- | :--- |
| **Public Repository** | `https://github.com/natthakamol1130/CandyCash` | Public (`main` & `staging` synced) |
| **Sprint 1 Release Tag** | `v1.2.1-lab5-seed-fix` | Lab 5 verified production baseline |
| **Tested Commit SHA** | `486b210e592e61e680c5ba9a89b8311a4c90b0f6` | Merged via PR `#36` |
| **Cloud Run Revision** | `sb1c2a258-00006-fpl` | 100% traffic (`asia-southeast1`) |
| **Container Digest** | `@sha256:b3a478b7976787a6fb401038ddff87fd8aa732d8d7fbe17cafce2b777f85943e` | Immutable Artifact Registry image |
| **Live Root URL** | `https://sb1c2a258-4d7hbszvwq-as.a.run.app` | Release 2 landing page |
| **Login Page** | `https://sb1c2a258-4d7hbszvwq-as.a.run.app/login` | Production login (`NODE_ENV=production`) |
| **Dashboard URL** | `https://sb1c2a258-4d7hbszvwq-as.a.run.app/dashboard` | Main authenticated workspace |
| **Health / Readiness** | `/api/health`, `/api/ready` | Returns `200 OK` (`db=connected`) |

---

## 2. Accepted Sprint 1 Scope

This UAT evaluates **only** the delivered Sprint 1 requirements and acceptance criteria:

- **F-01 — Authentication & Role-Based Session Guard:** Email/password login, HTTP-only JWT cookie (`candycash_session`), and bidirectional RBAC (`USER` vs. `ADMIN`, including `BR-03` Admin Privacy Guard).
- **F-02 — Custom Money Folders & Double-Check Archive:** Create wallet folders (`CASH`, `BANK`, `EWALLET`, `POCKET`) with initial balance, and archive non-empty/empty folders with confirmation.
- **F-03 — Atomic Income & Expense Transaction Logging:** Record `INCOME` and `EXPENSE` entries with atomic folder balance updates and **Overdraft Guard (`BR-01`)** preventing negative folder balances.
- **F-04 — Self-Service Double-Check Move & Cancel:** Move transactions between folders (`POST /api/transactions/[id]/move`) and cancel entries into Trash (`POST /api/transactions/[id]/cancel`) with confirmation and atomic balance reversal.
- **F-05 — Trash History & Double-Check Restore:** View cancelled entries in Trash tab and restore them (`POST /api/transactions/[id]/restore`) while enforcing overdraft guard.
- **F-06 — Daily Safe-to-Spend, Search/Filter & Admin Catalog:** Daily spending budget calculation, search/filter by note/type/folder, and `ADMIN` management of system categories and budget templates.

> **Out of Scope:** Sprint 2 and Sprint 3 features are **not** part of this Sprint 1 UAT acceptance.

---

## 3. Safe Test Accounts (No Secrets in Git / PDF)

> **Security Rule:** Real test passwords are **never** stored in GitHub or this document. The Product Team sends credentials to the Partner UAT Team via **private direct message** before testing begins.

| Account Label | Role | Purpose in UAT | Credentials Delivery |
| :--- | :--- | :--- | :--- |
| **`User A (Primary)`** | `USER` | Normal domain journey, Overdraft Guard, Move/Cancel/Restore, Search/Filter | Sent privately via DM |
| **`Admin Account`** | `ADMIN` | System Category & Budget Template management, Privacy Guard (`BR-03`) denial check | Sent privately via DM |

---

## 4. Data Setup, Execution Order & Cleanup Instructions

1. **Pre-Test Sanity Check (Optional):** Verify `GET /api/health` and `GET /api/ready` return `200 OK` (`"db":"connected"`).
2. **Test Isolation Setup:** Inside `User A (Primary)`, create a dedicated folder named **`UAT-Test`** (initial balance `฿1,000.00`) during `UAT-01` so UAT transactions do not mix with existing baseline folders.
3. **Execution Sequence:**
   - Run **`UAT-01` → `UAT-02` → `UAT-04` → `UAT-05`** sequentially on `User A (Primary)` using the `UAT-Test` folder (each step uses the exact synthetic balance left by the previous step).
   - **`UAT-03`** is independent and can be executed at any time using **`Admin Account`** and **`User A (Primary)`**.
4. **Reset / Cleanup After Testing:**
   - After `UAT-05`, you may archive the `UAT-Test` folder (or cancel remaining test entries into Trash) and click **Sign Out**.
   - If any test state becomes blocked or inconsistent, notify Team `maimuu` (`@natthakamol1130` / `@Suprawi5227`) to reset/verify the synthetic test folder.

---

## 5. Executable Sprint 1 UAT Cases

### `UAT-01`: Normal Domain Journey — Folder Creation, Income/Expense Logging & Atomic Balance Math
- **Category:** Normal Domain Journey
- **Requirement / AC Ref:** `F-02`, `F-03` (AC: Create folder with initial balance; log `EXPENSE` and `INCOME` with exact atomic balance update)
- **Purpose:** Verify an authenticated `USER` can create a money folder and log expense/income transactions with accurate balance calculation.
- **Role:** `USER` (`User A (Primary)`)
- **Preconditions:**
  1. Browser is open at `https://sb1c2a258-4d7hbszvwq-as.a.run.app/login`.
  2. Logged in as `User A (Primary)`. Record the starting **Total Net Balance** displayed at the top of `/dashboard` (let this be $B_0$).
- **Synthetic Inputs:**
  - New Folder: Name = `UAT-Test`, Type = `POCKET`, Initial Balance = `1000` (`฿1,000.00`)
  - Expense Entry: Folder = `UAT-Test`, Category = `Food`, Amount = `250`, Note = `UAT Matcha Latte`
  - Income Entry: Folder = `UAT-Test`, Category = `Salary`, Amount = `100`, Note = `UAT Cashback`
- **User Actions:**
  1. Click **New Folder (`สร้างโฟลเดอร์ใหม่`)**, enter `UAT-Test`, select `POCKET`, enter initial balance `1000`, and submit.
  2. Click **Record Entry (`จดรายรับ-รายจ่าย`)**, select **Expense (`รายจ่าย`)**, choose folder `UAT-Test`, category `Food`, amount `250`, note `UAT Matcha Latte`, and click **Save Entry**.
  3. Click **Record Entry (`จดรายรับ-รายจ่าย`)**, select **Income (`รายรับ`)**, choose folder `UAT-Test`, category `Salary`, amount `100`, note `UAT Cashback`, and click **Save Entry**.
- **Expected Results:**
  1. Folder `UAT-Test` appears with balance `฿1,000.00`, and Total Net Balance becomes $B_0 + ฿1,000.00$.
  2. After the `฿250.00` expense: `UAT-Test` balance updates to `฿750.00` (`1,000 - 250`), and Total Net Balance updates to $B_0 + ฿750.00$.
  3. After the `฿100.00` income: `UAT-Test` balance updates to **`฿850.00`** (`750 + 100`), and Total Net Balance updates to $B_0 + ฿850.00$. Both entries appear in **Recent Entries**.

---

### `UAT-02`: Business Rule / Boundary Case — Overdraft Guard (`BR-01`)
- **Category:** Business Rule / Boundary Rejection
- **Requirement / AC Ref:** `F-03`, `BR-01` (Expense must not exceed selected folder balance; negative balance is strictly forbidden)
- **Purpose:** Verify the UI and backend reject an expense exceeding the selected folder's available balance without mutating financial state.
- **Role:** `USER` (`User A (Primary)`)
- **Preconditions:**
  1. `UAT-01` completed; folder `UAT-Test` currently holds **`฿850.00`**.
  2. Authenticated as `User A (Primary)` on `/dashboard`.
- **Synthetic Inputs:**
  - Expense Entry (Boundary Overdraft): Folder = `UAT-Test`, Category = `Food`, Amount = `850.01` (or `5000`), Note = `UAT Overdraft Attempt`
- **User Actions:**
  1. Click **Record Entry (`จดรายรับ-รายจ่าย`)** and select **Expense (`รายจ่าย`)**.
  2. Select folder `UAT-Test (฿850.00)`.
  3. Enter amount `850.01` and note `UAT Overdraft Attempt`.
  4. Observe the modal warning/button state (and attempt submission via UI or API if enabled), then close the modal and refresh the page.
- **Expected Results:**
  1. The modal immediately displays the Overdraft Warning Banner (`"Warning: Expense amount exceeds selected folder balance!"` / `"คำเตือน: จำนวนเงินรายจ่ายเกินกว่ายอดคงเหลือในโฟลเดอร์!"`) and disables the **Save Entry** button (and API rejects any direct `POST /api/transactions` overdraft with `400`).
  2. No transaction named `UAT Overdraft Attempt` is created.
  3. Folder `UAT-Test` balance remains exactly **`฿850.00`** after page refresh.

---

### `UAT-03`: Forbidden Role & Privacy Guard (`BR-03` — Bidirectional RBAC)
- **Category:** Forbidden Role / Ownership & Access Control
- **Requirement / AC Ref:** `F-01`, `BR-03` (Admin accounts are strictly barred from personal financial folders/transactions; User accounts are barred from Admin catalog mutations)
- **Purpose:** Verify `ADMIN` cannot view or access personal `USER` financial records, and `USER` cannot perform `ADMIN`-only catalog actions.
- **Role:** `ADMIN` (`Admin Account`) and `USER` (`User A (Primary)`)
- **Preconditions:**
  1. Signed out from any previous session (or using an incognito window).
- **Synthetic Inputs:**
  - Login as `Admin Account` (credentials sent privately)
  - Direct API probe in browser DevTools / address bar: `GET /api/wallets` while logged in as `ADMIN`
  - Direct API probe while logged in as `User A (Primary)`: `POST /api/admin/categories`
- **User Actions:**
  1. On `/login`, sign in using **`Admin Account`**.
  2. Observe the `/dashboard` UI rendered for `ADMIN`.
  3. In the same authenticated `ADMIN` browser session, open `https://sb1c2a258-4d7hbszvwq-as.a.run.app/api/wallets` (or run `fetch('/api/wallets')` in DevTools Console) and check the HTTP status & JSON response.
  4. Sign out, sign in as **`User A (Primary)`**, and test `fetch('/api/admin/categories', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name:'Hack',type:'EXPENSE'}) })` in DevTools Console.
- **Expected Results:**
  1. `ADMIN` dashboard displays **`Admin Privacy Guard Active (BR-03)`** along with **Manage System Categories** and **Manage Starter Budget Templates** only — zero personal wallets or user transactions are visible.
  2. `GET /api/wallets` under `ADMIN` session returns **`403 Forbidden`** (`"Forbidden: Personal financial access restricted to USER role"`), disclosing no personal financial data.
  3. `POST /api/admin/categories` under `USER` session returns **`403 Forbidden`** (`"Forbidden: Admin access required"`), leaving system categories unchanged.

---

### `UAT-04`: State, History & Persistence — Cancel to Trash, Hard Refresh & Restore
- **Category:** State / History / Persistence
- **Requirement / AC Ref:** `F-04`, `F-05` (Double-check cancel to Trash reverses balance; state persists in Cloud SQL across refresh; restore re-applies transaction atomically)
- **Purpose:** Verify transaction cancellation, Trash history persistence across browser reload, and double-check restoration with accurate balance recalculation.
- **Role:** `USER` (`User A (Primary)`)
- **Preconditions:**
  1. `UAT-01` and `UAT-02` completed; `UAT-Test` balance is **`฿850.00`** and contains expense `UAT Matcha Latte (-฿250.00)`.
- **Synthetic Inputs:**
  - Target Transaction: `UAT Matcha Latte` (`-฿250.00` in `UAT-Test`)
- **User Actions:**
  1. On `/dashboard`, locate `UAT Matcha Latte (-฿250.00)` in **Recent Entries** and click the **Trash / Cancel** icon.
  2. In the **Confirm Move to Trash (Double-Check)** modal, click **Confirm Cancel**.
  3. Hard-refresh the browser (`Ctrl+F5` / `F5`) and inspect both `UAT-Test` balance and the **Trash / Cancelled** tab.
  4. Open the **Trash / Cancelled** tab, click **Restore** on `UAT Matcha Latte`, and confirm in the **Confirm Restore (Double-Check)** modal.
- **Expected Results:**
  1. After cancelling `UAT Matcha Latte (-฿250.00)`: `UAT-Test` balance increases from `฿850.00` to **`฿1,100.00`** (`850 + 250`).
  2. After hard refresh: `UAT-Test` balance persists at **`฿1,100.00`** (stored in Cloud SQL), and `UAT Matcha Latte` remains listed under **Trash / Cancelled** with status `Cancelled`.
  3. After clicking **Restore** and confirming: `UAT Matcha Latte` returns to **Recent Entries** with status `Success`, and `UAT-Test` balance returns to **`฿850.00`** (`1,100 - 250`).

---

### `UAT-05`: Cross-Folder Double-Check Move & Search Filter
- **Category:** Additional Sprint 1 Domain Rule & Query Behavior
- **Requirement / AC Ref:** `F-04`, `F-06` (Double-check move atomically debits/credits source and target folders; search/filter narrows visible entries)
- **Purpose:** Verify moving an entry between folders updates both folder balances atomically and search filtering works accurately.
- **Role:** `USER` (`User A (Primary)`)
- **Preconditions:**
  1. `UAT-04` completed; `UAT-Test` balance is **`฿850.00`**.
  2. Create a second temporary folder **`UAT-Target`** (`BANK`, initial balance `฿500.00`), or pick an existing folder and note its starting balance $B_{target}$.
- **Synthetic Inputs:**
  - Move Target Transaction: `UAT Matcha Latte` (`-฿250.00`) from `UAT-Test` → `UAT-Target`
  - Search Keyword: `Matcha`
- **User Actions:**
  1. Click the **Move (`⇄`)** icon on `UAT Matcha Latte (-฿250.00)`.
  2. Select destination folder `UAT-Target` and click **Confirm Move**.
  3. Type `Matcha` in the search box above **Recent Entries**.
- **Expected Results:**
  1. `UAT-Test` balance increases by `฿250.00` to **`฿1,100.00`**, while `UAT-Target` decreases by `฿250.00` to **`฿250.00`** (`500 - 250`). Total Net Balance across all folders remains unchanged.
  2. Searching `Matcha` filters **Recent Entries** to display `UAT Matcha Latte` under folder `UAT-Target`.

---

## 6. Partner UAT Execution Recording Template (For Part B)

> The Partner UAT Team can return results using the table below (attaching readable screenshots for each case):

| Case ID | Tester Name & Team | Date / Time (UTC+7) | Tested Revision / Commit | Actual Result Observed | Status (`PASS` / `FAIL` / `BLOCKED`) | Evidence / Screenshot ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UAT-01` | | | `sb1c2a258-00006-fpl` (`486b210`) | | | |
| `UAT-02` | | | `sb1c2a258-00006-fpl` (`486b210`) | | | |
| `UAT-03` | | | `sb1c2a258-00006-fpl` (`486b210`) | | | |
| `UAT-04` | | | `sb1c2a258-00006-fpl` (`486b210`) | | | |
| `UAT-05` | | | `sb1c2a258-00006-fpl` (`486b210`) | | | |
