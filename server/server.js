import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', studio: 'B Digitizing Express API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cms', cmsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 B Digitizing Backend Express Server running on port ${PORT}`);
});
