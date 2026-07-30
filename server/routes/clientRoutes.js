import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/clients
router.get('/', (req, res) => {
  try {
    return res.json({ success: true, clients: store.clients });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/clients/deposit
router.post('/deposit', (req, res) => {
  try {
    const { email, amount } = req.body;
    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount are required.' });
    }
    const updatedClient = store.depositWallet(email, amount);
    if (!updatedClient) {
      return res.status(400).json({ success: false, message: 'Invalid deposit details.' });
    }
    return res.json({ success: true, client: updatedClient, newBalance: updatedClient.walletBalance });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/clients/deduct
router.post('/deduct', (req, res) => {
  try {
    const { email, amount } = req.body;
    const updatedClient = store.deductWallet(email, amount);
    if (!updatedClient) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }
    return res.json({ success: true, client: updatedClient, newBalance: updatedClient.walletBalance });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
