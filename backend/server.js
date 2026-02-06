const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load .env file
const result = dotenv.config({ path: '.env' });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error);
  console.log('💡 Make sure .env file exists in backend folder');
  console.log('🔑 Using fallback JWT_SECRET');
  process.env.JWT_SECRET = 'vijju123_fallback';
  process.env.PORT = 5000;
  process.env.MONGODB_URI = 'mongodb://localhost:27017/athlete_training';
} else {
  console.log('✅ .env file loaded successfully');
  console.log('📝 JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('📝 PORT:', process.env.PORT);
}

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000'], // React dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Database connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 Running without database. Using mock data.');
  });
} else {
  console.log('⚠️  MONGODB_URI not found in .env');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/users', require('./routes/users')); //


// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Athlete Training API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      workouts: '/api/workouts',
      ai: '/api/ai',
      pdf: '/api/pdf'
    }
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected',
    timestamp: new Date().toISOString(),
    envLoaded: !!process.env.JWT_SECRET
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'NOT SET!'}`);
  console.log(`🔗 CORS enabled for: http://localhost:3000`);
});