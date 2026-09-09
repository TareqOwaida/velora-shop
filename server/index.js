import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { db, transaction } from "./db.js";
import {
  hash,
  token,
  passwordHash,
  verifyPassword,
  verifyTotp,
} from "./security.js";
import { products, getProduct } from "../src/data/products.js";
import { cartTotals } from "../src/lib/money.js";

export const app = express();
const production = process.env.NODE_ENV === "production";
const origin = process.env.APP_ORIGIN || "http://127.0.0.1:5173";
if (production && !origin.startsWith("https://"))
  throw new Error("Production requires an HTTPS APP_ORIGIN");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: production ? [] : null,
      },
    },
    strictTransportSecurity: production ? undefined : false,
  }),
);
const api = express.Router();
app.use("/api", api);
api.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
api.use(
  rateLimit({
    windowMs: 60000,
    limit: 150,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in a minute." },
  }),
);
api.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.get("origin") !== origin || !req.is("application/json"))
      return res
        .status(403)
        .json({ error: "Request origin or content type rejected." });
  }
  next();
});
api.use(express.json({ limit: "24kb", strict: true }));
const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
const parse = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) fail(400, result.error.issues[0].message);
  return result.data;
};
const text = (min, max) => z.string().trim().min(min).max(max);
const emailSchema = z
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const credentials = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(12, "Use a password with at least 12 characters.")
    .max(128),
  code: z.string().max(6).optional(),
});
function session(req) {
  const raw = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("velora_session="))
    ?.slice(15);
  if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return null;
  return db
    .prepare(
      `SELECT sessions.*, users.name, users.email, users.role FROM sessions LEFT JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?`,
    )
    .get(hash(raw), Date.now());
}
function newSession(res, user = null) {
  const raw = token(),
    csrf = token();
  const lifetime =
    user?.role === "admin" ? 30 * 60000 : user ? 24 * 60 * 60000 : 60 * 60000;
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?)").run(
    hash(raw),
    user?.id || null,
    csrf,
    Date.now() + lifetime,
  );
  res.cookie("velora_session", raw, {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
    maxAge: lifetime,
  });
  return csrf;
}
const publicUser = (user) =>
  user
    ? {
        id: user.id || user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : null;
api.use((req, res, next) => {
  req.session = session(req);
  next();
});
api.get("/session", (req, res) => {
  const current = req.session;
  res.json({
    csrf: current?.csrf || newSession(res),
    user: current?.user_id ? publicUser(current) : null,
  });
});
api.use((req, res, next) => {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    (!req.session || req.get("x-csrf-token") !== req.session.csrf)
  )
    return res
      .status(403)
      .json({ error: "Session expired. Refresh the page and try again." });
  next();
});
function auth(req, res, next) {
  if (!req.session?.user_id)
    return res.status(401).json({ error: "Please sign in to continue." });
  next();
}
function admin(req, res, next) {
  if (req.session?.role !== "admin")
    return res.status(403).json({ error: "Administrator access required." });
  next();
}
const authLimit = rateLimit({
  windowMs: 15 * 60000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
});
api.post("/auth/register", authLimit, async (req, res) => {
  const input = parse(
    credentials.extend({ name: text(2, 80) }).strict(),
    req.body,
  );
  const password = await passwordHash(input.password);
  const user = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    role: "customer",
  };
  try {
    db.prepare(
      "INSERT INTO users (id,name,email,password,created) VALUES (?,?,?,?,?)",
    ).run(user.id, user.name, user.email, password, new Date().toISOString());
  } catch (error) {
    if (error.code?.includes("SQLITE"))
      fail(409, "Unable to create account with these details. Try signing in.");
    throw error;
  }
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.session.token);
  res.status(201).json({ user, csrf: newSession(res, user) });
});
const dummyPassword = await passwordHash(token());
api.post("/auth/login", authLimit, async (req, res) => {
  const input = parse(credentials.strict(), req.body);
  const key = hash(input.email),
    now = Date.now();
  const limit = db
    .prepare("SELECT * FROM login_limits WHERE key=? AND expires>?")
    .get(key, now);
  if (limit?.count >= 8)
    fail(429, "Too many sign-in attempts. Try again in 15 minutes.");
  db.prepare(
    "INSERT INTO login_limits VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET count=?, expires=?",
  ).run(
    key,
    1,
    now + 900000,
    (limit?.count || 0) + 1,
    limit?.expires || now + 900000,
  );
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(input.email);
  const valid = await verifyPassword(
    input.password,
    user?.password || dummyPassword,
  );
  if (!user || !valid)
    fail(401, "Email, password, or authentication code is incorrect.");
  if (user.role === "admin") {
    const last = db
      .prepare("SELECT counter FROM used_totp WHERE user_id=?")
      .get(user.id)?.counter;
    const counter = user.totp ? verifyTotp(user.totp, input.code, last) : null;
    if (counter === null)
      fail(401, "Email, password, or authentication code is incorrect.");
    db.prepare(
      "INSERT INTO used_totp VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET counter=excluded.counter",
    ).run(user.id, counter);
  }
  db.prepare("DELETE FROM login_limits WHERE key=?").run(key);
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.session.token);
  res.json({ user: publicUser(user), csrf: newSession(res, user) });
});
api.post("/auth/logout", (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token=?").run(req.session.token);
  res.json({ user: null, csrf: newSession(res) });
});
api.get("/products", (req, res) =>
  res.json(
    products.map((product) => ({
      ...product,
      stock: db
        .prepare("SELECT stock FROM inventory WHERE id=?")
        .get(product.id).stock,
    })),
  ),
);
const lineSchema = z
  .object({
    id: text(1, 80),
    size: text(1, 30),
    color: text(1, 40),
    qty: z.number().int().min(1).max(10),
  })
  .strict();
