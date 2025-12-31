const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();
const CollegesRoutes = require('./routes/collegeRoutes');
const UsersRoutes = require('./routes/userRoutes');
const MentorRoutes = require('./routes/mentorRoutes');
const EnrollmentsRoutes = require('./routes/enrollmentRoutes');
const BlogRoutes = require('./routes/blogRoutes');
const ApplicationsRoutes = require('./routes/applicationRoutes');
const MessageRoutes = require('./routes/messageRoutes');
const AdminRoutes = require('./routes/adminRoutes');
const NoteRoutes = require('./routes/noteRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');
const ChatRoutes = require('./routes/chatRoutes');
const SitemapRoutes = require('./routes/sitemapRoutes')
const MentorPostRoutes = require('./routes/mentorPostRoutes');
const SearchRoutes = require('./routes/searchRoute')
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://admeasy.in',
  'http://localhost:5173',
].filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Check required environment variables
const requiredEnvVars = ['MONGODB_USERS_URI', 'SESSION_SECRET'];
const missing = requiredEnvVars.filter((k) => !process.env[k] || process.env[k].trim() === '');
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Basic middleware
app.use(express.json());
app.use(cookieParser());

// Session configuration - MUST be before Socket.io setup
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_USERS_URI,
    touchAfter: 24 * 3600, // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
});

app.use(sessionMiddleware);

// Socket.io setup with session integration
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Ensure both transports are available
});

// Share session with Socket.io - CRITICAL FIX
io.engine.use(sessionMiddleware);

// Redis client for presence tracking
let redisClient;
try {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  redisClient.connect().then(() => {
    console.log('Redis connected successfully');
  }).catch(err => {
    console.error('Redis connection failed:', err);
    redisClient = null;
  });
} catch (error) {
  console.error('Redis initialization failed:', error.message);
  redisClient = null;
}

// In-memory presence tracking as fallback
const presenceStore = new Map();

const getPresence = async (userId, role) => {
  if (redisClient && redisClient.isOpen) {
    try {
      const key = `${role}:${userId}`;
      const status = await redisClient.get(key);
      return status === 'online';
    } catch (error) {
      console.error('Redis get error:', error);
    }
  }
  return presenceStore.get(`${role}:${userId}`) === 'online';
};

const setPresence = async (userId, role, isOnline) => {
  if (redisClient && redisClient.isOpen) {
    try {
      const key = `${role}:${userId}`;
      if (isOnline) {
        await redisClient.setEx(key, 300, 'online'); // 5 minutes expiry
      } else {
        await redisClient.del(key);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  presenceStore.set(`${role}:${userId}`, isOnline ? 'online' : 'offline');
};

// Serve uploaded blog images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper function to process user image (extracted from userRoutes)
async function processUserImage(user) {
  if (!user.image) return user;

  // Check if it's a Google URL (contains googleusercontent.com)
  if (user.image.includes('googleusercontent.com')) {
    // Use proxy URL to avoid rate limiting
    user.image = `/api/users/proxy-image?url=${encodeURIComponent(user.image)}`;
    return user;
  } else {
    // It's a Backblaze file, get authorized URL
    try {
      const BackblazeB2Client = require('./b2Client');
      const b2 = new BackblazeB2Client();
      const imageName = user.image;
      user.image = await b2.getDownloadAuthorization(imageName);
    } catch (err) {
      console.error('Error getting Backblaze authorization:', err);
      // If there's an error, return the original image field
    }
    return user;
  }
}

// Common username availability check route (before other routes)
app.get('/api/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, available: false, message: 'Username is required' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    
    // Check both mentors and users
    const Mentor = require('./models/mentorSchema');
    const User = require('./models/userSchema');
    
    const existingMentor = await Mentor.findOne({ 
      username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
    });
    
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') } 
    });

    const isAvailable = !existingMentor && !existingUser;
    
    res.status(200).json({ 
      success: true, 
      available: isAvailable,
      message: isAvailable ? 'Username is available' : 'Username is already taken'
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, available: false, message: 'Internal Server Error' });
  }
});

