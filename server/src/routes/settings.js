const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);
router.get('/', (req, res) => {
  const org = db.prepare('SELECT name, default_low_stock_threshold AS defaultLowStockThreshold FROM organizations WHERE id = ?').get(req.user.organizationId);
  res.json(org);
});
router.put('/', (req, res) => {
  const value = Number(req.body?.defaultLowStockThreshold);
  if (!Number.isInteger(value) || value < 0) return res.status(400).json({ message: 'Threshold must be a whole number greater than or equal to zero.' });
  db.prepare('UPDATE organizations SET default_low_stock_threshold = ? WHERE id = ?').run(value, req.user.organizationId);
  res.json({ defaultLowStockThreshold: value });
});
module.exports = router;