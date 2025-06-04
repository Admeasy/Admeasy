const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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

// Routes
app.use('/api/colleges', CollegesRoutes);
app.use('/api/admin', AdminRoutes);

// Example route
app.get("/", (req, res) => res.send("Back-end is under development..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));