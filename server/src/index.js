import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import passesRoutes from './routes/passes.js';
import bookingsRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 8793;

// Middleware
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Wake & Roll Park API',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/passes', passesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Wystąpił błąd wewnętrzny serwera.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Wake & Roll Park API] Uruchomiono na porcie ${PORT}`);
  console.log(`[Wake & Roll Park API] http://localhost:${PORT}/api/health`);
});
