const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Simple CORS - no complex configuration
app.use(cors());
app.use(express.json());

// Socket.io with simple CORS
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anonymous-chat')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Import models
const Message = require('./models/Message');
const Room = require('./models/Room');

// Store active users per room
const activeUsers = new Map();

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  socket.on('join_room', async (roomId) => {
    try {
      const room = await Room.findById(roomId);
      if (!room || !room.isActive) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      console.log(`👥 User ${socket.id} joined room ${roomId}`);
      socket.roomId = roomId;

      if (!activeUsers.has(roomId)) {
        activeUsers.set(roomId, new Set());
      }
      activeUsers.get(roomId).add(socket.id);

      socket.to(roomId).emit('user_joined', { userId: socket.id });
      socket.emit('online_users', Array.from(activeUsers.get(roomId) || []));

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const room = await Room.findById(data.roomId);
      if (!room || !room.isActive) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const message = new Message({
        roomId: data.roomId,
        anonymousId: data.anonymousId,
        userColor: data.userColor,
        content: data.content.trim(),
        timestamp: data.timestamp || new Date()
      });

      const savedMessage = await message.save();

      const messageData = {
        _id: savedMessage._id,
        roomId: savedMessage.roomId,
        anonymousId: savedMessage.anonymousId,
        userColor: savedMessage.userColor,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp
      };

      io.to(data.roomId).emit('receive_message', messageData);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('get_online_users', (roomId) => {
    const onlineUsers = Array.from(activeUsers.get(roomId) || []);
    socket.emit('online_users', onlineUsers);
  });

  socket.on('leave_room', (roomId) => {
    if (socket.roomId === roomId) {
      socket.leave(roomId);
      if (activeUsers.has(roomId)) {
        activeUsers.get(roomId).delete(socket.id);
        socket.to(roomId).emit('user_left', { userId: socket.id });
        if (activeUsers.get(roomId).size === 0) {
          activeUsers.delete(roomId);
        }
      }
      socket.roomId = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    if (socket.roomId && activeUsers.has(socket.roomId)) {
      activeUsers.get(socket.roomId).delete(socket.id);
      socket.to(socket.roomId).emit('user_left', { userId: socket.id });
      if (activeUsers.get(socket.roomId).size === 0) {
        activeUsers.delete(socket.roomId);
      }
    }
  });
});

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Anonymous Chat API is running!',
    version: '1.0.0'
  });
});

// Simple 404 handler - NO WILDCARDS
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🔗 Health: http://localhost:${PORT}/health
🌐 CORS: Enabled for all origins
  `);
});