const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const CollegesRoutes = require('./routes/collegeRoutes');
const AdminRoutes = require('./routes/adminRoutes');

const app = express();

// Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/colleges', CollegesRoutes);
app.use('/api/admin', AdminRoutes);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes that don't start with /api by serving index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));