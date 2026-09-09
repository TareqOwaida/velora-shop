# VELORA clothing store

A multipage React clothing shop with an Express API, SQLite persistence, GSAP animation, customer accounts, pay-on-delivery checkout, and a protected admin dashboard.

## Run locally

Requires Node.js 24.11 or newer. From this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

Open **http://127.0.0.1:5173**. The API runs on port 3001. Use the exact `127.0.0.1` address: the API intentionally rejects other request origins. No external account is needed for local development. `data/velora.sqlite` is created automatically and is excluded from version control.

## Create your administrator

```powershell
npm.cmd run admin:create
```

The interactive command asks for a name, email, and hidden password of at least 12 characters. It displays a private setup key for a time-based authenticator app and requires a valid six-digit code before creating the account. Keep the setup key in your password manager for recovery. Then open **http://127.0.0.1:5173/admin** and sign in with the password and authenticator code.

There is no default administrator, public role-promotion endpoint, or administrator password in the frontend. Use a separate staff email; the command refuses to convert an existing customer account. Operator-level account recovery currently requires server/database access; no online recovery bypass is provided.

## Pages and features

- `/`: editorial homepage, entrance reveals, scroll-linked image movement, animated ticker with pause, collection cards, featured products, and journal feature.
- `/shop`: 54 sample products for men, women, and kids across 14 categories. Search, category filters, URL-addressable departments, and price sorting.
- `/product/:id`: product details, colors, sizes, quantity, saved items, and related pieces.
- `/saved`, `/cart`: persistent browser bag and favorites; color/size variants remain separate.
- `/register`, `/account`: real customer registration, sign-in/out, and private order history.
- `/checkout`, `/order/:id`: authenticated delivery checkout, server-priced quote, VELORA10 discount, persisted confirmation, and order tracking.
- `/projects`, `/projects/:slug`: four editorial projects with shoppable selections.
- `/admin`: live overview, inventory editing, fulfillment transitions, customer directory, and an audit log. Sections have shareable `?view=` URLs.
- `/help`, `/privacy`: current store behavior and clearly identified business details still needed before launch.

Prices are USD. Checkout uses **pay on delivery** and does not collect or charge cards. Orders remain unpaid at creation. The dashboard reports order value rather than pretending it is collected revenue. Shipping is $18 below $200 after discount and free above that threshold. Discount rounding follows the catalog's whole-dollar display. Tax is currently zero and must be configured for the actual business before launch. Inventory is pooled per product across its options; use a SKU-level inventory model if separate size/color counts are required.

## Verification

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Security integration tests exercise isolated temporary databases, including anonymous/private access, CSRF and origin rejection, role injection, password hashing, admin authorization, forged prices, quantities and variants, duplicate checkout, cross-account order access, TOTP, logout, cancellation, and stock changes. Browser tests cover desktop and mobile layouts, search/filters/saved items, variant persistence, account creation, checkout, order history, admin stock/fulfillment changes, and reduced motion.

The browser suite serves the actual production build on port 4173. Run `build` before the suite. Its staff credentials exist only in a separate temporary test database, never in the normal store database. Screenshots are written to `screenshots/`; failure traces are under ignored `test-results/`.

## Security design

- Passwords: salted scrypt (`N=32768`, `r=8`, `p=3`); constant-time digest comparisons; 12–128 character limits; generic login failures.
- Sessions: random 256-bit tokens, only SHA-256 digests in the database, HttpOnly/SameSite=Strict cookies, rotation on authentication, server invalidation on logout. Customer sessions expire after 24 hours; admin sessions after 30 minutes.
- Administration: database-backed role checks on every admin API; mandatory TOTP, short session lifetime, and replay prevention for previously used codes.
- Writes: exact allowed Origin, JSON content type, session-bound CSRF tokens, strict Zod schemas, 24 KB body limit, and parameterized SQL.
- Orders: ownership enforced in SQL; prices/options/promotions checked against the server catalog; stock validation and decrement in an immediate transaction; per-customer idempotency keys; cancellation restocks only once.
- Abuse controls: API, authentication and ordering rate limits; persistent per-email login attempt limits. Default IP limiting does not trust forwarded IP headers.
- HTTP: Helmet CSP, anti-framing, nosniff, private API cache controls, no credentialed cross-origin API access, no card collection, and generic internal-error responses.
- Database files, logs, and environment files are never served by the static file handler. Only `dist/` is served publicly.

This is a tested application baseline, not a guarantee against every attack or a completed independent penetration test. SQLite stores customer/address records and TOTP seeds without application-level encryption. Protect the database and backups with restrictive service-account ACLs and encrypted storage. Disk compromise requires separate infrastructure controls.

## Production deployment

This implementation needs one persistent Node.js host and disk; it is **not suitable for ephemeral serverless filesystem deployment** without replacing SQLite with a managed database and shared rate-limit/session infrastructure.

1. Replace sample catalog photography/content, set the real shipping coverage, tax rules, support contact, returns policy, and privacy/data-retention process. The bundled Unsplash photographs are served locally; some are illustrative rather than exact SKU photography.
2. Build with `npm.cmd run build` and serve with `npm.cmd start` behind a trusted TLS reverse proxy. The app listens only on loopback.
3. Set `NODE_ENV=production`, `APP_ORIGIN=https://your-store.example`, `PORT`, and persistent `DATA_DIR`. Production refuses to start without an HTTPS origin and enables Secure cookies and HSTS. `.env.example` documents the local settings.
4. Enable `TRUST_PROXY=1` only with exactly one trusted reverse proxy that overwrites forwarding headers. Keep the Node port private.
5. Configure database/backup permissions, encrypted storage, tested backups, monitoring, dependency updates, and edge-level request/DDoS controls. Migrate the process-local IP limiter before scaling to multiple instances.
6. Provision your administrator with the local CLI. Arrange offline operator recovery and periodic account/access reviews.
7. For online card payments, add a hosted payment provider and verify signed webhooks and amounts server-side. Do not collect card data directly or mark orders paid from a redirect URL.

## Animation research

Research informed the visual direction rather than reproducing another website:

- [Awwwards: high-fidelity scrolling experience](https://www.awwwards.com/inspiration/high-fidelity-3d-scrolling-experience): inspiration for scroll-linked editorial movement.
- [Awwwards: Terminal 27 events](https://www.awwwards.com/inspiration/events-terminal-27): inspiration for connecting fashion commerce with editorial projects.
- [GSAP ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): implementation reference for bounded scroll animation and component cleanup.
- [Motion reduced-motion guidance](https://motion.dev/docs/react-use-reduced-motion): accessibility reference; this project implements the preference through a local hook and CSS.
- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), and [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): security design references.
