const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
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
const SpaceRoutes = require('./routes/spaceRoutes');
const PaymentRoutes = require('./routes/paymentRoutes');
const ChatRoutes = require('./routes/chatRoutes');
const SitemapRoutes = require('./routes/sitemapRoutes')
const PostRoutes = require('./routes/postRoutes');
const SearchRoutes = require('./routes/searchRoute')
const SubscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');
const NotificationRoutes = require('./routes/notificationRoutes');
const Db = require('./db');
const SubscriptionRoutes = require('./routes/subscriptionRoutes');
const AdvertiserRoutes = require('./routes/advertiserRoutes');
const AdRoutes = require('./routes/adRoutes');
const InteractionRoutes = require('./routes/interactionRoutes');
const User = require('./models/userSchema');
const Mentor = require('./models/mentorSchema');
const { ensureMasterTagsSeeded } = require('./services/interactionTrackingService');
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'https://admeasy.in',
  'https://development.admeasy.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Check required environment variables
const requiredEnvVars = ['MONGODB_USERS_URI', 'JWT_ACCESS_SECRET'];
const missing = requiredEnvVars.filter((k) => !process.env[k] || process.env[k].trim() === '');
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// Database connections are automatically established when db.js is required
// The connections are created using mongoose.createConnection() which connects automatically
ensureMasterTagsSeeded().catch((err) => {
  console.error('Master tag seed failed:', err.message);
});

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://admeasy.in",
    "https://www.admeasy.in"
  ],
  credentials: true
}));

// Basic middleware
app.use(express.json());
app.use(cookieParser());

// Session configuration - MUST be before Socket.io setup
// Session configuration removed - using JWT only


// Socket.io setup with session integration
// Make io available to controllers
global.io = null;

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
// Socket.io JWT auth is handled below


// Set global.io so controllers can emit events
global.io = io;

// In-memory presence tracking using Map
// Structure: Map<"role:id", { status: 'online'|'offline', lastSeen: timestamp }>
const presenceStore = new Map();
const PRESENCE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up stale presence entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of presenceStore.entries()) {
    if (value.status === 'online' && (now - value.lastSeen) > PRESENCE_TIMEOUT) {
      presenceStore.set(key, { status: 'offline', lastSeen: now });
      // Extract role and id from key (format: "role:id")
      const [role, id] = key.split(':');
      // Broadcast offline status
      if (role === 'user') {
        io.emit('user_offline', { userId: id });
      } else if (role === 'mentor') {
        io.emit('mentor_offline', { mentorId: id });
      }
    }
  }
}, 60000); // Check every minute

const getPresence = (userId, role) => {
  const key = `${role}:${userId}`;
  const presence = presenceStore.get(key);
  if (!presence) {
    return false;
  }

  // If online, check if still within timeout window
  if (presence.status === 'online') {
    const now = Date.now();
    if ((now - presence.lastSeen) > PRESENCE_TIMEOUT) {
      // Update to offline if timeout exceeded
      presenceStore.set(key, { status: 'offline', lastSeen: now });
      return false;
    }
    return true;
  }

  return false;
};

const setPresence = (userId, role, isOnline) => {
  const key = `${role}:${userId}`;
  const now = Date.now();

  if (isOnline) {
    presenceStore.set(key, { status: 'online', lastSeen: now });
  } else {
    presenceStore.set(key, { status: 'offline', lastSeen: now });
  }
};

// Extract JWT from socket handshake (cookies > auth header > query/auth payload)
const getSocketToken = (socket) => {
  const cookies = cookie.parse(socket.handshake.headers?.cookie || '');
  const authHeader = socket.handshake.headers?.authorization || '';
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return cookies.accessToken || socket.handshake.query?.token;
};