const cartSchema = z.object({
  lines: z.array(lineSchema).min(1).max(50),
  promo: z.enum(["", "VELORA10"]).default(""),
});
function quote(input) {
  const counts = new Map(),
    variants = new Map();
  for (const line of input.lines) {
    const product = getProduct(line.id);
    if (
      !product ||
      !product.sizes.includes(line.size) ||
      !product.colors.includes(line.color)
    )
      fail(400, "A selected product option is unavailable.");
    counts.set(line.id, (counts.get(line.id) || 0) + line.qty);
    const key = `${line.id}|${line.size}|${line.color}`;
    const existing = variants.get(key);
    if (existing) {
      existing.qty += line.qty;
      if (existing.qty > 10) fail(400, "Maximum 10 of each option per order.");
    } else
      variants.set(key, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: line.size,
        color: line.color,
        qty: line.qty,
      });
  }
  for (const [id, qty] of counts)
    if (
      qty > db.prepare("SELECT stock FROM inventory WHERE id=?").get(id).stock
    )
      fail(
        409,
        `${getProduct(id).name} has insufficient stock. Please update your bag.`,
      );
  const lines = [...variants.values()];
  return { lines, totals: cartTotals(lines, input.promo), counts };
}
api.post("/checkout/quote", auth, (req, res) => {
  const { lines, totals } = quote(parse(cartSchema.strict(), req.body));
  res.json({ lines, totals });
});
const addressSchema = z
  .object({
    name: text(2, 80),
    address: text(5, 200),
    city: text(2, 80),
    postal: text(2, 20),
    country: text(2, 80),
    phone: text(7, 25).regex(/^[+0-9 ()-]+$/, "Enter a valid phone number."),
  })
  .strict();
