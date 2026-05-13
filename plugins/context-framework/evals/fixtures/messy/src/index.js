const express = require('express');
const { listOrders } = require('./db/orders');

const app = express();
app.get('/orders', async (req, res) => {
  const rows = await listOrders();
  res.json(rows);
});
app.listen(3000);
