# Part B2: Requirements-to-Feature-to-Sprint Traceability (`docs/traceability.md`)

| Requirement ID | Requirement Summary | Mapped Feature(s) | Target Sprint | Verification Reference (AC / Test ID) |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Login, Logout & Current-User Session Identity (`USER`/`ADMIN`) | `F-01` | Sprint 1 | `AC-01, AC-02` / `TEST-01, TEST-02` |
| **FR-02** | Custom Expense Folders / Wallets & Double-Check Archive | `F-02` | Sprint 1 | `AC-03, AC-04` / `TEST-03, TEST-04` |
| **FR-03** | Atomic Income & Expense Transaction Logging | `F-03` | Sprint 1 | `AC-05, AC-07` / `TEST-05, TEST-07` |
| **FR-04** | Self-Service Double-Check Move & Cancel Transaction | `F-04` | Sprint 1 | `AC-08, AC-09` / `TEST-08, TEST-09` |
| **FR-05** | Trash History & Double-Check Restore | `F-05` | Sprint 1 | `AC-10` / `TEST-10` |
| **FR-06** | Daily Safe-to-Spend, Search/Filter & Admin Catalog/Templates | `F-06` | Sprint 1 | `AC-11, AC-12` / `TEST-11, TEST-12` |
| **FR-07** | Category Budget Envelopes & Over-Budget Guardrail | `F-07` | Sprint 2 | Sprint 2 Contract & Verification |
| **FR-08** | Atomic Inter-Wallet Transfer | `F-08` | Sprint 2 | Sprint 2 Contract & Verification |
| **FR-09** | Savings Goal Jars & Target Predictor | `F-09` | Sprint 2 | Sprint 2 Contract & Verification |
| **FR-10** | Recurring Bills & Monthly Due Reminder | `F-10` | Sprint 3 | Sprint 3 Contract & Verification |
| **FR-11** | Financial Analytics Dashboard & CSV Export | `F-11` | Sprint 3 | Sprint 3 Contract & Verification |
| **FR-12** | Fiscal Month-End Closing Lock & Admin Unlock | `F-12` | Sprint 3 | Sprint 3 Contract & Verification |
| **BR-01** | Amount > 0, Initial Balance >= 0 & Category Type Match | `F-02, F-03` | Sprint 1 | `AC-03, AC-07` / `TEST-03, TEST-07` |
| **BR-02** | No Folder Overdraft & Atomic Concurrency Guard (`422`) | `F-03` | Sprint 1 | `AC-06` / `TEST-06` |
| **BR-03** | Bidirectional Role & Personal Folder Privacy Isolation (`403`) | `F-01, F-02, F-06` | Sprint 1 | `AC-04, AC-11, AC-12` / `TEST-04, TEST-11, TEST-12` |
| **BR-04** | Double-Check Move Transaction Two-Way Balance Sufficiency | `F-04` | Sprint 1 | `AC-08` / `TEST-08` |
| **BR-05** | Double-Check Cancel & Trash Restore Balance Integrity | `F-04, F-05` | Sprint 1 | `AC-09, AC-10` / `TEST-09, TEST-10` |
| **BR-06** | Double-Check Folder Archive Protection | `F-02` | Sprint 1 | `AC-03` / `TEST-03` |
| **BR-07** | Savings Allocation Separation & Distinct Transfer Rule | `F-08, F-09` | Sprint 2 | Sprint 2 Contract & Verification |
| **BR-08** | Closed Fiscal Period Immutability | `F-12` | Sprint 3 | Sprint 3 Contract & Verification |
| **NFR-01** | 100% Backend RBAC & Privacy Enforcement | `F-01, F-02, F-06` | Sprint 1 | `AC-02, AC-04, AC-11, AC-12` / `TEST-02, 04, 11, 12` |
| **NFR-02** | ACID Transaction & Race-Condition Safe Balance Update | `F-03, F-04, F-05` | Sprint 1 | `AC-05..AC-10` / `TEST-05..TEST-10` |
| **NFR-03** | `bcrypt` Password Hashing & `HttpOnly` Session Cookie | `F-01` | Sprint 1 | `AC-01` / `TEST-01` |
| **NFR-04** | Dashboard & Ledger Query Latency `p95 < 300ms` | `F-11` | Sprint 3 | Sprint 3 Performance Check |
| **NFR-05** | Environment Variable Config & Docker Readiness | `F-12` | Sprint 3 | Sprint 3 Deployment Check |
