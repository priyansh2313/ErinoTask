const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(cors({ origin: FRONTEND_URL || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// Simple logger
app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`); next(); });

// DB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lead_mgmt';
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB error', err));

// Routes
app.get('/api', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
