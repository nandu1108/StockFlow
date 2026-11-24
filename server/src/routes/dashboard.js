const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);
router.get('/', (req, res) => {
  const orgId = req.user.organizationId;
  const summary = db.prepare(`SELECT COUNT(*) AS totalProducts, COALESCE(SUM(quantity),0) AS totalQuantity
    FROM products WHERE organization_id = ?`).get(orgId);
  const org = db.prepare('SELECT default_low_stock_threshold FROM organizations WHERE id = ?').get(orgId);
  const lowStock = db.prepare(`SELECT id,name,sku,quantity,COALESCE(low_stock_threshold, ?) AS threshold
    FROM products WHERE organization_id = ? AND quantity <= COALESCE(low_stock_threshold, ?)
    ORDER BY quantity ASC, name ASC`).all(org.default_low_stock_threshold, orgId, org.default_low_stock_threshold);
  res.json({ ...summary, lowStock });
});
module.exports = router;