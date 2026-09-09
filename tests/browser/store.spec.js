import { test, expect } from "@playwright/test";
import { totpCode } from "../../server/security.js";

for (const route of ["/shop", "/saved"]) {
  test(`wishlist changes preserve the other product cards on ${route}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("velora-wishlist")) {
        localStorage.setItem(
          "velora-wishlist",
          JSON.stringify(["men-bomber", "men-tee", "men-court"]),
        );
      }
    });
    await page.goto(route);
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".grid-item")].every((card) => {
        const style = getComputedStyle(card);
        return (
          style.opacity === "1" &&
          (style.transform === "none" ||
            new DOMMatrixReadOnly(style.transform).f === 0)
        );
      }),
    );
    const heart = page.getByRole("button", {
      name: "Remove Transit Bomber from saved",
      exact: true,
    });
    await heart.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const peers = [...document.querySelectorAll(".grid-item")].filter(
        (card) => !card.querySelector('a[href="/product/men-bomber"]'),
      );
      const state = { peers, styleChanges: 0, scroll: scrollY };
      const observer = new MutationObserver((records) => {
        state.styleChanges += records.length;
      });
      peers.forEach((card) =>
        observer.observe(card, {
          attributes: true,
          attributeFilter: ["style"],
        }),
      );
      window.__wishlistCheck = state;
    });
    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) navigations++;
    });
    await heart.click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          JSON.parse(localStorage.getItem("velora-wishlist")),
        ),
      )
      .toEqual(["men-tee", "men-court"]);
    await expect(page.locator(".grid-item")).toHaveCount(
      route === "/shop" ? 54 : 2,
    );
    await expect(
      page.getByText("Saved items updated", { exact: true }),
    ).toHaveCount(0);
    const result = await page.evaluate(() => ({
      styleChanges: window.__wishlistCheck.styleChanges,
      sameCards: window.__wishlistCheck.peers.every((card) => card.isConnected),
      scrollStayed: Math.abs(scrollY - window.__wishlistCheck.scroll) < 1,
    }));
    expect(result.styleChanges).toBe(0);
    expect(result.sameCards).toBe(true);
    if (route === "/shop") expect(result.scrollStayed).toBe(true);
    expect(navigations).toBe(0);
    if (route === "/shop") {
      await page
        .getByRole("button", { name: "Save Transit Bomber", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Remove Transit Bomber from saved",
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        await page.evaluate(() => window.__wishlistCheck.styleChanges),
      ).toBe(0);
    }
    await page.reload();
    await expect(page.locator(".grid-item")).toHaveCount(
      route === "/shop" ? 54 : 2,
    );
  });
}

test("desktop homepage renders, photos load and navigation works", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "EVERYDAY.ANYTHINGBUT ORDINARY.",
  );
  await expect(page.locator(".hero-photo img")).toBeVisible();
  await expect
    .poll(() =>
      page.locator(".hero-photo img").evaluate((image) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/home-desktop.png" });
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Find your next favorite" }).click();
  await expect(page).toHaveURL("/shop");
  await expect(page.locator(".grid-item")).toHaveCount(54);
  expect(errors).toEqual([]);
});
test("category filters, sorting, search and saved items work", async ({
  page,
}) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Women", exact: true }).click();
  await expect(page.locator(".grid-item")).toHaveCount(18);
  await page.getByRole("button", { name: /^Knitwear/ }).click();
  await expect(page.locator(".grid-item")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Save Studio Merino Crew", exact: true })
    .click();
  await page.getByRole("link", { name: "Saved items, 1" }).click();
  await expect(page.locator(".grid-item")).toHaveCount(1);
  await page.goto("/shop");
  await page.getByLabel("Search collection").fill("Heavyweight");
  await expect(page.locator(".grid-item")).toHaveCount(1);
  await page.getByLabel("Search collection").fill("not-a-product");
  await expect(
    page.getByRole("heading", { name: "No pieces found." }),
  ).toBeVisible();
  await page.getByLabel("Search collection").fill("");
  await page.getByRole("combobox").selectOption("low");
  await expect(page.locator(".grid-item").first()).toContainText(
    "Mini Soft Rib Hat",
  );
});
test("product variants survive bag reload and can be independently removed", async ({
  page,
}) => {
  await page.goto("/product/men-tee");
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "Black", exact: true }).click();
  await page.getByRole("button", { name: /Add to bag.*\$/ }).click();
  await page.getByRole("button", { name: "White", exact: true }).click();
  await page.getByRole("button", { name: /Add to bag.*\$/ }).click();
  await page.getByRole("link", { name: "Bag, 2 items" }).click();
  await page.reload();
  await expect(page.locator("main li")).toHaveCount(2);
  await expect(page.locator("main")).toContainText("Black / Size M");
  await page
    .getByRole("button", { name: "Remove", exact: true })
    .first()
    .click();
  await expect(page.locator("main li")).toHaveCount(1);
  await expect(page.locator("main")).toContainText("White / Size M");
  await page.getByRole("button", { name: "Increase Heavyweight Tee" }).click();
  await expect(page.getByRole("link", { name: "Bag, 2 items" })).toBeVisible();
});
test("registration, checkout, confirmation and private order history", async ({
  page,
}) => {
  const email = `shopper-${Date.now()}@example.test`;
  await page.goto("/product/men-tee");
  await page.getByRole("button", { name: /Add to bag.*\$/ }).click();
  await page.goto("/checkout");
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Browser Shopper");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser-customer-passphrase-913!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/checkout");
  await page.getByLabel("Phone number").fill("+201001234567");
  await page.getByLabel("Street address").fill("20 Test Street");
  await page.getByLabel("City", { exact: true }).fill("Cairo");
  await page.getByLabel("Postal code").fill("11511");
  await page.getByLabel("Country", { exact: true }).fill("Egypt");
  await page.getByLabel("Promo code").fill("VELORA10");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Place order · $70" }),
  ).toBeEnabled();
  await page.screenshot({ path: "screenshots/checkout-desktop.png" });
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(
    page.getByRole("heading", { name: "Good choice." }),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("Pay $70 on delivery");
  const orderUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Good choice." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Your orders", exact: true }).click();
  await expect(page.locator(".order-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto(orderUrl);
  await expect(page.getByRole("alert")).toContainText("Please sign in");
});
test("admin is protected and staff can manage actual inventory and orders", async ({
  page,
  request,
}) => {
  const anonymous = await (await request.get("/api/session")).json();
  const headers = {
    Origin: "http://127.0.0.1:4173",
    "X-CSRF-Token": anonymous.csrf,
  };
  const registration = await request.post("/api/auth/register", {
    headers,
    data: {
      name: "Fulfillment Customer",
      email: `fulfillment-${Date.now()}@example.test`,
      password: "Unique-fulfillment-test-password-972!",
    },
  });
  expect(registration.status()).toBe(201);
  const customer = await registration.json();
  const order = await request.post("/api/orders", {
    headers: { ...headers, "X-CSRF-Token": customer.csrf },
    data: {
      lines: [{ id: "men-tee", color: "White", size: "M", qty: 1 }],
      shipping: {
        name: "Fulfillment Customer",
        phone: "+201001234567",
        address: "40 Test Road",
        city: "Cairo",
        postal: "11511",
        country: "Egypt",
      },
      payment: "cod",
      requestKey: crypto.randomUUID(),
    },
  });
  expect(order.status()).toBe(201);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin sign in." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("browser-admin@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser-test-passphrase-582!");
  await page
    .getByLabel("Authenticator code")
    .fill(
      totpCode(
        "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
        Math.floor(Date.now() / 30000),
      ),
    );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview." })).toBeVisible();
  await page.screenshot({ path: "screenshots/admin-desktop.png" });
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await page.getByLabel("Search inventory").fill("Heavyweight");
  await page
    .getByLabel("Stock for Heavyweight Tee", { exact: true })
    .fill("27");
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/inventory/men-tee") &&
      response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await page.reload();
  await expect(
    page.getByLabel("Stock for Heavyweight Tee", { exact: true }),
  ).toHaveValue("27");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fulfillment" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark shipped" }).first().click();
  await expect(
    page.getByRole("button", { name: "Mark delivered" }).first(),
  ).toBeVisible();
});
test("mobile pages fit the viewport and respect reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".hero-photo")).toBeVisible();
  await expect(page.locator(".ticker-track")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.screenshot({ path: "screenshots/home-mobile.png" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Women", exact: true })
    .click();
  await expect(page).toHaveURL("/shop?tab=women");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  for (const route of [
    "/shop",
    "/projects",
    "/projects/everyday",
    "/register",
    "/product/men-tee",
    "/cart",
    "/admin",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route + " horizontal overflow",
    ).toBe(true);
  }
  await page.goto("/shop?tab=women");
  await page.screenshot({ path: "screenshots/shop-mobile.png" });
});
