const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendance/current-qr
// Public-ish endpoint meant to be displayed on the office entrance screen/tablet.
// (In production, protect this behind a device key if the tablet is not trusted.)
router.get('/current-qr', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT token, valid_until FROM qr_tokens
       WHERE is_active = TRUE AND valid_until > NOW()
       ORDER BY id DESC LIMIT 1`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No active QR token. Is the rotation service running?' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching QR token' });
  }
});

// POST /api/attendance/check-in
router.post('/check-in', requireAuth, async (req, res) => {
  const { token } = req.body;
  const employeeId = req.user.id;

  if (!token) return res.status(400).json({ error: 'QR token is required' });

  try {
    const [tokenRows] = await pool.query(
      `SELECT * FROM qr_tokens WHERE token = ? AND is_active = TRUE AND valid_until > NOW()`,
      [token]
    );
    if (tokenRows.length === 0) {
      return res.status(400).json({ error: 'QR code expired or invalid. Please scan the current code.' });
    }
    const qrToken = tokenRows[0];

    const today = new Date().toISOString().slice(0, 10);

    const [existing] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (existing.length > 0 && existing[0].check_in_time) {
      return res.status(409).json({ error: 'You have already checked in today.' });
    }

    // Determine on-time vs late using the employee's shift
    const [[employee]] = await pool.query(
      `SELECT e.*, s.start_time, s.grace_minutes FROM employees e
       LEFT JOIN shifts s ON e.shift_id = s.id WHERE e.id = ?`,
      [employeeId]
    );

    let status = 'present';
    if (employee?.start_time) {
      const now = new Date();
      const [h, m] = employee.start_time.split(':').map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(h, m + (employee.grace_minutes || 0), 0, 0);
      if (now > shiftStart) status = 'late';
    }

    if (existing.length > 0) {
      await pool.query(
        'UPDATE attendance SET check_in_time = NOW(), check_in_token_id = ?, status = ? WHERE id = ?',
        [qrToken.id, status, existing[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO attendance (employee_id, date, check_in_time, check_in_token_id, status)
         VALUES (?, ?, NOW(), ?, ?)`,
        [employeeId, today, qrToken.id, status]
      );
    }

    res.json({ message: 'Checked in successfully', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// POST /api/attendance/check-out
router.post('/check-out', requireAuth, async (req, res) => {
  const { token } = req.body;
  const employeeId = req.user.id;

  if (!token) return res.status(400).json({ error: 'QR token is required' });

  try {
    const [tokenRows] = await pool.query(
      `SELECT * FROM qr_tokens WHERE token = ? AND is_active = TRUE AND valid_until > NOW()`,
      [token]
    );
    if (tokenRows.length === 0) {
      return res.status(400).json({ error: 'QR code expired or invalid. Please scan the current code.' });
    }
    const qrToken = tokenRows[0];

    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );

    if (existing.length === 0 || !existing[0].check_in_time) {
      return res.status(400).json({ error: 'You must check in before checking out.' });
    }
    if (existing[0].check_out_time) {
      return res.status(409).json({ error: 'You have already checked out today.' });
    }

    await pool.query(
      'UPDATE attendance SET check_out_time = NOW(), check_out_token_id = ? WHERE id = ?',
      [qrToken.id, existing[0].id]
    );

    res.json({ message: 'Checked out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during check-out' });
  }
});

// GET /api/attendance/history (own history)
router.get('/history', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 60',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});

// GET /api/attendance/all (admin only — for reports)
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, e.full_name, e.employee_code FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       ORDER BY a.date DESC, e.full_name ASC LIMIT 500`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching records' });
  }
});

module.exports = router;
