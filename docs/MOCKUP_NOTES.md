# Mockup Notes

Requirements read from the Excalidraw mockup (`StockSense.png` / `StockSense.svg` in the repo root) and
`Problem Statement - StockSense.txt`. Where the mockup and problem statement disagree, the choice
made is noted below.

## Visual language

| Token | Value | Tailwind utility |
|---|---|---|
| Background | `#121212` | `bg-bg` |
| Accent (lines, titles, buttons) | `#ff8383` | `text-accent`, `border-accent`, `bg-accent` |
| Text | `#d3d3d3` | `text-text` |
| Surfaces / borders | `#1a1a1a`, `#222222`, `#2e2e2e` | `bg-surface`, `bg-surface-2`, `border-border` |

Tokens live in `client/src/index.css` (`@theme`). Use them, not raw hex values.

**Navigation is a top bar** (`Dashboard · Operations · Products · Move History · Settings`, avatar on the
right), not a left sidebar. The problem statement mentions a "Profile Menu (Left Sidebar)". We follow the
mockup: the profile menu (My Profile, Logout) opens from the avatar at the top right. This is
implemented in `client/src/components/layout/Header.jsx`.

## Screens

### Login / Sign up
- Login: **Login ID** + Password, `SIGN IN`, links to "Forget Password?" and "Sign Up".
- Wrong credentials: show **"Invalid Login Id or Password"**.
- Sign up fields: Login ID, Email, Password, Re-enter Password.
- Sign up validation:
  1. Login ID must be **unique** and **6–12 characters**.
  2. Email must not already exist.
  3. Password must contain a **lowercase letter, an uppercase letter and a special character**, and
     be **more than 8 characters** long.

### Dashboard
- **Receipt card**: button "`N` to receive", plus "`N` Late" and "`N` operations".
- **Delivery card**: button "`N` to Deliver", plus "`N` Late", "`N` waiting" and "`N` operations".
- Definitions:
  - **Late**: scheduled date < today (and not done/canceled)
  - **Operations**: scheduled date > today
  - **Waiting**: waiting for stock
- Problem statement KPIs also required: total products in stock, low/out of stock, pending receipts,
  pending deliveries, internal transfers scheduled, plus filters by document type, status, warehouse
  and category.

### Operations: Receipts / Delivery list
- Default **list view** with columns: Reference, From, To, Contact, Schedule date, Status.
- Search by **reference and contact**.
- Toggle to a **kanban view grouped by status**.
- `NEW` button to create.

### Receipt form
- Fields: reference (`WH/IN/0001`), **Receive From** (contact), **Schedule Date**, **Responsible**
  (auto-filled with the logged-in user), product lines (Product, Quantity), "New Product" to add a line.
- Buttons: `Validate`, `Print`, `Cancel`. Status bar: **Draft > Ready > Done**.
- Button logic: in **Draft** the main action is **To Do** (moves to Ready); in **Ready** it is
  **Validate** (moves to Done, stock increases). **Print** is available once Done.

### Delivery form
- Fields: reference (`WH/OUT/0001`), **Delivery Address**, **Schedule Date**, **Responsible**,
  **Operation type**, product lines.
- Status bar: **Draft > Waiting > Ready > Done**.
  - Draft: initial state
  - Waiting: waiting for out-of-stock product(s)
  - Ready: ready to deliver
  - Done: delivered
- **If a line's product is not in stock: show an alert and mark the line red.**

### Reference numbers
`<Warehouse>/<Operation>/<ID>`, e.g. `WH/IN/0001`. Warehouse = warehouse short code, Operation =
`IN` / `OUT` (we add `INT` for transfers and `ADJ` for adjustments), ID = auto-incremented.

### Move History
- Default list view, columns: Reference, Date, Contact, From, To, Quantity, Status.
- **One row per product** when a reference has several products.
- **Incoming moves in green, outgoing moves in red.**
- Search by reference and contact; kanban toggle by status.

### Stock (Products)
- Columns: Product, **per unit cost**, **On hand**, **Free to use**.
- "User must be able to update the stock from here."
- Free to use = on hand minus quantity already reserved by open deliveries.

### Settings: Warehouse
- Fields: Name, **Short Code**, Address.

### Settings: Location
- Fields: Name, Short Code, Warehouse. Holds the rooms/racks/shelves of a warehouse.

## Implications for Phase 2 (backend)

- `User` needs a unique **`loginId`** (6–12 chars) as well as a unique email. Login uses `loginId`.
- `Product` needs a **cost per unit**.
- Operations need **contact/partner**, **scheduledDate**, **responsible** (user) and, for deliveries,
  **deliveryAddress** and **operationType**.
- The stock API must return **onHand** and **freeToUse** per product/location.
- Ledger rows need **from** / **to** locations (or partner) and a direction (in/out) for colouring.
- The dashboard needs **late / waiting / upcoming** counts per operation type.
