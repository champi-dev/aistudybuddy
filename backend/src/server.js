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
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : ['http://localhost:5173', 'http://localhost:5174'],
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

// Import route handlers
const authRoutes = require('./routes/auth');
const deckRoutes = require('./routes/decks');
const cardRoutes = require('./routes/cards');
const studyRoutes = require('./routes/study');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

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
    console.log('   POST /api/auth/* - Authentication');
    console.log('   GET  /api/decks - Deck management');
    console.log('   GET  /api/cards - Card management');
    console.log('   POST /api/study/* - Study sessions');
    console.log('   GET  /api/analytics/* - Analytics');
    console.log('   POST /api/ai/* - AI generation');
    console.log('\n✅ Database connected and migrations completed');
  }
});