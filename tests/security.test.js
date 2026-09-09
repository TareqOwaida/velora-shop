import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
const directory = mkdtempSync(join(tmpdir(), "velora-security-"));
process.env.DATA_DIR = directory;
process.env.NO_LISTEN = "1";
process.env.APP_ORIGIN = "http://127.0.0.1:5173";
const { app } = await import("../server/index.js");
const { db } = await import("../server/db.js");
const { passwordHash, totpCode, verifyTotp, newTotpSecret } =
  await import("../server/security.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(directory, { recursive: true, force: true });
});
function client() {
  let cookie = "",
    csrf = "";
  return {
    async request(path, method = "GET", body, overrides = {}) {
      const headers = {
        Cookie: cookie,
        Origin: process.env.APP_ORIGIN,
        ...(method === "GET"
          ? {}
          : { "Content-Type": "application/json", "X-CSRF-Token": csrf }),
        ...overrides,
      };
      const response = await fetch(base + path, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      const data = await response.json();
      if (data.csrf) csrf = data.csrf;
      return { response, data };
    },
  };
}
const account = {
  name: "Test Customer",
  email: "customer@example.test",
  password: "A-long-unique-passphrase-941!",
};
const lines = [{ id: "men-tee", size: "M", color: "White", qty: 2 }];
const shipping = {
  name: "Test Customer",
  phone: "+201001234567",
  address: "10 Example Street",
  city: "Cairo",
  postal: "11511",
  country: "Egypt",
};
test("store security and commerce boundaries", async (t) => {
  const customer = client(),
    stranger = client(),
    staff = client();
  await customer.request("/session");
  await stranger.request("/session");
  await staff.request("/session");
  await t.test("anonymous requests cannot read private data", async () => {
    assert.equal(
      (await stranger.request("/admin/dashboard")).response.status,
      401,
    );
    assert.equal((await stranger.request("/orders")).response.status, 401);
    const catalog = (await stranger.request("/products")).data;
    assert.equal(catalog.length, 54);
    assert.equal(new Set(catalog.map(product => product.id)).size, 54);
  });
  await t.test(
    "rejects CSRF, foreign origins, and role injection at registration",
    async () => {
      assert.equal(
        (
          await customer.request("/auth/register", "POST", account, {
            "X-CSRF-Token": "invalid",
          })
        ).response.status,
        403,
      );
      assert.equal(
        (
          await customer.request("/auth/register", "POST", account, {
            Origin: "https://attacker.example",
          })
        ).response.status,
        403,
      );
      assert.equal(
        (
          await customer.request("/auth/register", "POST", {
            ...account,
            role: "admin",
          })
        ).response.status,
        400,
      );
    },
  );
  await t.test(
    "creates customer with a hashed password and private session cookie",
    async () => {
      const { response, data } = await customer.request(
        "/auth/register",
        "POST",
        account,
      );
      assert.equal(response.status, 201);
      assert.equal(data.user.role, "customer");
      assert.equal(data.user.password, undefined);
      assert.match(response.headers.get("set-cookie"), /HttpOnly/);
      assert.match(response.headers.get("set-cookie"), /SameSite=Strict/);
      assert.notEqual(
        db
          .prepare("SELECT password FROM users WHERE email=?")
          .get(account.email).password,
        account.password,
      );
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.match(
        response.headers.get("content-security-policy"),
        /frame-ancestors 'none'/,
      );
    },
  );
  await t.test("customers cannot read or mutate admin resources", async () => {
    assert.equal(
      (await customer.request("/admin/dashboard")).response.status,
      403,
    );
    assert.equal(
      (
        await customer.request("/admin/inventory/men-tee", "PATCH", {
          stock: 999,
        })
      ).response.status,
      403,
    );
  });
  await t.test(
    "prices, promotions, quantities and variants are server validated",
    async () => {
      const { data } = await customer.request("/checkout/quote", "POST", {
        lines,
        promo: "VELORA10",
      });
      assert.equal(data.totals.subtotal, 116);
      assert.equal(data.totals.discount, 12);
      assert.equal(data.totals.total, 122);
      assert.equal(
        (
          await customer.request("/checkout/quote", "POST", {
            lines: [{ ...lines[0], price: 0 }],
          })
        ).response.status,
        400,
      );
      assert.equal(
        (
          await customer.request("/checkout/quote", "POST", {
            lines: [{ ...lines[0], qty: -2 }],
          })
        ).response.status,
        400,
      );
      assert.equal(
        (
          await customer.request("/checkout/quote", "POST", {
            lines: [{ ...lines[0], color: "FAKE" }],
          })
        ).response.status,
        400,
      );
      assert.equal(
        (
          await customer.request("/checkout/quote", "POST", {
            lines: [
              { ...lines[0], qty: 10 },
              { ...lines[0], qty: 10 },
            ],
          })
        ).response.status,
        400,
      );
    },
  );
  let orderId;
  await t.test(
    "checkout persists once and decrements stock atomically",
    async () => {
      const input = {
        lines,
        shipping,
        promo: "VELORA10",
        payment: "cod",
        requestKey: randomUUID(),
      };
      const first = await customer.request("/orders", "POST", input),
        second = await customer.request("/orders", "POST", input);
      assert.equal(first.response.status, 201);
      assert.equal(second.data.id, first.data.id);
      orderId = first.data.id;
      assert.equal(
        db.prepare("SELECT stock FROM inventory WHERE id=?").get("men-tee")
          .stock,
        38,
      );
      const order = await customer.request("/orders/" + orderId);
      assert.equal(order.data.paymentStatus, "Unpaid");
      assert.equal(order.data.lines[0].color, "White");
      assert.equal(order.data.totals.total, 122);
    },
  );
  await t.test(
    "a second customer cannot read another customer’s order",
    async () => {
      await stranger.request("/auth/register", "POST", {
        ...account,
        email: "second@example.test",
      });
      assert.equal(
        (await stranger.request("/orders/" + orderId)).response.status,
        404,
      );
      assert.deepEqual((await stranger.request("/orders")).data, []);
      assert.equal(
        (await stranger.request("/orders/%27%20OR%201=1--")).response.status,
        404,
      );
    },
  );
  const secret = newTotpSecret(),
    adminId = randomUUID();
  await t.test("TOTP matches RFC 6238 vectors and rejects replay", () => {
    assert.equal(totpCode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1), "287082");
    const counter = Math.floor(Date.now() / 30000);
    assert.equal(verifyTotp(secret, totpCode(secret, counter), counter), null);
  });
  await t.test(
    "admin sign-in requires password plus authenticator code",
    async () => {
      db.prepare(
        "INSERT INTO users (id,name,email,password,role,totp,created) VALUES (?,?,?,?,?,?,?)",
      ).run(
        adminId,
        "Test Admin",
        "admin@example.test",
        await passwordHash(account.password),
        "admin",
        secret,
        new Date().toISOString(),
      );
      const body = { email: "admin@example.test", password: account.password };
      assert.equal(
        (await staff.request("/auth/login", "POST", body)).response.status,
        401,
      );
      assert.equal(
        (
          await staff.request("/auth/login", "POST", {
            ...body,
            code: totpCode(secret, Math.floor(Date.now() / 30000)),
          })
        ).response.status,
        200,
      );
      assert.equal(
        (await staff.request("/admin/dashboard")).response.status,
        200,
      );
    },
  );
  await t.test(
    "admin changes persist and cancelling restocks exactly once",
    async () => {
      assert.equal(
        (
          await staff.request("/admin/inventory/men-tee", "PATCH", {
            stock: -1,
          })
        ).response.status,
        400,
      );
      assert.equal(
        (
          await staff.request("/admin/orders/" + orderId, "PATCH", {
            status: "Cancelled",
          })
        ).response.status,
        200,
      );
      assert.equal(
        db.prepare("SELECT stock FROM inventory WHERE id=?").get("men-tee")
          .stock,
        40,
      );
      assert.equal(
        (
          await staff.request("/admin/orders/" + orderId, "PATCH", {
            status: "Cancelled",
          })
        ).response.status,
        409,
      );
      assert.equal(
        db.prepare("SELECT stock FROM inventory WHERE id=?").get("men-tee")
          .stock,
        40,
      );
      assert.equal(
        (await staff.request("/admin/dashboard")).data.audit.length,
        1,
      );
      await staff.request("/admin/inventory/men-tee", "PATCH", { stock: 0 });
      assert.equal(
        (
          await customer.request("/orders", "POST", {
            lines,
            shipping,
            payment: "cod",
            requestKey: randomUUID(),
          })
        ).response.status,
        409,
      );
    },
  );
  await t.test("logout invalidates the server session", async () => {
    await customer.request("/auth/logout", "POST", {});
    assert.equal((await customer.request("/orders")).response.status, 401);
    assert.equal((await customer.request("/session")).data.user, null);
  });
});
