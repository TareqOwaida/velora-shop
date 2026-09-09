export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function cartTotals(lines, promo) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = promo === "VELORA10" ? Math.round(subtotal * 0.1) : 0;
  const afterDiscount = subtotal - discount;
  const shipping = afterDiscount >= 200 || afterDiscount === 0 ? 0 : 18;
  const tax = 0; // Configure the applicable tax policy before public launch.
  const total = afterDiscount + shipping + tax;
  return { subtotal, discount, shipping, tax, total };
}
