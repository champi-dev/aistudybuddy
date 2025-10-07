require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic error handler for missing routes
const createMockRoute = (path) => (req, res) => {
  res.status(501).json({ 
    message: `${path} endpoint not yet implemented`,
    error: 'ENDPOINT_NOT_IMPLEMENTED'
  });
};

// Mock routes for now - replace with actual route files when available
app.use('/api/auth', createMockRoute('auth'));
app.use('/api/decks', createMockRoute('decks'));  
app.use('/api/cards', createMockRoute('cards'));
app.use('/api/study', createMockRoute('study'));
app.use('/api/analytics', createMockRoute('analytics'));
app.use('/api/ai', createMockRoute('ai'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📝 Available endpoints:');
    console.log('   GET  /health - Health check');
    console.log('   POST /api/auth/* - Authentication (mock)');
    console.log('   GET  /api/decks - Decks (mock)');
    console.log('   *    /api/* - Other API endpoints (mock)');
    console.log('\n⚠️  Note: All API endpoints return mock responses until database is connected');
  }
});