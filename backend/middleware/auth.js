const User = require('../models/User');

// Middleware to validate anonymous user
const validateAnonymousUser = async (req, res, next) => {
  try {
    const { anonymousId } = req.body;

    if (!anonymousId) {
      return res.status(401).json({
        success: false,
        message: 'Anonymous ID is required'
      });
    }

    // Check if user exists in database
    const user = await User.findOne({ anonymousId });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid anonymous user'
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to validate room ownership
const validateRoomOwnership = async (req, res, next) => {
  try {
    const { anonymousId } = req.body;
    const roomId = req.params.id;

    if (!anonymousId) {
      return res.status(401).json({
        success: false,
        message: 'Anonymous ID is required'
      });
    }

    const Room = require('../models/Room');
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Allow deletion if:
    // 1. User created the room, OR
    // 2. Room doesn't have createdBy field (old rooms), OR
    // 3. Room has createdBy as 'unknown_user'
    const canModify = !room.createdBy || 
                     room.createdBy === 'unknown_user' || 
                     anonymousId === room.createdBy;

    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You can only modify rooms that you created'
      });
    }

    req.room = room;
    next();

  } catch (error) {
    console.error('Room ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Room validation failed'
    });
  }
};

// Middleware for optional authentication (for public routes)
const optionalAuth = async (req, res, next) => {
  try {
    const { anonymousId } = req.body;

    if (anonymousId) {
      const user = await User.findOne({ anonymousId });
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if there's an error
    console.error('Optional auth error:', error);
    next();
  }
};

// Socket.io authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const { anonymousId } = socket.handshake.auth;

    if (!anonymousId) {
      return next(new Error('Authentication error: Anonymous ID required'));
    }

    // Validate user exists
    const user = await User.findOne({ anonymousId });
    if (!user) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.userId = anonymousId;
    next();

  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Rate limiting middleware (basic implementation)
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);
    const windowStart = now - windowMs;

    // Remove old requests outside the current window
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }

    // Check if rate limit exceeded
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(ip, userRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - userRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

module.exports = {
  validateAnonymousUser,
  validateRoomOwnership,
  optionalAuth,
  socketAuth,
  rateLimit
};