# Verification — September 9, 2026

The verified flow is catalog → product/variant selection → persistent bag → account creation → server-priced checkout → saved order → private customer history → staff fulfillment and inventory updates.

| Check | Result | Evidence |
| --- | --- | --- |
| Production build | Passed | Vite creates the deployable `dist/` bundle |
| React/source lint | Passed | No warnings or errors from oxlint |
| API/security suite | 12 passed | `npm.cmd test`; separate temporary SQLite database |
| Browser suite | 6 passed | `npm.cmd run test:e2e`; actual production build in Chromium |
| Runtime dependency audit | Passed | `npm.cmd audit --omit=dev` reported 0 known vulnerabilities |
| Desktop homepage | Passed | Images, animation, navigation, no JavaScript errors, no horizontal overflow |
| Mobile pages | Passed | 390px viewport; home, shop, projects, registration, product, bag and admin sign-in |
| Reduced motion | Passed | Ticker and page movement honor the device preference |
| Purchase | Passed | Account creation, promo quote, pay-on-delivery order, reload persistence and order history |
| Administration | Passed | Password + TOTP sign-in, stock update persists after reload, order advances to shipped |

Security checks include CSRF, origin validation, role escalation attempts, hashed passwords and private cookies, cross-customer order access, invalid variants/quantities, forged prices, duplicate orders, atomic inventory updates, cancellation restocking, TOTP replay, and logout invalidation.

Browser checks found and resolved a duplicate catalog ID, category-row overflow on mobile, and a password field's accessible label including helper text. Product colors now remain distinct in the bag. All 35 photographs are bundled locally, removing the runtime image-service dependency.

Screenshots:

- [Desktop homepage](screenshots/home-desktop.png)
- [Mobile homepage](screenshots/home-mobile.png)
- [Mobile catalog](screenshots/shop-mobile.png)
- [Checkout](screenshots/checkout-desktop.png)
- [Admin dashboard](screenshots/admin-desktop.png)

These are local functional and security regression checks, not an independent penetration test or a claim of immunity to attacks. Production still requires TLS, protected persistent storage/backups, business policies and tax/shipping configuration. See README.md. Card payments are not configured; checkout uses pay on delivery.