api.post(
  "/orders",
  auth,
  rateLimit({
    windowMs: 60000,
    limit: 10,
    message: { error: "Please wait before placing another order." },
  }),
  (req, res) => {
    const input = parse(
      cartSchema
        .extend({
          shipping: addressSchema,
          requestKey: z.uuid(),
          payment: z.literal("cod"),
        })
        .strict(),
      req.body,
    );
    const result = transaction(() => {
      const previous = db
        .prepare("SELECT id FROM orders WHERE user_id=? AND request_key=?")
        .get(req.session.user_id, input.requestKey);
      if (previous) return { id: previous.id };
      const { lines, totals, counts } = quote(input);
      const id = randomUUID(),
        created = new Date().toISOString();
      for (const [productId, qty] of counts)
        db.prepare("UPDATE inventory SET stock=stock-? WHERE id=?").run(
          qty,
          productId,
        );
      db.prepare(
        "INSERT INTO orders (id,user_id,request_key,payload,created) VALUES (?,?,?,?,?)",
      ).run(
        id,
        req.session.user_id,
        input.requestKey,
        JSON.stringify({
          lines,
          totals,
          shipping: input.shipping,
          payment: "Cash on delivery",
          paymentStatus: "Unpaid",
          email: req.session.email,
        }),
        created,
      );
      return { id };
    });
    res.status(201).json(result);
  },
);
const orderData = (row) => ({
  id: row.id,
  ...JSON.parse(row.payload),
  status: row.status,
  created: row.created,
});
api.get("/orders", auth, (req, res) =>
  res.json(
    db
      .prepare(
        "SELECT * FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 100",
      )
      .all(req.session.user_id)
      .map(orderData),
  ),
);
api.get("/orders/:id", auth, (req, res) => {
  const order = db
    .prepare("SELECT * FROM orders WHERE id=? AND user_id=?")
    .get(req.params.id, req.session.user_id);
  if (!order) fail(404, "Order not found.");
  res.json(orderData(order));
});
api.use("/admin", auth, admin);
api.get("/admin/dashboard", (req, res) => {
  const orders = db
    .prepare("SELECT * FROM orders ORDER BY created DESC LIMIT 500")
    .all()
    .map(orderData);
  const customers = db
    .prepare(
      "SELECT id,name,email,created FROM users WHERE role='customer' ORDER BY created DESC LIMIT 500",
    )
    .all();
  const inventory = products.map((p) => ({
    ...p,
    stock: db.prepare("SELECT stock FROM inventory WHERE id=?").get(p.id).stock,
  }));
  res.json({
    orders,
    customers,
    products: inventory,
    audit: db
      .prepare(
        "SELECT action,target,created FROM audit ORDER BY id DESC LIMIT 30",
      )
      .all(),
  });
});
function audit(req, action, target) {
  db.prepare(
    "INSERT INTO audit (user_id,action,target,created) VALUES (?,?,?,?)",
  ).run(req.session.user_id, action, target, new Date().toISOString());
}
api.patch("/admin/inventory/:id", (req, res) => {
  const { stock } = parse(
    z.object({ stock: z.number().int().min(0).max(100000) }).strict(),
    req.body,
  );
  if (!getProduct(req.params.id)) fail(404, "Product not found.");
  transaction(() => {
    db.prepare("UPDATE inventory SET stock=? WHERE id=?").run(
      stock,
      req.params.id,
    );
    audit(req, `Stock set to ${stock}`, req.params.id);
  });
  res.json({ stock });
});
const transitions = {
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};
api.patch("/admin/orders/:id", (req, res) => {
  const { status } = parse(
    z
      .object({
        status: z.enum(["Processing", "Shipped", "Delivered", "Cancelled"]),
      })
      .strict(),
    req.body,
  );
  transaction(() => {
    const order = db
      .prepare("SELECT * FROM orders WHERE id=?")
      .get(req.params.id);
    if (!order) fail(404, "Order not found.");
    if (!transitions[order.status].includes(status))
      fail(409, "This order status transition is not allowed.");
    if (status === "Cancelled")
      for (const line of JSON.parse(order.payload).lines)
        db.prepare("UPDATE inventory SET stock=stock+? WHERE id=?").run(
          line.qty,
          line.id,
        );
    db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, order.id);
    audit(req, `Order ${status}`, order.id);
  });
  res.json({ status });
});
api.use((req, res) => res.status(404).json({ error: "API route not found." }));
app.use(express.static(resolve("dist"), { dotfiles: "deny", index: false }));
app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  if (status >= 500) console.error("Request failed:", error.code || error.name);
  res.status(status).json({
    error:
      status >= 500
        ? "Something went wrong. Please try again."
        : error.type === "entity.parse.failed"
          ? "Invalid JSON."
          : error.message,
  });
});
const cleanup = setInterval(() => {
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("DELETE FROM login_limits WHERE expires<?").run(Date.now());
}, 60000);
cleanup.unref();
if (process.env.NO_LISTEN !== "1")
  app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
    console.log(
      `VELORA API ready on http://127.0.0.1:${process.env.PORT || 3001}`,
    ),
  );
