const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();
const CollegesRoutes = require('./routes/collegeRoutes');
const UsersRoutes = require('./routes/userRoutes');
const MentorRoutes = require('./routes/mentorRoutes');
const EnrollmentsRoutes  = require('./routes/enrollmentRoutes');
const BlogRoutes = require('./routes/blogRoutes');
const ApplicationsRoutes = require('./routes/applicationRoutes');
const MessageRoutes = require('./routes/messageRoutes');
const AdminRoutes = require('./routes/adminRoutes');
const NoteRoutes = require('./routes/noteRoutes');
const session = require('express-session');
const passport = require('./middleware/passport');
const MongoStore = require('connect-mongo');
const { adminAuth } = require('./middleware/adminAuth');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const requiredEnvVars = [
  'MONGODB_USERS_URI',
  'SESSION_SECRET',
];
const missing = requiredEnvVars.filter((k) => !process.env[k] || process.env[k].trim() === '');
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Please set them in your .env and restart the server.');
}

// Enable CORS with credentials
app.use(cors({
  origin: (origin, callback) => {
    const allowList = [
      'https://admeasy.in',
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowList.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 12 * 60 * 60 * 1000 // 12 hours
  }
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Server uploaded blog images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/colleges', CollegesRoutes);
app.use('/api/users', UsersRoutes);
app.use('/api/mentors', MentorRoutes);
app.use('/api/apply', ApplicationsRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/messages', MessageRoutes);
app.use('/api/enrollments', enrollmentsRoute);
app.use('/api/blog', blogRoute);
app.use('/api/notes', NoteRoutes);

// Serve static files from the dist directory (frontend build)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes that don't start with /api by serving index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));