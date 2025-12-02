const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
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
const ChatRoutes = require('./routes/chatRoutes');
const session = require('express-session');
const passport = require('./middleware/passport');
const MongoStore = require('connect-mongo');
const { adminAuth } = require('./middleware/adminAuth');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const allowList = [
        'https://admeasy.in',
        'http://localhost:5173',
      ].filter(Boolean);
      if (!origin || allowList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

// Redis client for presence tracking
let redisClient;
try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect();
} catch (error) {
  console.error('Redis connection failed, using in-memory storage:', error.message);
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
app.use('/api/enrollments', EnrollmentsRoutes);
app.use('/api/blog', BlogRoutes);
app.use('/api/notes', NoteRoutes);
app.use('/api', ChatRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user room for presence tracking
  socket.on('join_user', async (userId) => {
    try {
      socket.userId = userId;
      socket.userRole = 'user';

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Set online status
      await setPresence(userId, 'user', true);

      // Broadcast online status
      socket.broadcast.emit('user_online', { userId });

      console.log(`User ${userId} joined`);
    } catch (error) {
      console.error('Error joining user:', error);
    }
  });

  // Join mentor room for presence tracking
  socket.on('join_mentor', async (mentorId) => {
    try {
      socket.mentorId = mentorId;
      socket.userRole = 'mentor';

      // Join mentor-specific room
      socket.join(`mentor:${mentorId}`);

      // Set online status
      await setPresence(mentorId, 'mentor', true);

      // Broadcast online status
      socket.broadcast.emit('mentor_online', { mentorId });

      console.log(`Mentor ${mentorId} joined`);
    } catch (error) {
      console.error('Error joining mentor:', error);
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

      // Import models here to avoid circular dependencies
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

      // Populate sender info
      await newMessage.populate('senderId', 'name image');

      // Format message for broadcasting
      const formattedMessage = {
        _id: newMessage._id,
        chatId,
        senderId: newMessage.senderId._id,
        senderRole: newMessage.senderRole,
        senderName: newMessage.senderId.name,
        senderImage: newMessage.senderId.image,
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