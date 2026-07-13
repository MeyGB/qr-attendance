const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, employee_code, department, role, is_active FROM employees'
  );
  res.json(rows);
});

// POST /api/employees (admin only) - create a new employee login
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, email, password, employee_code, department, shift_id } = req.body;

  if (!full_name || !email || !password || !employee_code) {
    return res.status(400).json({ error: 'full_name, email, password, employee_code are required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO employees (full_name, email, password_hash, employee_code, department, shift_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, employee_code, department || null, shift_id || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Employee created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or employee_code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error creating employee' });
  }
});

// GET /api/employees/me (own profile)
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, employee_code, department, role FROM employees WHERE id = ?',
    [req.user.id]
  );
  res.json(rows[0] || null);
});

module.exports = router;
