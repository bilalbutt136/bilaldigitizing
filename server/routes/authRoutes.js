import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = store.login(email, password, role);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { email, name, company } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const result = store.signup(email, name, company);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/google
router.post('/google', (req, res) => {
  try {
    const { email, name } = req.body;
    const cleanEmail = email || 'google.user@gmail.com';
    const result = store.login(cleanEmail, 'oauth', 'client');
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No auth token provided' });
  }
  return res.json({
    success: true,
    user: {
      id: 'u-current',
      email: 'client@bdigitizing.pro',
      role: 'client'
    }
  });
});

export default router;