// Socket.io JWT authentication middleware
io.use(async (socket, next) => {
  try {
    const token = getSocketToken(socket);
    if (!token) {
      return next(new Error('AUTH_REQUIRED'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const id = decoded.id || decoded._id;
    const role = decoded.role === 'mentor' ? 'mentor' : 'user';

    if (!id) {
      return next(new Error('INVALID_TOKEN'));
    }

    if (role === 'mentor') {
      const mentor = await Mentor.findById(id).select('_id');
      if (!mentor) return next(new Error('INVALID_MENTOR'));
      socket.authContext = { role: 'mentor', id: mentor._id.toString() };
    } else {
      const user = await User.findById(id).select('_id');
      if (!user) return next(new Error('INVALID_USER'));
      socket.authContext = { role: 'user', id: user._id.toString() };
    }

    return next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    return next(new Error('AUTH_ERROR'));
  }
});

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

// Helper function to escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Common username availability check route (before other routes)
app.get('/api/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, available: false, message: 'Username is required' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const escapedUsername = escapeRegex(normalizedUsername);

    // Check both mentors and users
    const Mentor = require('./models/mentorSchema');
    const User = require('./models/userSchema');

    const existingMentor = await Mentor.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
    });

    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${escapedUsername}$`, 'i') }
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

// Unified profile route - checks if username belongs to mentor, user, or advertiser
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const Mentor = require('./models/mentorSchema');
    const User = require('./models/userSchema');
    const Advertiser = require('./models/advertiserSchema');

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

    // Check advertiser
    let advertiser = await Advertiser.findOne({ username }).select('-password -refreshToken');
    if (advertiser) {
      const adsCount = await require('./models/adSchema').countDocuments({
        advertiserId: advertiser._id,
        status: 'live'
      });
      return res.status(200).json({
        success: true,
        type: 'advertiser',
        profile: { ...advertiser.toObject(), adsCount }
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
app.use('/api/spaces', SpaceRoutes);
app.use('/api', ChatRoutes);
app.use('/api/payments', PaymentRoutes);
app.use('/api/posts', PostRoutes);
app.use("/api", SearchRoutes);
app.use('/api/subscription-plans', SubscriptionPlanRoutes);
app.use('/api/subscriptions', SubscriptionRoutes);
app.use('/api/notifications', NotificationRoutes);
app.use('/api/advertisers', AdvertiserRoutes);
app.use('/api/ads', AdRoutes);
app.use('/api/interactions', InteractionRoutes);

// Socket.io connection handling with JWT authentication
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  const emitAuthenticated = () => {
    const id = socket.userRole === 'mentor' ? socket.mentorId : socket.userId;
    if (id) {
      socket.emit('authenticated', { role: socket.userRole, id });
    }
  };

  const { role, id } = socket.authContext || {};
  if (!role || !id) {
    console.error('Socket missing auth context, disconnecting:', socket.id);
    socket.emit('auth_error', { message: 'Authentication required' });
    socket.disconnect(true);
    return;
  }

  if (role === 'user') {
    socket.userId = String(id);
    socket.userRole = 'user';
    socket.join(`user:${socket.userId}`);

    setPresence(socket.userId, 'user', true);
    // Broadcast to all other clients
    socket.broadcast.emit('user_online', { userId: socket.userId });
    // Also emit to self so the client knows they're online
    socket.emit('user_online', { userId: socket.userId });
    console.log(`User ${socket.userId} connected and set online`);
    emitAuthenticated();
  } else {
    socket.mentorId = String(id);
    socket.userRole = 'mentor';
    socket.join(`mentor:${socket.mentorId}`);

    setPresence(socket.mentorId, 'mentor', true);
    // Broadcast to all other clients
    socket.broadcast.emit('mentor_online', { mentorId: socket.mentorId });
    // Also emit to self so the client knows they're online
    socket.emit('mentor_online', { mentorId: socket.mentorId });

    // Send current online users to the newly connected mentor
    // This helps mentors see which users are already online
    setTimeout(() => {
      for (const [key, value] of presenceStore.entries()) {
        if (key.startsWith('user:') && value.status === 'online') {
          const userId = key.split(':')[1];
          socket.emit('user_online', { userId });
        }
      }
    }, 500); // Small delay to ensure presence is set

    console.log(`Mentor ${socket.mentorId} connected and set online`);
    emitAuthenticated();
  }

  // Manual join handlers retained for backward compatibility
  socket.on('join_user', async () => {
    if (socket.userRole !== 'user' || !socket.userId) {
      socket.emit('auth_error', { message: 'Not authorized as user' });
      return;
    }
    socket.join(`user:${socket.userId}`);
    emitAuthenticated();
  });

  socket.on('join_mentor', async () => {
    if (socket.userRole !== 'mentor' || !socket.mentorId) {
      socket.emit('auth_error', { message: 'Not authorized as mentor' });
      return;
    }
    socket.join(`mentor:${socket.mentorId}`);
    emitAuthenticated();
  });

  // Join chat room (with participant verification)
  socket.on('join_chat', async (chatId) => {
    try {
      if (!chatId) {
        socket.emit('auth_error', { message: 'Chat ID required' });
        return;
      }

      const UserToMentorChat = require('./models/userToMentorChatSchema');
      const chat = await UserToMentorChat.findById(chatId).select('userId mentorId isActive');

      if (!chat || chat.isActive === false) {
        socket.emit('auth_error', { message: 'Chat not found or inactive' });
        return;
      }

      const isParticipant = socket.userRole === 'user'
        ? chat.userId.toString() === socket.userId
        : chat.mentorId.toString() === socket.mentorId;

      if (!isParticipant) {
        socket.emit('auth_error', { message: 'Not a participant in this chat' });
        return;
      }

      socket.join(`user_to_mentor_chat:${chatId}`);
      console.log(`Socket ${socket.id} joined user-to-mentor chat ${chatId}`);
    } catch (error) {
      console.error('Error joining chat:', error);
      socket.emit('auth_error', { message: 'Failed to join chat' });
    }
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`user_to_mentor_chat:${chatId}`);
    socket.leave(`user_to_user_chat:${chatId}`);
    socket.leave(`mentor_to_mentor_chat:${chatId}`);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  // Send message in user-to-mentor chat
  socket.on('send_message', async (data = {}) => {
    try {
      const { chatId, message } = data;
      const senderRole = socket.userRole;
      const senderId = senderRole === 'user' ? socket.userId : socket.mentorId;

      if (!chatId || !message) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }

      if (!senderId || !senderRole) {
        socket.emit('message_error', { message: 'Unauthorized sender' });
        return;
      }

      // Import models
      const UserToMentorChat = require('./models/userToMentorChatSchema');
      const UserToMentorMessage = require('./models/userToMentorMessageSchema');

      // Verify chat exists and user is participant
      const chat = await UserToMentorChat.findById(chatId);
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
        const messageCount = await UserToMentorMessage.countDocuments({ chatId });
        if (messageCount === 0) {
          socket.emit('message_error', { message: 'Mentors can only reply to existing conversations' });
          return;
        }
      }

      // Create message
      const newMessage = new UserToMentorMessage({
        chatId,
        senderId,
        senderRole,
        message: message.trim(),
        messageType: 'text',
        status: 'sent'
      });

      await newMessage.save();

      // Update chat metadata
      await UserToMentorChat.updateOne(
        { _id: chatId },
        {
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          updatedAt: new Date()
        }
      );

      // Update unread counts
      const unreadField = senderRole === 'user' ? 'mentorUnreadCount' : 'userUnreadCount';
      await UserToMentorChat.updateOne(
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

      // Update presence (keep user/mentor active when they send messages)
      if (senderRole === 'user' && socket.userId) {
        setPresence(socket.userId, 'user', true);
      } else if (senderRole === 'mentor' && socket.mentorId) {
        setPresence(socket.mentorId, 'mentor', true);
      }

      // Broadcast to chat room
      io.to(`user_to_mentor_chat:${chatId}`).emit('receive_message', formattedMessage);

      // Confirm to sender
      socket.emit('message_sent', formattedMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Join user-to-user chat room
  socket.on('join_user_to_user_chat', async (chatId) => {
    try {
      if (!chatId) {
        socket.emit('auth_error', { message: 'Chat ID required' });
        return;
      }

      if (socket.userRole !== 'user' || !socket.userId) {
        socket.emit('auth_error', { message: 'Only users can join user-to-user chats' });
        return;
      }

      const UserToUserChat = require('./models/userToUserChatSchema');
      const chat = await UserToUserChat.findById(chatId).select('user1Id user2Id isActive');

      if (!chat || chat.isActive === false) {
        socket.emit('auth_error', { message: 'Chat not found or inactive' });
        return;
      }

      const isParticipant = chat.user1Id.toString() === socket.userId ||
        chat.user2Id.toString() === socket.userId;

      if (!isParticipant) {
        socket.emit('auth_error', { message: 'Not a participant in this chat' });
        return;
      }

      socket.join(`user_to_user_chat:${chatId}`);
      console.log(`Socket ${socket.id} joined user-to-user chat ${chatId}`);
    } catch (error) {
      console.error('Error joining user-to-user chat:', error);
      socket.emit('auth_error', { message: 'Failed to join chat' });
    }
  });

  // Join mentor-to-mentor chat room
  socket.on('join_mentor_to_mentor_chat', async (chatId) => {
    try {
      if (!chatId) {
        socket.emit('auth_error', { message: 'Chat ID required' });
        return;
      }

      if (socket.userRole !== 'mentor' || !socket.mentorId) {
        socket.emit('auth_error', { message: 'Only mentors can join mentor-to-mentor chats' });
        return;
      }

      const MentorToMentorChat = require('./models/mentorToMentorChatSchema');
      const chat = await MentorToMentorChat.findById(chatId).select('mentor1Id mentor2Id isActive');

      if (!chat || chat.isActive === false) {
        socket.emit('auth_error', { message: 'Chat not found or inactive' });
        return;
      }

      const isParticipant = chat.mentor1Id.toString() === socket.mentorId ||
        chat.mentor2Id.toString() === socket.mentorId;

      if (!isParticipant) {
        socket.emit('auth_error', { message: 'Not a participant in this chat' });
        return;
      }

      socket.join(`mentor_to_mentor_chat:${chatId}`);
      console.log(`Socket ${socket.id} joined mentor-to-mentor chat ${chatId}`);
    } catch (error) {
      console.error('Error joining mentor-to-mentor chat:', error);
      socket.emit('auth_error', { message: 'Failed to join chat' });
    }
  });

  // Send message in user-to-user chat
  socket.on('send_user_to_user_message', async (data = {}) => {
    try {
      const { chatId, message } = data;
      const senderId = socket.userId;

      if (!chatId || !message) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }

      if (socket.userRole !== 'user' || !senderId) {
        socket.emit('message_error', { message: 'Unauthorized sender' });
        return;
      }

      const UserToUserChat = require('./models/userToUserChatSchema');
      const UserToUserMessage = require('./models/userToUserMessageSchema');
      const { Users } = require('./db');

      const chat = await UserToUserChat.findById(chatId);
      if (!chat) {
        socket.emit('message_error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.user1Id.toString() === senderId ||
        chat.user2Id.toString() === senderId;

      if (!isParticipant) {
        socket.emit('message_error', { message: 'Not authorized to send in this chat' });
        return;
      }

      const newMessage = new UserToUserMessage({
        chatId,
        senderId,
        message: message.trim(),
        messageType: 'text',
        status: 'sent'
      });

      await newMessage.save();

      await UserToUserChat.updateOne(
        { _id: chatId },
        {
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          updatedAt: new Date()
        }
      );

      const unreadField = chat.user1Id.toString() === senderId
        ? 'user2UnreadCount'
        : 'user1UnreadCount';
      await UserToUserChat.updateOne(
        { _id: chatId },
        { $inc: { [unreadField]: 1 } }
      );

      const UserModel = Users.model('Users');
      const sender = await UserModel.findById(senderId).select('name image').lean();

      const formattedMessage = {
        _id: newMessage._id,
        chatId,
        senderId: senderId,
        senderRole: 'user',
        senderName: sender?.name || 'Unknown',
        senderImage: sender?.image || null,
        message: newMessage.message,
        status: newMessage.status,
        createdAt: newMessage.createdAt
      };

      setPresence(socket.userId, 'user', true);
      io.to(`user_to_user_chat:${chatId}`).emit('receive_user_to_user_message', formattedMessage);
      socket.emit('user_to_user_message_sent', formattedMessage);

    } catch (error) {
      console.error('Error sending user-to-user message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Send message in mentor-to-mentor chat
  socket.on('send_mentor_to_mentor_message', async (data = {}) => {
    try {
      const { chatId, message } = data;
      const senderId = socket.mentorId;

      if (!chatId || !message) {
        socket.emit('message_error', { message: 'Invalid message data' });
        return;
      }

      if (socket.userRole !== 'mentor' || !senderId) {
        socket.emit('message_error', { message: 'Unauthorized sender' });
        return;
      }

      const MentorToMentorChat = require('./models/mentorToMentorChatSchema');
      const MentorToMentorMessage = require('./models/mentorToMentorMessageSchema');
      const Mentor = require('./models/mentorSchema');

      const chat = await MentorToMentorChat.findById(chatId);
      if (!chat) {
        socket.emit('message_error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.mentor1Id.toString() === senderId ||
        chat.mentor2Id.toString() === senderId;

      if (!isParticipant) {
        socket.emit('message_error', { message: 'Not authorized to send in this chat' });
        return;
      }

      const newMessage = new MentorToMentorMessage({
        chatId,
        senderId,
        message: message.trim(),
        messageType: 'text',
        status: 'sent'
      });

      await newMessage.save();

      await MentorToMentorChat.updateOne(
        { _id: chatId },
        {
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          updatedAt: new Date()
        }
      );

      const unreadField = chat.mentor1Id.toString() === senderId
        ? 'mentor2UnreadCount'
        : 'mentor1UnreadCount';
      await MentorToMentorChat.updateOne(
        { _id: chatId },
        { $inc: { [unreadField]: 1 } }
      );

      const sender = await Mentor.findById(senderId).select('name image').lean();

      const formattedMessage = {
        _id: newMessage._id,
        chatId,
        senderId: senderId,
        senderRole: 'mentor',
        senderName: sender?.name || 'Unknown',
        senderImage: sender?.image || null,
        message: newMessage.message,
        status: newMessage.status,
        createdAt: newMessage.createdAt
      };

      setPresence(socket.mentorId, 'mentor', true);
      io.to(`mentor_to_mentor_chat:${chatId}`).emit('receive_mentor_to_mentor_message', formattedMessage);
      socket.emit('mentor_to_mentor_message_sent', formattedMessage);

    } catch (error) {
      console.error('Error sending mentor-to-mentor message:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Get online status
  socket.on('get_online_status', (data) => {
    try {
      const { userId, mentorId } = data;
      let status = {};

      if (userId) {
        const userIdStr = String(userId);
        status.userId = userIdStr;
        status.userOnline = getPresence(userIdStr, 'user');
      }
      if (mentorId) {
        const mentorIdStr = String(mentorId);
        status.mentorId = mentorIdStr;
        status.mentorOnline = getPresence(mentorIdStr, 'mentor');
      }

      socket.emit('online_status', status);
    } catch (error) {
      console.error('Error getting online status:', error);
      socket.emit('online_status_error', { message: 'Failed to get status' });
    }
  });

  // Join space room (for real-time updates)
  socket.on('join_space', async (spaceId) => {
    try {
      if (!spaceId) {
        socket.emit('space_error', { message: 'Space ID required' });
        return;
      }

      // Normalize spaceId to string
      const normalizedSpaceId = String(spaceId);
      const Space = require('./models/spaceSchema');
      const space = await Space.findById(normalizedSpaceId).select('members').lean();

      if (!space) {
        socket.emit('space_error', { message: 'Space not found' });
        return;
      }

      const actorId = socket.userId || socket.mentorId;
      if (!actorId) {
        socket.emit('space_error', { message: 'Authentication required' });
        return;
      }

      // Check if user/mentor is a member of the space
      const isMember = space.members.some(
        (m) => m.id && m.id.toString() === actorId.toString()
      );

      if (!isMember) {
        socket.emit('space_error', { message: 'You must be a member to join the space room' });
        return;
      }

      // Use consistent room name format with string spaceId
      const roomName = `space:${normalizedSpaceId}`;
      socket.join(roomName);

      // Track which space this user is currently viewing
      socket.currentSpaceId = normalizedSpaceId;

      console.log(`Socket ${socket.id} joined space room: ${roomName} (spaceId: ${normalizedSpaceId})`);

      // Get room size for debugging
      const room = io.sockets.adapter.rooms.get(roomName);
      const roomSize = room ? room.size : 0;
      console.log(`Space room ${roomName} now has ${roomSize} member(s)`);
    } catch (error) {
      console.error('Error joining space:', error);
      socket.emit('space_error', { message: 'Failed to join space' });
    }
  });

  // Leave space room
  socket.on('leave_space', (spaceId) => {
    if (spaceId) {
      socket.leave(`space:${spaceId}`);
      // Clear current space tracking
      if (socket.currentSpaceId === String(spaceId)) {
        socket.currentSpaceId = null;
      }
      console.log(`Socket ${socket.id} left space ${spaceId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      if (socket.userId && socket.userRole === 'user') {
        setPresence(socket.userId, 'user', false);
        socket.broadcast.emit('user_offline', { userId: socket.userId });
        // Also emit to self for consistency
        socket.emit('user_offline', { userId: socket.userId });
        console.log(`User ${socket.userId} disconnected`);
      } else if (socket.mentorId && socket.userRole === 'mentor') {
        setPresence(socket.mentorId, 'mentor', false);
        socket.broadcast.emit('mentor_offline', { mentorId: socket.mentorId });
        // Also emit to self for consistency
        socket.emit('mentor_offline', { mentorId: socket.mentorId });
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