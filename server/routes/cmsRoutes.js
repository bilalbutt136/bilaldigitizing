import express from 'express';
import { store } from '../dataStore.js';

const router = express.Router();

// GET /api/cms
router.get('/', (req, res) => {
  try {
    return res.json({
      success: true,
      siteSettings: store.siteSettings,
      portfolio: store.portfolio,
      storeItems: store.storeItems,
      digitizers: store.digitizers
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cms
router.put('/', (req, res) => {
  try {
    const { siteSettings, portfolio, storeItems, digitizers } = req.body;
    if (siteSettings) store.siteSettings = { ...store.siteSettings, ...siteSettings };
    if (portfolio) store.portfolio = portfolio;
    if (storeItems) store.storeItems = storeItems;
    if (digitizers) store.digitizers = digitizers;

    return res.json({
      success: true,
      siteSettings: store.siteSettings,
      portfolio: store.portfolio,
      storeItems: store.storeItems,
      digitizers: store.digitizers
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
