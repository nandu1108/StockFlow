const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

function validate(body, partial = false) {
  const b = body || {};
  if (!partial && (!b.name?.trim() || !b.sku?.trim())) return 'Product name and SKU are required.';
  if (b.name !== undefined && !String(b.name).trim()) return 'Product name cannot be empty.';
  if (b.sku !== undefined && !String(b.sku).trim()) return 'SKU cannot be empty.';
  if (b.quantity !== undefined && (!Number.isInteger(Number(b.quantity)) || Number(b.quantity) < 0)) return 'Quantity must be a whole number greater than or equal to zero.';
  for (const key of ['costPrice', 'sellingPrice']) {
    if (b[key] !== undefined && b[key] !== '' && (!Number.isFinite(Number(b[key])) || Number(b[key]) < 0)) return `${key} must be a non-negative number.`;
  }
  if (b.lowStockThreshold !== undefined && b.lowStockThreshold !== '' && (!Number.isInteger(Number(b.lowStockThreshold)) || Number(b.lowStockThreshold) < 0)) return 'Low-stock threshold must be a whole number greater than or equal to zero.';
  return null;
}
function shape(p) {
  return {
    id: p.id, name: p.name, sku: p.sku, description: p.description || '',
    quantity: p.quantity, costPrice: p.cost_price, sellingPrice: p.selling_price,
    lowStockThreshold: p.low_stock_threshold, createdAt: p.created_at, updatedAt: p.updated_at
  };
}
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE organization_id = ? ORDER BY updated_at DESC, id DESC').all(req.user.organizationId);
  const org = db.prepare('SELECT default_low_stock_threshold FROM organizations WHERE id = ?').get(req.user.organizationId);
  res.json(rows.map(p => ({ ...shape(p), effectiveLowStockThreshold: p.low_stock_threshold ?? org.default_low_stock_threshold })));
});
router.post('/', (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ message: error });
  const b = req.body;
  try {
    const result = db.prepare(`INSERT INTO products
      (organization_id,name,sku,description,quantity,cost_price,selling_price,low_stock_threshold)
      VALUES (?,?,?,?,?,?,?,?)`).run(
      req.user.organizationId, b.name.trim(), b.sku.trim(), b.description || '',
      Number(b.quantity || 0), b.costPrice === '' || b.costPrice == null ? null : Number(b.costPrice),
      b.sellingPrice === '' || b.sellingPrice == null ? null : Number(b.sellingPrice),
      b.lowStockThreshold === '' || b.lowStockThreshold == null ? null : Number(b.lowStockThreshold)
    );
    res.status(201).json(shape(db.prepare('SELECT * FROM products WHERE id = ? AND organization_id = ?').get(result.lastInsertRowid, req.user.organizationId)));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ message: 'This SKU is already used in your organization.' });
    res.status(500).json({ message: 'Could not create product.' });
  }
});
router.put('/:id', (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const existing = db.prepare('SELECT * FROM products WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });
  const b = req.body;
  const value = (key, old, convert = x => x) => b[key] === undefined ? old : (b[key] === '' || b[key] === null ? null : convert(b[key]));
  try {
    db.prepare(`UPDATE products SET name=?,sku=?,description=?,quantity=?,cost_price=?,selling_price=?,low_stock_threshold=?,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND organization_id=?`).run(
      value('name', existing.name, x => String(x).trim()), value('sku', existing.sku, x => String(x).trim()),
      value('description', existing.description, String), value('quantity', existing.quantity, Number),
      value('costPrice', existing.cost_price, Number), value('sellingPrice', existing.selling_price, Number),
      value('lowStockThreshold', existing.low_stock_threshold, Number), req.params.id, req.user.organizationId
    );
    res.json(shape(db.prepare('SELECT * FROM products WHERE id = ? AND organization_id = ?').get(req.params.id, req.user.organizationId)));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ message: 'This SKU is already used in your organization.' });
    res.status(500).json({ message: 'Could not update product.' });
  }
});
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ? AND organization_id = ?').run(req.params.id, req.user.organizationId);
  if (!result.changes) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
});
module.exports = router;