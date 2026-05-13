const express = require('express');
const app = express();
app.get('/widgets', (req, res) => res.json([]));
app.listen(3000);
