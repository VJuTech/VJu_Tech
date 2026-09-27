const db = require('../database/connect');

async function saveCart({ sessionId, cart, customer = {}, txRef = null }) {
  const result = await db.query(
    `INSERT INTO checkout_carts
      (session_id, package_key, package_name, package_price, add_ons, total, customer_name, customer_email, company, transaction_ref, payment_status)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, 'pending')
     ON CONFLICT (session_id) DO UPDATE SET
       package_key = EXCLUDED.package_key,
       package_name = EXCLUDED.package_name,
       package_price = EXCLUDED.package_price,
       add_ons = EXCLUDED.add_ons,
       total = EXCLUDED.total,
       customer_name = COALESCE(EXCLUDED.customer_name, checkout_carts.customer_name),
       customer_email = COALESCE(EXCLUDED.customer_email, checkout_carts.customer_email),
       company = COALESCE(EXCLUDED.company, checkout_carts.company),
       transaction_ref = COALESCE(EXCLUDED.transaction_ref, checkout_carts.transaction_ref),
       payment_status = CASE WHEN EXCLUDED.transaction_ref IS NOT NULL THEN 'pending' ELSE checkout_carts.payment_status END,
       updated_at = NOW()
     RETURNING *`,
    [sessionId, cart.packageKey, cart.package.name, cart.package.price, JSON.stringify(cart.addOns), cart.total, customer.name || null, customer.email || null, customer.company || null, txRef]
  );
  return result.rows[0];
}

async function findCart(sessionId) {
  const result = await db.query('SELECT * FROM checkout_carts WHERE session_id = $1', [sessionId]);
  return result.rows[0] || null;
}

async function markPaid({ sessionId, transactionId }) {
  const result = await db.query(
    `UPDATE checkout_carts
     SET payment_status = 'paid', flutterwave_transaction_id = $2, paid_at = NOW(), updated_at = NOW()
     WHERE session_id = $1 AND payment_status <> 'paid'
     RETURNING *`,
    [sessionId, String(transactionId)]
  );
  return result.rows[0] || null;
}

async function markFailed(sessionId) {
  await db.query("UPDATE checkout_carts SET payment_status = 'failed', updated_at = NOW() WHERE session_id = $1 AND payment_status = 'pending'", [sessionId]);
}

function toCart(row) {
  if (!row) return null;
  const addOns = Array.isArray(row.add_ons) ? row.add_ons : [];
  return {
    id: row.id,
    packageKey: row.package_key,
    package: { name: row.package_name, price: Number(row.package_price) },
    addOns,
    total: Number(row.total),
    customer: { name: row.customer_name, email: row.customer_email, company: row.company },
    txRef: row.transaction_ref,
    paymentStatus: row.payment_status,
    transactionId: row.flutterwave_transaction_id
  };
}

module.exports = { saveCart, findCart, markPaid, markFailed, toCart };
