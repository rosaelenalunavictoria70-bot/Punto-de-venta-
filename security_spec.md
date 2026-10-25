# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched (`/databases/{database}/documents/{document=**}`) denies all reads and writes.
2. **Authentication & Verified Email Mandate**: Every write operation (`create`, `update`, `delete`) across `/admins`, `/sales_users`, `/customers`, `/products`, and `/orders` requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Owner Identity Binding (`ownerId`)**: Every document in `/sales_users`, `/customers`, `/products`, and `/orders` must have `ownerId == request.auth.uid` on creation, and `ownerId` is strictly immutable during updates (`incoming().ownerId == existing().ownerId`).
4. **PII & List Query Enforcement**: Collections containing customer and salesperson PII (`/customers`, `/sales_users`, `/orders`) strictly prohibit blanket reads. Both `get` and `list` require `resource.data.ownerId == request.auth.uid || isAdmin()`.
5. **Path Variable Hardening (`isValidId`)**: Document IDs (`adminId`, `salesUserId`, `customerId`, `productId`, `orderId`) on single-document operations (`get`, `create`, `update`, `delete`) must match `^[a-zA-Z0-9_\-]+$` and be `<= 128` characters.
6. **Strict Schema & Shadow Field Rejection**: Every `create` and `update` call invokes `isValid[Entity](incoming())` enforcing `hasAll` and `hasOnly` key allowlists, string length limits, enum constraints, and `request.time` server timestamp equality.
7. **Terminal State Locking**: Orders in `/orders/{orderId}` that have reached a terminal status (`status == 'entregado_y_cobrado'` or `status == 'cancelado'`) cannot be modified by non-admin users.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Customer Creation)**: Authenticated user `user_A` attempts to create `/customers/c-1` with `ownerId: "user_B"`.
2. **Payload 2 (Unverified Email Spoofing on Admin Access)**: Attacker with `email: "rosaelenalunavictoria70@gmail.com"` but `email_verified: false` attempts to read `/customers/c-1`.
3. **Payload 3 (Shadow Field Injection on Product Creation)**: User creates `/products/p-1` with valid fields plus `{ "isSuperFeatured": true }`.
4. **Payload 4 (Value Poisoning on Order Update)**: User updates `/orders/ord-1` with `status: 99999` (number instead of allowed enum string) or a 10KB string.
5. **Payload 5 (ID Poisoning Attack)**: User attempts to create `/customers/invalid$id!with@spaces` or a 500-character document ID.
6. **Payload 6 (Immortal Field Mutation)**: User attempts to update `/customers/c-1` changing `createdAt` or `ownerId`.
7. **Payload 7 (Client Timestamp Forgery)**: User attempts to create `/orders/ord-1` with a past or future client timestamp instead of `request.time`.
8. **Payload 8 (PII Blanket Read / Cross-Tenant Leak)**: Authenticated user `user_B` attempts `get` or `list` on `/customers` belonging to `user_A`.
9. **Payload 9 (Self-Assigned Admin Escalation)**: Standard user `user_B` attempts to create `/admins/user_B` to grant themselves admin privileges.
10. **Payload 10 (Terminal State Re-opening)**: Non-admin user attempts to update an order whose existing `status` is already `'cancelado'` back to `'pendiente_entrega'`.
11. **Payload 11 (Denial-of-Wallet Oversized String)**: User submits a customer `address` of 5,000 characters (exceeding `maxLength: 250`).
12. **Payload 12 (Unauthenticated Write)**: Anonymous/unauthenticated client attempts to create a document in `/orders/ord-anon`.