// Unified profile route - checks if username belongs to mentor or user
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const Mentor = require('./models/mentorSchema');
    const User = require('./models/userSchema');
    
    // Check mentor first
    let mentor = await Mentor.findOne({ username });
    if (mentor) {
      return res.status(200).json({ 
        success: true, 
        type: 'mentor', 
        profile: mentor 
      });
    }
    
    // Check user
    let user = await User.findOne({ username }).select('-password -refreshToken');
    if (user) {
      // Process image if needed
      const processedUser = await processUserImage(user.toObject());
      return res.status(200).json({ 
        success: true, 
        type: 'user', 
        profile: processedUser 
      });
    }
    
    return res.status(404).json({ success: false, message: 'Profile not found' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// API Routes
app.use('/api/colleges', CollegesRoutes);
app.use('/api/users', UsersRoutes);
app.use('/api/mentors', MentorRoutes);
app.use('/api/apply', ApplicationsRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/messages', MessageRoutes);
app.use('/api/enrollments', EnrollmentsRoutes);
app.use('/api/blog', BlogRoutes);
app.use('/api/notes', NoteRoutes);
app.use('/api', ChatRoutes);
app.use('/api/payments', PaymentRoutes);
app.use('/api/posts', MentorPostRoutes);
app.use("/api", SearchRoutes);
// Socket.io connection handling with session authentication
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Access session data - CRITICAL FIX
  const session = socket.request.session;
  
  if (!session) {
    console.error('No session found for socket:', socket.id);
    socket.emit('auth_error', { message: 'No session found' });
    return;
  }

  // Authenticate user or mentor from session
  const userId = session.userId;
  const mentorId = session.mentorId;
  const userRole = session.userRole; // 'user' or 'mentor'

  if (!userId && !mentorId) {
    console.log('Unauthenticated socket connection:', socket.id);
    // Emit auth_required so client knows to wait for session to be set
    socket.emit('auth_required', { message: 'Session not authenticated. Please make an authenticated HTTP request first.' });
    // Don't disconnect - allow re-authentication when session is set
    return;
  }

  // Auto-join based on session authentication and role
  if (userId && userRole === 'user') {
    socket.userId = userId;
    socket.userRole = 'user';
    socket.join(`user:${userId}`);
    
    setPresence(userId, 'user', true).then(() => {
      socket.broadcast.emit('user_online', { userId });
      console.log(`User ${userId} auto-joined and set online`);
      // Emit authenticated event so client knows connection is ready
      socket.emit('authenticated', { role: 'user', id: userId });
    });
  } else if (mentorId && userRole === 'mentor') {
    socket.mentorId = mentorId;
    socket.userRole = 'mentor';
    socket.join(`mentor:${mentorId}`);
    
    setPresence(mentorId, 'mentor', true).then(() => {
      socket.broadcast.emit('mentor_online', { mentorId });
      console.log(`Mentor ${mentorId} auto-joined and set online`);
      // Emit authenticated event so client knows connection is ready
      socket.emit('authenticated', { role: 'mentor', id: mentorId });
    });
  } else {
    // Session has userId/mentorId but missing userRole - emit auth_required
    socket.emit('auth_required', { message: 'Session incomplete. Please refresh.' });
  }

  // Manual join handlers (kept for backward compatibility)
  socket.on('join_user', async (userIdParam) => {
    try {
      // Verify session matches and role is correct
      if (session.userId && session.userId.toString() === userIdParam.toString() && session.userRole === 'user') {
        socket.userId = userIdParam;
        socket.userRole = 'user';
        socket.join(`user:${userIdParam}`);
        await setPresence(userIdParam, 'user', true);
        socket.broadcast.emit('user_online', { userId: userIdParam });
        console.log(`User ${userIdParam} manually joined`);
        // Emit authenticated event so client knows connection is ready
        socket.emit('authenticated', { role: 'user', id: userIdParam });
      } else {
        console.error('Session userId mismatch or wrong role:', session.userId, userIdParam, session.userRole);
        socket.emit('auth_error', { message: 'Authentication mismatch' });
      }
    } catch (error) {
      console.error('Error joining user:', error);
      socket.emit('auth_error', { message: 'Failed to join' });
    }
  });

  socket.on('join_mentor', async (mentorIdParam) => {
    try {
      // Verify session matches and role is correct
      if (session.mentorId && session.mentorId.toString() === mentorIdParam.toString() && session.userRole === 'mentor') {
        socket.mentorId = mentorIdParam;
        socket.userRole = 'mentor';
        socket.join(`mentor:${mentorIdParam}`);
        await setPresence(mentorIdParam, 'mentor', true);
        socket.broadcast.emit('mentor_online', { mentorId: mentorIdParam });
        console.log(`Mentor ${mentorIdParam} manually joined`);
        // Emit authenticated event so client knows connection is ready
        socket.emit('authenticated', { role: 'mentor', id: mentorIdParam });
      } else {
        console.error('Session mentorId mismatch or wrong role:', session.mentorId, mentorIdParam, session.userRole);
        socket.emit('auth_error', { message: 'Authentication mismatch' });
      }
    } catch (error) {
      console.error('Error joining mentor:', error);
      socket.emit('auth_error', { message: 'Failed to join' });
    }
  });

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, senderId, message, senderRole } = data;

      if (!chatId || !senderId || !message || !senderRole) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }

      // Verify sender matches session
      if (senderRole === 'user' && session.userId?.toString() !== senderId.toString()) {
        socket.emit('message_error', { message: 'Unauthorized sender' });
        return;
      }
      if (senderRole === 'mentor' && session.mentorId?.toString() !== senderId.toString()) {
        socket.emit('message_error', { message: 'Unauthorized sender' });
        return;
      }

      // Import models
      const Chat = require('./models/chatSchema');
      const ChatMessage = require('./models/chatMessageSchema');

      // Verify chat exists and user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('message_error', { message: 'Chat not found' });
        return;
      }

      // Verify sender is participant
      const isParticipant = senderRole === 'user'
        ? chat.userId.toString() === senderId
        : chat.mentorId.toString() === senderId;

      if (!isParticipant) {
        socket.emit('message_error', { message: 'Not authorized to send in this chat' });
        return;
      }

      // For mentors, ensure there's an existing conversation
      if (senderRole === 'mentor') {
        const messageCount = await ChatMessage.countDocuments({ chatId });
        if (messageCount === 0) {
          socket.emit('message_error', { message: 'Mentors can only reply to existing conversations' });
          return;
        }
      }

      // Create message
      const newMessage = new ChatMessage({
        chatId,
        senderId,
        senderRole,
        message: message.trim(),
        messageType: 'text',
        status: 'sent'
      });

      await newMessage.save();

      // Update chat metadata
      await Chat.updateOne(
        { _id: chatId },
        {
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          updatedAt: new Date()
        }
      );

      // Update unread counts
      const unreadField = senderRole === 'user' ? 'mentorUnreadCount' : 'userUnreadCount';
      await Chat.updateOne(
        { _id: chatId },
        { $inc: { [unreadField]: 1 } }
      );

      // Fetch sender info
      const { Users } = require('./db');
      const Mentor = require('./models/mentorSchema');
      let sender = null;
      if (senderRole === 'user') {
        const UserModel = Users.model('Users');
        sender = await UserModel.findById(senderId).select('name image').lean();
      } else {
        sender = await Mentor.findById(senderId).select('name image').lean();
      }

      // Format message for broadcasting
      const formattedMessage = {
        _id: newMessage._id,
        chatId,
        senderId: senderId,
        senderRole: newMessage.senderRole,
        senderName: sender?.name || 'Unknown',
        senderImage: sender?.image || null,
        message: newMessage.message,
        status: newMessage.status,
        createdAt: newMessage.createdAt
      };

      // Broadcast to chat room
      io.to(`chat:${chatId}`).emit('receive_message', formattedMessage);

      // Confirm to sender
      socket.emit('message_sent', formattedMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Get online status
  socket.on('get_online_status', async (data) => {
    try {
      const { userId, mentorId } = data;
      let status = {};

      if (userId) {
        status.userOnline = await getPresence(userId, 'user');
      }
      if (mentorId) {
        status.mentorOnline = await getPresence(mentorId, 'mentor');
      }

      socket.emit('online_status', status);
    } catch (error) {
      console.error('Error getting online status:', error);
      socket.emit('online_status_error', { message: 'Failed to get status' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      if (socket.userId && socket.userRole === 'user') {
        await setPresence(socket.userId, 'user', false);
        socket.broadcast.emit('user_offline', { userId: socket.userId });
        console.log(`User ${socket.userId} disconnected`);
      } else if (socket.mentorId && socket.userRole === 'mentor') {
        await setPresence(socket.mentorId, 'mentor', false);
        socket.broadcast.emit('mentor_offline', { mentorId: socket.mentorId });
        console.log(`Mentor ${socket.mentorId} disconnected`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Sitemap Route (before static file serving)
app.use('/', SitemapRoutes);

// Serve static files from the dist directory (frontend build)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes that don't start with /api by serving index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} with Socket.io`));