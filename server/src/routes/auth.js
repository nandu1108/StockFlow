const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { userId: user.id, organizationId: user.organization_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, organizationId: user.organization_id, organizationName: user.organization_name };
}

router.post('/signup', async (req, res) => {
  const { name, email, password, organizationName } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || !organizationName?.trim())
    return res.status(400).json({ message: 'Please fill in every field.' });
  if (password.length < 8)
    return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
  const normalizedEmail = email.trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail))
    return res.status(409).json({ message: 'An account with this email already exists.' });

  const create = db.transaction(() => {
    const org = db.prepare('INSERT INTO organizations (name) VALUES (?)').run(organizationName.trim());
    const hash = bcrypt.hashSync(password, 10);
    const user = db.prepare('INSERT INTO users (organization_id, name, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(org.lastInsertRowid, name.trim(), normalizedEmail, hash);
    return db.prepare(`SELECT users.*, organizations.name AS organization_name
      FROM users JOIN organizations ON organizations.id = users.organization_id WHERE users.id = ?`).get(user.lastInsertRowid);
  });
  try {
    const user = create();
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Could not create account.' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  const user = db.prepare(`SELECT users.*, organizations.name AS organization_name
    FROM users JOIN organizations ON organizations.id = users.organization_id WHERE users.email = ?`)
    .get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: makeToken(user), user: publicUser(user) });
});

module.exports = router;