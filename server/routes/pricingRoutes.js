import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/pricing/config
router.get('/config', (req, res) => {
  try {
    return res.json({ success: true, pricing: store.pricing });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/pricing/config
router.put('/config', (req, res) => {
  try {
    store.pricing = { ...store.pricing, ...req.body };
    return res.json({ success: true, pricing: store.pricing });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pricing/calculate
router.post('/calculate', (req, res) => {
  try {
    const { type, estimatedStitches, isRush, serviceCategory, quantity, complexity, patchSize } = req.body;
    const price = store.calculatePrice({
      type,
      estimatedStitches,
      isRush,
      serviceCategory,
      quantity,
      complexity,
      patchSize
    });

    return res.json({
      success: true,
      price,
      currency: '$',
      breakdown: {
        baseFee: store.pricing.minOrderFee,
        ratePerK: store.pricing.ratePerThousandStitches,
        rushSurcharge: isRush ? store.pricing.rushSurcharge : 0,
        estimatedStitches: estimatedStitches || 0
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
