# StockSense API Contract

> **Source of truth for the frontend/backend contract.** If a request or response shape changes,
> update this file in the same commit.

Current stage: **Phase 2 (backend APIs)**. Every route below is implemented.

**Contents**
1. [Conventions](#1-conventions)
2. [Shared objects](#2-shared-objects)
3. [Health](#3-health)
4. [Auth](#4-auth)
5. [Categories](#5-categories)
6. [Products and stock](#6-products-and-stock)
7. [Warehouses and locations](#7-warehouses-and-locations)
8. [Operations: receipts, deliveries, transfers](#8-operations-receipts-deliveries-transfers)
9. [Inventory adjustments](#9-inventory-adjustments)
10. [Stock ledger (move history)](#10-stock-ledger-move-history)
11. [Dashboard](#11-dashboard)
12. [Business rules summary](#12-business-rules-summary)

---

## 1. Conventions

### Base URL and transport

```
http://localhost:5000/api          (client: VITE_API_URL)
```

- There is no Vite proxy. The browser calls the API directly, and CORS allows the origins in `CLIENT_URL`.
- Request bodies are JSON (`Content-Type: application/json`, max 1 MB). Numbers must be JSON numbers,
  not strings.
- Protected routes need `Authorization: Bearer <token>`. Every route except `/health` and the public
  `/auth/*` routes is protected.
- IDs are 24-character hex strings and every object has `_id`. Dates are ISO-8601 strings.
- Unknown body fields are ignored.

### Success envelope

```json
{ "success": true, "data": <object | array> }
```

### Paginated lists

Endpoints marked *paginated* accept `page` (default `1`) and `limit` (default `20`, or `50` for
ledger and stock, max `100`), and return:

```json
{
  "success": true,
  "data": { "items": [], "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

### Error envelope

```json
{ "success": false, "message": "Human readable error" }
```

Validation errors (400) add one entry per problem. `message` is the first problem, so it can be
shown directly:

```json
{
  "success": false,
  "message": "Password must contain a special character",
  "errors": [{ "field": "password", "message": "Password must contain a special character" }]
}
```

Nested fields use dot paths, e.g. `lines.0.quantity`.

| Code | When |
|---|---|
| 400 | Invalid input, invalid id, business-rule violation (insufficient stock, wrong status, ...) |
| 401 | Missing/invalid/expired token (`Not authenticated`, `Invalid token`, `Session expired, please log in again`) or wrong login |
| 404 | Unknown route or record (`Receipt not found`) |
| 409 | Duplicate (`Login ID is already taken`, `A record with this sku already exists`) or delete blocked by references |
| 500 | Unexpected error (`Internal server error` in production) |

### Comma-separated filters

Query params documented as *csv* accept several values: `?status=draft,ready`.

### Enums

| Enum | Values |
|---|---|
| Operation status | `draft`, `waiting`, `ready`, `done`, `canceled` |
| Open statuses (pending, editable) | `draft`, `waiting`, `ready` |
| Document type | `receipt`, `delivery`, `transfer`, `adjustment` |
| Stock status | `in`, `low` (on hand ≤ reorderLevel, reorderLevel > 0), `out` (on hand ≤ 0) |
| Ledger refType | `initial`, `receipt`, `delivery`, `transfer`, `adjustment` |
| Ledger direction | `in`, `out`, `internal` |

---

## 2. Shared objects

Related records inside responses are populated as small objects; request bodies always take plain ids.

```jsonc
// User
{ "_id": "…", "name": "Admin", "loginId": "admin01", "email": "admin@stocksense.local",
  "role": "manager", "createdAt": "…", "updatedAt": "…" }

// LocationRef (inside operations, stock, ledger)
{ "_id": "…", "name": "Stock", "code": "STOCK", "fullName": "WH/Stock", "warehouse": "<warehouseId>" }

// WarehouseRef
{ "_id": "…", "name": "Main Warehouse", "code": "WH" }

// ProductRef (inside operation lines)
{ "_id": "…", "name": "Desk", "sku": "DESK001", "uom": "Units", "unitCost": 3000 }

// UserRef
{ "_id": "…", "name": "Admin", "loginId": "admin01" }   // responsible also includes "email"
```

---

## 3. Health

### `GET /api/health` (public)

**200** `data`: `{ "status": "ok", "database": "connected" | "disconnected" | "connecting" | "disconnecting", "uptime": 42, "timestamp": "…" }`

---

## 4. Auth

### `POST /api/auth/signup` (public)

| Field | Type | Rules |
|---|---|---|
| `loginId` | string | required, 6–12 chars, letters/numbers/`._-`, unique, stored lowercase |
| `email` | string | required, valid email, unique, stored lowercase |
| `password` | string | required, more than 8 chars, with a lowercase letter, an uppercase letter and a special character |
| `name` | string | optional, ≤ 80 |

The UI should check that "Re-enter password" matches before calling; the API doesn't take it.

**201** `data`: `{ "token": "<jwt>", "user": User }`
**Errors:** 400 validation, 409 `Login ID is already taken` / `Email is already registered`.

### `POST /api/auth/login` (public)

Body: `{ "loginId": "admin01", "password": "Admin@12345" }`. `loginId` may also be the email.
**200** `data`: `{ "token": "<jwt>", "user": User }`
**Errors:** 400 missing fields, 401 `Invalid Login Id or Password`.

### `POST /api/auth/forgot-password` (public)

Body: `{ "email": "admin@stocksense.local" }`
**200** `data`: `{ "message": "If an account exists for this email, an OTP has been sent.", "devOtp": "123456" }`

- The response is the same whether or not the email exists.
- The OTP has 6 digits and is valid for `OTP_TTL_MINUTES` (default 10).
- It's emailed via SMTP if configured, otherwise printed in the server console.
- `devOtp` is only present when `OTP_DEV_RESPONSE=true`, `NODE_ENV` isn't production, and the account exists.

### `POST /api/auth/verify-otp` (public)

Body: `{ "email": "…", "otp": "123456" }` → **200** `data`: `{ "valid": true }`
**Errors:** 400 `Invalid or expired OTP`, 400 `Too many attempts. Request a new OTP.` (after 5 wrong tries).

### `POST /api/auth/reset-password` (public)

Body: `{ "email": "…", "otp": "123456", "password": "NewPass@123" }` (same password rules as signup)
**200** `data`: `{ "message": "Password has been reset. You can now log in." }`
**Errors:** same as verify-otp, plus password validation.

### `GET /api/auth/me`

**200** `data`: `User`

### `PATCH /api/auth/me`

Body: `{ "name"?: string, "email"?: string }` (at least one). **200** `data`: `User`. **409** if the email is taken.

### `PATCH /api/auth/me/password`

Body: `{ "currentPassword": "…", "newPassword": "…" }` → **200** `data`: `{ "message": "Password updated" }`
**Errors:** 400 `Current password is incorrect`, 400 password rules.

---

## 5. Categories

### `GET /api/categories`

**200** `data`: `[{ "_id", "name", "description", "productCount", "createdAt", "updatedAt" }]` (sorted by name; `productCount` counts active products).

### `POST /api/categories`

Body: `{ "name": "Furniture", "description"?: "…" }` → **201** `data`: Category.
**409** if the name exists (case-insensitive).

### `PATCH /api/categories/:id`

Body: any of `name`, `description` → **200** `data`: Category. **404** if not found.

### `DELETE /api/categories/:id`

**200** `data`: `{ "_id": "…" }`. **409** `This category is used by products; reassign them first`.

---

## 6. Products and stock

### Product object

```jsonc
{
  "_id": "…", "name": "Desk", "sku": "DESK001",
  "category": { "_id": "…", "name": "Furniture" },   // or null
  "uom": "Units", "unitCost": 3000,
  "reorderLevel": 10, "reorderQty": 0,
  "description": "", "isActive": true,
  "onHand": 50,        // sum over locations (or over one warehouse if ?warehouse=)
  "reserved": 5,       // held by deliveries/transfers in "ready" status
  "freeToUse": 45,     // max(onHand - reserved, 0)
  "stockStatus": "in", // in | low | out
  "createdAt": "…", "updatedAt": "…"
}
```

### `GET /api/products` (paginated)

| Query | Notes |
|---|---|
| `search` | matches name or SKU (case-insensitive, contains) |
| `category` | category id |
| `warehouse` | compute `onHand`/`reserved` for this warehouse only |
| `stockStatus` | `in` \| `low` \| `out` |
| `includeInactive` | `true` to include archived products |

**200** `data`: paginated Product objects, sorted by name.

### `GET /api/products/:id`

**200** `data`: Product plus:

```jsonc
"stockByLocation": [
  { "location": { "_id", "name", "code", "fullName" }, "warehouse": WarehouseRef,
    "quantity": 50, "reserved": 5, "freeToUse": 45 }
]
```

### `POST /api/products`

```json
{
  "name": "Steel Rod",
  "sku": "STEEL001",
  "category": "<categoryId>",
  "uom": "kg",
  "unitCost": 50,
  "reorderLevel": 20,
  "reorderQty": 100,
  "description": "",
  "initialStock": { "quantity": 0, "location": "<locationId>" }
}
```

- Required: `name`, `sku`. The SKU may contain letters, numbers and `. _ - /`, is stored in
  uppercase, and must be unique.
- `category` may be `null`. `uom` defaults to `"Units"`. The numeric fields default to 0 and must
  be ≥ 0.
- `initialStock` is optional. If `quantity > 0` the stock goes into `location`, or into the default
  location of the oldest warehouse when `location` is left out, and a ledger entry with
  `refType: "initial"` and `reference: "Initial stock"` is written.

**201** `data`: Product (detail shape). **Errors:** 400 validation / `Category not found` /
`Create a warehouse before adding initial stock`, 409 duplicate SKU.

### `PATCH /api/products/:id`

Body: any product field except `initialStock`, plus `isActive` (boolean). **Stock can't be changed
here; use an adjustment.** **200** `data`: Product detail.

### `DELETE /api/products/:id`

Archives the product (sets `isActive: false`); history is kept. **200** `data`: `{ "_id", "isActive": false }`.

### `GET /api/stock` (paginated)

One row per product per location (the "Stock" screen).

| Query | Notes |
|---|---|
| `product`, `warehouse`, `location`, `category` | ids |
| `search` | product name / SKU |
| `includeZero` | `true` to include rows with quantity 0 |

**200** `data.items[]`:

```jsonc
{ "_id": "…", "product": { "_id", "name", "sku", "uom", "unitCost", "reorderLevel" },
  "location": { "_id", "name", "code", "fullName" }, "warehouse": WarehouseRef,
  "quantity": 50, "reserved": 5, "freeToUse": 45, "createdAt": "…", "updatedAt": "…" }
```

To change stock from the Stock screen, create and validate an **adjustment** (§9).

---

## 7. Warehouses and locations

### `GET /api/warehouses`

**200** `data`: `[{ "_id", "name", "code", "address", "locationCount", "createdAt", "updatedAt" }]`

### `GET /api/warehouses/:id`

**200** `data`: warehouse plus `"locations": [Location]` (the default location comes first).

### `POST /api/warehouses`

Body: `{ "name": "Main Warehouse", "code": "WH", "address"?: "…" }`. `code` is 1–10 letters/numbers,
stored in uppercase, and unique.
It also creates the default location `{ "name": "Stock", "code": "STOCK", "fullName": "WH/Stock", "isDefault": true }`.
**201** `data`: warehouse with `locations`. **409** duplicate code.

### `PATCH /api/warehouses/:id`

Body: any of `name`, `code`, `address`. Changing `code` renames every location's `fullName`.
Existing document references (`WH/IN/0001`) are not renamed. **200** `data`: warehouse with `locations`.

### `DELETE /api/warehouses/:id`

**200** `data`: `{ "_id" }`. **409** if the warehouse has stock, ledger history or operations.

### Location object

```jsonc
{ "_id": "…", "name": "Production Rack", "code": "PROD", "fullName": "WH/Production Rack",
  "warehouse": WarehouseRef, "isDefault": false, "createdAt": "…", "updatedAt": "…" }
```

### `GET /api/locations?warehouse=<id>`

**200** `data`: `[Location]`, sorted by `fullName`. The `warehouse` filter is optional.

### `GET /api/locations/:id`

**200** `data`: Location.

### `POST /api/locations`

Body: `{ "name": "Production Rack", "code": "PROD", "warehouse": "<warehouseId>" }`. `code` is
letters/numbers/`_-`, stored in uppercase, and must be unique within its warehouse.
**201** `data`: Location. **400** `Warehouse not found`, **409** duplicate code.

### `PATCH /api/locations/:id`

Body: any of `name`, `code`. The warehouse can't be changed. **200** `data`: Location.

### `DELETE /api/locations/:id`

**200** `data`: `{ "_id" }`. **409** for the default location, or if the location has stock, history or operations.

---

## 8. Operations: receipts, deliveries, transfers

All three share one lifecycle and one set of endpoints. `{ops}` is `receipts`, `deliveries` or `transfers`.

```
draft ──confirm──▶ ready ──validate──▶ done
  │       (deliveries/transfers: ready if every line is available at the source,
  │        otherwise waiting; confirm again later to re-check)
  └────────────── cancel (from draft / waiting / ready) ──▶ canceled
```

- **Confirm** ("To Do" in the mockup) is allowed from `draft` or `waiting`.
- **Validate** is allowed from any open status (`draft`, `waiting`, `ready`). It moves stock inside
  one database transaction: either every line is applied or none are.
- **Edit** (`PATCH`) is allowed while the document is open. For deliveries and transfers that are
  not in draft, availability is re-checked after the edit.
- A document needs **at least one line** to be confirmed or validated. Each product may appear
  only once per document.
- `reference` is generated on create as `<WAREHOUSE_CODE>/<IN|OUT|INT>/<NNNN>`. The warehouse is the
  one of the destination location (receipts) or the source location (deliveries, transfers).
- `responsible` defaults to the logged-in user.

### Operation object

```jsonc
{
  "_id": "…",
  "reference": "WH/OUT/0001",
  "status": "ready",
  "warehouse": WarehouseRef,
  "scheduledDate": "2026-09-26T00:00:00.000Z",
  "responsible": { "_id", "name", "loginId", "email" },
  "createdBy": UserRef,
  "validatedBy": UserRef, "validatedAt": "…", "canceledAt": "…",   // each absent until set
  "notes": "",
  "lines": [
    { "_id": "…", "product": ProductRef, "quantity": 6,
      // deliveries/transfers, detail endpoints only, while status is open:
      "available": 45, "inStock": true }
  ],
  // deliveries/transfers, detail endpoints only, while open and with lines:
  "allInStock": true,
  "createdAt": "…", "updatedAt": "…",

  // receipt only
  "contact": "Azure Interior",            // "Receive From"
  "destLocation": LocationRef,

  // delivery only
  "contact": "Azure Interior",
  "deliveryAddress": "221B Baker Street",
  "sourceLocation": LocationRef,
  "pickedAt": "…", "packedAt": "…",       // absent until set

  // transfer only
  "sourceLocation": LocationRef,
  "destLocation": LocationRef
}
```

`available` is the on-hand quantity at the source minus what *other* ready deliveries/transfers
reserve. Show a line in red when `inStock` is `false` (mockup: "mark the line red if product is not
in stock").

### `GET /api/{ops}` (paginated)

| Query | Notes |
|---|---|
| `status` | csv of statuses |
| `warehouse` | warehouse id |
| `search` | reference or contact (contains, case-insensitive) |
| `dateFrom`, `dateTo` | filter `scheduledDate` (ISO dates) |

**200** `data`: paginated Operation objects (without the `available`/`inStock` fields), newest first.

### `GET /api/{ops}/:id`

**200** `data`: Operation. **404** `Receipt not found` / `Delivery not found` / `Internal transfer not found`.

### `POST /api/{ops}`

**Receipt**

```json
{
  "contact": "Azure Interior",
  "destLocation": "<locationId>",
  "scheduledDate": "2026-09-30",
  "responsible": "<userId>",
  "notes": "",
  "lines": [{ "product": "<productId>", "quantity": 6 }]
}
```

**Delivery**

```json
{
  "contact": "Azure Interior",
  "deliveryAddress": "221B Baker Street",
  "sourceLocation": "<locationId>",
  "scheduledDate": "2026-09-30",
  "lines": [{ "product": "<productId>", "quantity": 6 }]
}
```

**Transfer**

```json
{
  "sourceLocation": "<locationId>",
  "destLocation": "<locationId>",
  "scheduledDate": "2026-09-30",
  "lines": [{ "product": "<productId>", "quantity": 20 }]
}
```

- Required: the location field(s). Everything else is optional.
- `lines` defaults to `[]`. Each quantity must be greater than 0, and each product may appear once.
- A transfer's source and destination must differ.

**201** `data`: Operation (status `draft`).
**Errors:** 400 validation, `Source location not found`,
`One or more products do not exist or are archived`, `Source and destination must be different locations`.

### `PATCH /api/{ops}/:id`

Body: any create field. If `lines` is sent, it replaces all lines. **200** `data`: Operation.
**400** `Cannot edit a receipt that is done`.

### `POST /api/{ops}/:id/confirm`

No body. **200** `data`: Operation with status `ready` or `waiting`.
**400** `Only draft or waiting documents can be confirmed (this one is ready)`, `Add at least one product line first`.

### `POST /api/{ops}/:id/validate`

No body. Moves stock and writes one ledger entry per line. **200** `data`: Operation with status `done`.

| Type | Stock effect |
|---|---|
| receipt | `destLocation += quantity` |
| delivery | `sourceLocation -= quantity` |
| transfer | `sourceLocation -= quantity`, `destLocation += quantity` (total unchanged) |

**Errors:** 400 `Cannot validate a delivery that is done` (validating twice doesn't move stock again),
400 `Insufficient stock for [DESK001] Desk at WH/Stock: available 3, required 5` (nothing is applied).

### `POST /api/{ops}/:id/cancel`

No body. **200** `data`: Operation with status `canceled`. **400** if it's already done or canceled.

### `POST /api/deliveries/:id/pick` and `POST /api/deliveries/:id/pack`

Optional picking/packing steps. They set `pickedAt` / `packedAt` and don't move stock. They're only
allowed while the delivery is `ready`, and pack requires pick first. **200** `data`: Operation.

---

## 9. Inventory adjustments

Count the stock at one location and set it to the counted quantity.
Lifecycle: `draft ──validate──▶ done`, `draft ──cancel──▶ canceled`. Reference: `<WH>/ADJ/<NNNN>`.

### Adjustment object

```jsonc
{
  "_id": "…", "reference": "WH/ADJ/0001", "status": "draft",
  "warehouse": WarehouseRef, "location": LocationRef,
  "reason": "Damaged", "notes": "", "scheduledDate": "…",
  "responsible": { … }, "createdBy": UserRef, "validatedBy": UserRef, "validatedAt": "…",   // validated* absent until done
  "lines": [
    { "_id": "…", "product": ProductRef,
      "countedQuantity": 77,
      "systemQuantity": 80,  // recorded stock, snapshotted on create/edit and re-read on validate
      "difference": -3 }     // countedQuantity - systemQuantity
  ],
  "createdAt": "…", "updatedAt": "…"
}
```

### `GET /api/adjustments` (paginated)

Same query params as §8. `search` matches reference or reason.

### `GET /api/adjustments/:id`

**200** `data`: Adjustment.

### `POST /api/adjustments`

```json
{
  "location": "<locationId>",
  "reason": "Damaged",
  "notes": "",
  "scheduledDate": "2026-09-26",
  "lines": [{ "product": "<productId>", "countedQuantity": 77 }]
}
```

`countedQuantity` must be ≥ 0. **201** `data`: Adjustment (draft, with `systemQuantity`/`difference` previews).

### `PATCH /api/adjustments/:id`

Draft only. Body: any of `reason`, `notes`, `scheduledDate`, `responsible`, `lines`. The location
can't be changed. **200** `data`: Adjustment.

### `POST /api/adjustments/:id/validate`

- Re-reads the recorded quantity for each line.
- Sets stock to `countedQuantity` and stores the final `systemQuantity`/`difference`.
- Writes one ledger entry per non-zero difference: positive differences are `in`, negative are `out`.
- Lines with a difference of 0 change nothing and aren't logged.

**200** `data`: Adjustment (done).

### `POST /api/adjustments/:id/cancel`

Draft only. **200** `data`: Adjustment (canceled).

**Tip for the Stock screen ("update the stock from here"):** `POST /adjustments` with a single line,
then `POST /adjustments/:id/validate`.

---

## 10. Stock ledger (move history)

### `GET /api/ledger` (paginated, default limit 50)

| Query | Notes |
|---|---|
| `product`, `warehouse`, `location` | ids. `location` matches either end of a move |
| `refType` | csv of `initial,receipt,delivery,transfer,adjustment` |
| `direction` | `in` \| `out` \| `internal` |
| `search` | reference or contact |
| `dateFrom`, `dateTo` | filter `createdAt` |

**200** `data.items[]`, newest first. There is one entry per product per move:

```jsonc
{
  "_id": "…",
  "product": { "_id", "name", "sku", "uom" },
  "quantity": 20,                       // always positive
  "direction": "internal",              // in (green) | out (red) | internal
  "fromLocation": LocationRef | null,   // null = came from outside (vendor / adjustment gain)
  "toLocation": LocationRef | null,     // null = left the company (customer / adjustment loss)
  "fromQtyBefore": 100, "fromQtyAfter": 80,   // present when fromLocation is set
  "toQtyBefore": 0, "toQtyAfter": 20,         // present when toLocation is set
  "warehouses": ["<warehouseId>"],
  "refType": "transfer", "refId": "<documentId>", "reference": "WH/INT/0001",
  "contact": "", "note": "",
  "performedBy": UserRef,
  "createdAt": "…"
}
```

For display, use `fromLocation?.fullName ?? contact ?? "Vendor"` and
`toLocation?.fullName ?? contact ?? "Customer"`.

---

## 11. Dashboard

All values are computed on the server.

### `GET /api/dashboard/summary?warehouse=&category=`

```jsonc
{
  "products": {
    "total": 5,          // active products (in category, if filtered)
    "inStock": 4,        // KPI "Total Products in Stock": products with on hand > 0
    "lowStock": 1,       // 0 < on hand <= reorderLevel
    "outOfStock": 1,     // on hand <= 0
    "totalQuantity": 306
  },
  "lowStockItems": [     // up to 10 low/out products, lowest stock first
    { "_id", "name", "sku", "uom", "reorderLevel", "onHand": 0, "stockStatus": "out" }
  ],
  "receipts":   { "pending": 1, "draft": 1, "waiting": 0, "ready": 0, "late": 0, "upcoming": 0 },
  "deliveries": { "pending": 1, "draft": 0, "waiting": 0, "ready": 1, "late": 0, "upcoming": 0 },
  "transfers":  { "pending": 1, "draft": 1, "waiting": 0, "ready": 0, "late": 0, "upcoming": 0 },
  "adjustments": { "pending": 0 }
}
```

- `pending` counts open documents (`draft` + `waiting` + `ready`).
- `late` means open and `scheduledDate` before today. `upcoming` means open and `scheduledDate`
  after today.
- The mockup's card items map like this: "N to receive" / "N to deliver" = `ready`, "Late" = `late`,
  "Waiting" = `waiting`, "Operations" = `upcoming`.
- With `warehouse`, stock counts only that warehouse's locations (so "low" is judged against the
  reorder level using that warehouse's stock).
- With `category`, operations count only if they contain a product from that category.

### `GET /api/dashboard/operations` (paginated)

A single list of documents of every type, for the dashboard's filterable table.

| Query | Notes |
|---|---|
| `type` | csv of `receipt,delivery,transfer,adjustment` (default: all) |
| `status` | csv of statuses |
| `warehouse`, `category` | ids |
| `search` | reference or contact |

**200** `data.items[]`, sorted by `scheduledDate` (newest first):

```jsonc
{
  "_id": "…", "type": "delivery", "reference": "WH/OUT/0001", "status": "ready",
  "contact": "Azure Interior", "scheduledDate": "…", "warehouse": WarehouseRef,
  "from": "WH/Stock", "to": "Azure Interior",   // display strings
  "productCount": 1, "totalQuantity": 5, "createdAt": "…"
}
```

---

## 12. Business rules summary

- **Stock is stored per product per location** (StockQuant). A product's total is the sum over its
  locations. Only `services/stock.service.js` changes stock.
- **Every stock change writes a ledger entry**, in the same transaction as the change.
- **Stock can never go negative.** Decreases are conditional updates, so a delivery, transfer or
  adjustment that would overdraw fails with 400 and applies nothing.
- **Reserved** = quantities on deliveries/transfers in `ready` status, counted at their source
  location. `freeToUse = onHand - reserved`. Validation checks on-hand stock, not free stock.
- **Warehouses and locations with history can't be deleted.** Products are archived instead of
  deleted.
- Roles (`manager`, `staff`) are stored but not enforced. Every logged-in user can do everything.
