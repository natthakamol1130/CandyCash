# Part C: System-Level Software Design Specification — CandyCash (`docs/system-sds.md`)

## 1. Architecture and Selected Stack
- **UI Layer:** Next.js (App Router + React + TypeScript) + Tailwind CSS
- **API / Application Layer:** Node.js + TypeScript REST API (`Route Handlers / Controllers` -> `Domain Services` -> `Prisma ORM`)
- **Database Layer:** PostgreSQL with ACID transactions (`prisma.$transaction`) and `DECIMAL(12,2)` monetary columns

```mermaid
flowchart LR
    subgraph Client["UI Layer (Next.js React + Tailwind CSS)"]
        UI_Auth["Login & Session Context"]
        UI_User["User Folder, Transaction Form, Double-Check Modal & Trash UI"]
        UI_Admin["Admin Category & Budget Template Console"]
    end

    subgraph Backend["API & Domain Layer (Node.js + TypeScript)"]
        AuthMW["Auth & Bidirectional RBAC Guard"]
        WalletSvc["Personal Folder & Safe-to-Spend Service"]
        LedgerSvc["Atomic Ledger, Double-Check Move/Cancel & Restore Service"]
        AdminSvc["Admin Category & Budget Template Service"]
    end

    subgraph Data["Database Layer (PostgreSQL + Prisma)"]
        DB[("PostgreSQL (ACID + Decimal 12,2)")]
    end

    UI_Auth --> AuthMW
    UI_User --> AuthMW
    UI_Admin --> AuthMW
    AuthMW --> WalletSvc
    AuthMW --> LedgerSvc
    AuthMW --> AdminSvc
    WalletSvc --> DB
    LedgerSvc --> DB
    AdminSvc --> DB
```

## 2. Data Model & Entity-Relationship Diagram
```mermaid
erDiagram
    USERS ||--o{ WALLETS : "owns (owner_id)"
    USERS ||--o{ TRANSACTIONS : "creates (created_by)"
    WALLETS ||--o{ TRANSACTIONS : "records (wallet_id)"
    CATEGORIES ||--o{ TRANSACTIONS : "classifies (category_id)"
    BUDGET_TEMPLATES ||--o{ USERS : "applied_by"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "USER | ADMIN"
        decimal monthly_budget_target "DEFAULT 10000.00"
        timestamp created_at
    }
    WALLETS {
        uuid id PK
        uuid owner_id FK
        string name
        string wallet_type "CASH | BANK | EWALLET | POCKET"
        string color_hex
        string icon_name
        decimal initial_balance "CHECK >= 0.00"
        decimal current_balance "CHECK >= 0.00"
        boolean is_archived "DEFAULT false"
        timestamp created_at
    }
    CATEGORIES {
        uuid id PK
        string name UK
        string type "INCOME | EXPENSE"
        string icon_name
        boolean is_system
    }
    TRANSACTIONS {
        uuid id PK
        uuid wallet_id FK
        uuid category_id FK
        uuid created_by FK
        string type "INCOME | EXPENSE | TRANSFER"
        decimal amount "CHECK > 0.00"
        string status "POSTED | CANCELED"
        string note
        date transaction_date
        timestamp canceled_at "Nullable (In Trash when CANCELED)"
        timestamp created_at
    }
    BUDGET_TEMPLATES {
        uuid id PK
        string name UK
        decimal recommended_monthly_budget
        string description
        uuid created_by FK "Admin ID"
    }
```

## 3. Bidirectional Role & Permission Matrix (`USER` vs `ADMIN`)
| Endpoint / Protected Operation | Guest (No Token) | `USER` (Own Folder/Tx) | `USER` (Other User's Folder/Tx) | `ADMIN` (System Catalog & Templates) |
| :--- | :---: | :---: | :---: | :---: |
| `GET /api/categories` & `GET /api/budget-templates` | `401` | `200 OK` | N/A | `200 OK` |
| `POST /api/categories` & `POST /api/budget-templates` | `401` | `403 Forbidden` | `403 Forbidden` | `201 Created` |
| `GET /api/wallets` & `POST /api/wallets` | `401` | `200 / 201` | Not returned | `403 Forbidden` |
| `GET /api/wallets/:id/transactions` | `401` | `200 OK` | `403 Forbidden` | `403 Forbidden` |
| `POST /api/transactions` (Log Income/Expense) | `401` | `201 Created` | `403 Forbidden` | `403 Forbidden` |
| `POST /api/transactions/:id/move` (Double-Check Move) | `401` | `200 OK` (`confirmed: true`) | `403 Forbidden` | `403 Forbidden` |
| `POST /api/transactions/:id/cancel` (Double-Check Cancel) | `401` | `200 OK` (`confirmed: true`) | `403 Forbidden` | `403 Forbidden` |
| `POST /api/transactions/:id/restore` (Double-Check Restore) | `401` | `200 OK` (`confirmed: true`) | `403 Forbidden` | `403 Forbidden` |
