const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM employees WHERE email = ? AND is_active = TRUE',
      [email]
    );

    const employee = rows[0];
    if (!employee) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, employee.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: employee.id, role: employee.role, employee_code: employee.employee_code },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

    res.json({
      token,
      employee: {
        id: employee.id,
        full_name: employee.full_name,
        email: employee.email,
        employee_code: employee.employee_code,
        role: employee.role,
        department: employee.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
