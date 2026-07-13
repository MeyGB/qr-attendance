const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const employeeRoutes = require('./routes/employees.routes');
const { startQrRotation } = require('./services/qrRotation');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employees', employeeRoutes);

app.get('/', (req, res) => res.json({ status: 'QR Attendance API is running' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startQrRotation();
});
