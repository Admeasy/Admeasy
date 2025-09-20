const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const CollegesRoutes = require('./routes/collegeRoutes');
const UsersRoutes = require('./routes/userRoutes');
const enrollmentsRoute  = require('./routes/enrollmentRoutes')
const blogRoute = require('./routes/blogRoutes')
const ApplicationsRoutes = require('./routes/applicationRoutes');
const MessageRoutes = require('./routes/messageRoutes');
const AdminRoutes = require('./routes/adminRoutes');
const session = require('express-session');
const passport = require('./middleware/passport');
const MongoStore = require('connect-mongo');

const app = express();

// Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_USERS_URI }),
  cookie: {
    secure: false, // set to true if using HTTPS in production
    httpOnly: true,
    maxAge: 12 * 60 * 60 * 1000 // 12 hours
  }
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Redirect based on whether the user is new or existing
    if (req.user && req.user._isNewUser) {
      res.redirect('http://localhost:5173/me');
    } else {
      res.redirect('http://localhost:5173/');
    }
  }
);

// API Routes
app.use('/api/colleges', CollegesRoutes);
app.use('/api/users', UsersRoutes);
app.use('/api/apply', ApplicationsRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/messages', MessageRoutes);
app.use('/api/enrollments', enrollmentsRoute);
app.use('/api/blog',blogRoute)
// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes that don't start with /api by serving index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));