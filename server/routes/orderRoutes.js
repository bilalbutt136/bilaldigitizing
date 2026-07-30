import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const { clientEmail } = req.query;
    const orders = store.getOrders(clientEmail);
    return res.json({ success: true, orders, total: orders.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const order = store.orders.find(o => o.id === req.params.id || o.id === `#${req.params.id}`);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post('/', (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.title && !orderData.serviceCategory) {
      return res.status(400).json({ success: false, message: 'Order title or service category required.' });
    }
    const createdOrder = store.createOrder(orderData);
    return res.status(201).json({ success: true, order: createdOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const { status, assignedDigitizerId, outputFileUrl } = req.body;
    const updatedOrder = store.updateOrderStatus(req.params.id, status, assignedDigitizerId, outputFileUrl);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/revisions
router.post('/:id/revisions', (req, res) => {
  try {
    const { revisionNotes, clientName } = req.body;
    if (!revisionNotes) {
      return res.status(400).json({ success: false, message: 'Revision notes are required.' });
    }
    const updatedOrder = store.addRevision(req.params.id, revisionNotes, clientName);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    return res.json({ success: true, order: updatedOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
