import { Link } from "react-router-dom";
export function Info({ privacy = false, missing = false }) {
  if (missing)
    return (
      <div className="page-shell empty-state">
        <p className="eyebrow">404 / A LITTLE OFF THE PATH</p>
        <h1 className="page-title">Lost your way?</h1>
        <Link className="solid-button" to="/shop">
          Back to the collection
        </Link>
      </div>
    );
  return (
    <div className="page-shell max-w-3xl">
      <p className="eyebrow">THE DETAILS</p>
      <h1 className="page-title">
        {privacy ? "Your privacy." : "Good to know."}
      </h1>
      <div className="info-copy">
        {privacy ? (
          <>
            <h2>What this store saves</h2>
            <p>
              Your account stores your name, email, and a password hash. Orders
              contain the delivery details you provide and the products you
              purchase. Signed-in customers can access their own orders;
              authorized staff can access orders for fulfillment.
            </p>
            <h2>Cookies and saved pieces</h2>
            <p>
              An essential cookie keeps your session active. Your bag and saved
              product IDs stay in your browser’s local storage. Payment card
              details are never collected. Product photography is served
              directly by this store; browsing does not send image requests to a
              third party.
            </p>
            <h2>Account data</h2>
            <p>
              Sign out to end your session. This is a development storefront;
              the operator’s contact details, retention schedule, and data
              request process must be supplied before public launch.
            </p>
          </>
        ) : (
          <>
            <h2>Shipping</h2>
            <p>
              Shipping is free for orders of $200 or more after discount. Orders
              below that amount have an $18 delivery fee. The checkout shows
              your total before you place an order.
            </p>
            <h2>Payment</h2>
            <p>
              Pay on delivery is available. No online payment is taken when you
              place your order. Track processing, shipping, and delivery from
              your account.
            </p>
            <h2>Sizing and care</h2>
            <p>
              Available sizes and colors are shown on each product page. Always
              check the garment’s care label. Product photography and
              descriptions are sample catalog content.
            </p>
            <h2>Returns and delivery timing</h2>
            <p>
              This store is being prepared for launch. The operator still needs
              to publish delivery coverage, delivery times, a returns policy,
              and support contact details before accepting public orders.
            </p>
          </>
        )}
      </div>
      <Link className="solid-button mt-8" to="/shop">
        Back to shopping
      </Link>
    </div>
  );
}
