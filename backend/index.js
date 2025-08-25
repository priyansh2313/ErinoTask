const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const app = express();
// Behind Render proxy, required for secure cookies
app.set('trust proxy', 1);

// Allowlist can be provided via ALLOWED_ORIGINS (comma-separated) or single FRONTEND_URL
const rawAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const FRONTEND_URL = process.env.FRONTEND_URL; // optional single origin

// Normalize helper to strip any trailing slash
const normalizeOrigin = (s) => (typeof s === 'string' ? s.replace(/\/$/, '') : s);

// Build allowlist and normalize
const envOrigins = [...rawAllowed, FRONTEND_URL]
  .filter(Boolean)
  .map(normalizeOrigin);

// In production, only allow the configured origins. In dev, also allow localhost for convenience.
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? envOrigins
  : [...envOrigins, 'http://localhost:3000'];

const corsOptions = {
  origin(origin, callback) {
    // allow same-origin or non-browser requests (no origin), and explicit allowlist
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
