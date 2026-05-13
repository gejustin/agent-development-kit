const { pool } = require('./pool');

async function listOrders() {
  const { rows } = await pool.query('SELECT id, customer_id, shipped_at, status FROM orders LIMIT 100');
  return rows;
}

module.exports = { listOrders };
