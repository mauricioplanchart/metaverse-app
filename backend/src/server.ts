import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Environment variable validation with defaults
const requiredEnvVars = ['PORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Configuration constants
const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MAX_CONNECTIONS_PER_IP: 10,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // requests per window
  MAX_MESSAGE_LENGTH: 1000,
  MAX_USERNAME_LENGTH: 50,
  MAX_ROOM_NAME_LENGTH: 100,
  POSITION_UPDATE_INTERVAL: 100, // ms
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 25000, // 25 seconds
} as const;

const app = express();
const httpServer = createServer(app);

// Enhanced Socket.IO configuration with security
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://metaverse-app-sage.vercel.app", "https://metaverse-app.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: CONFIG.CONNECTION_TIMEOUT,
  pingInterval: CONFIG.HEARTBEAT_INTERVAL,
  transports: ['websocket', 'polling'],
  allowEIO3: false, // Disable older Engine.IO versions
  maxHttpBufferSize: 1e6, // 1MB max message size
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173", "https://metaverse-app-sage.vercel.app", "https://metaverse-app.vercel.app"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW,
  max: CONFIG.RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS with enhanced security
app.use(cors({
  origin: ["http://localhost:5173", "https://metaverse-app-sage.vercel.app", "https://metaverse-app.vercel.app"],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Store connected users with enhanced data structure
interface UserData {
  id: string;
  username: string;
  avatar: any;
  position: any;
  room: string;
  lastActivity: number;
  connectionCount: number;
  isActive: boolean;
}

const connectedUsers = new Map<string, UserData>();
const rooms = new Map<string, Set<string>>();
const ipConnections = new Map<string, number>();

// Input validation and sanitization helpers
const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const validatePosition = (position: any): boolean => {
  if (!position || typeof position !== 'object') return false;
  
  const { x, y, z, rotation } = position;
  
  return (
    typeof x === 'number' && !isNaN(x) && isFinite(x) &&
    typeof y === 'number' && !isNaN(y) && isFinite(y) &&
    typeof z === 'number' && !isNaN(z) && isFinite(z) &&
    typeof rotation === 'number' && !isNaN(rotation) && isFinite(rotation) &&
    Math.abs(x) <= 1000 && Math.abs(y) <= 1000 && Math.abs(z) <= 1000 && // Reasonable bounds
    Math.abs(rotation) <= Math.PI * 2
  );
};

const validateMessage = (message: any): boolean => {
  if (!message || typeof message !== 'string') return false;
  
  const sanitized = sanitizeString(message);
  return sanitized.length > 0 && sanitized.length <= CONFIG.MAX_MESSAGE_LENGTH;
};

const validateUserData = (userData: any): boolean => {
  if (!userData || typeof userData !== 'object') return false;
  
  const { username } = userData;
  if (!username || typeof username !== 'string') return false;
  
  const sanitizedUsername = sanitizeString(username);
  return sanitizedUsername.length > 0 && sanitizedUsername.length <= CONFIG.MAX_USERNAME_LENGTH;
};

const validateRoomId = (roomId: any): boolean => {
  if (!roomId || typeof roomId !== 'string') return false;
  
  const sanitized = sanitizeString(roomId);
  return sanitized.length > 0 && sanitized.length <= CONFIG.MAX_ROOM_NAME_LENGTH;
};

// Connection management
const cleanupInactiveUsers = () => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  for (const [userId, userData] of connectedUsers.entries()) {
    if (now - userData.lastActivity > timeout) {
      console.log(`Cleaning up inactive user: ${userId}`);
      connectedUsers.delete(userId);
      
      // Remove from room
      if (userData.room) {
        const roomUsers = rooms.get(userData.room);
        if (roomUsers) {
          roomUsers.delete(userId);
          if (roomUsers.size === 0) {
            rooms.delete(userData.room);
          }
        }
      }
    }
  }
};

// Run cleanup every minute
setInterval(cleanupInactiveUsers, 60 * 1000);

// Enhanced Socket.IO connection handling
io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  const currentConnections = ipConnections.get(clientIP) || 0;
  
  // Check connection limits
  if (currentConnections >= CONFIG.MAX_CONNECTIONS_PER_IP) {
    console.log(`Too many connections from IP: ${clientIP}`);
    socket.disconnect(true);
    return;
  }
  
  ipConnections.set(clientIP, currentConnections + 1);
  
  console.log(`User connected: ${socket.id} from ${clientIP}`);

  // Track user activity
  const updateActivity = () => {
    if (connectedUsers.has(socket.id)) {
      connectedUsers.get(socket.id)!.lastActivity = Date.now();
    }
  };

  // Handle user joining with enhanced validation
  socket.on('joinRoom', (roomId: string) => {
    try {
      updateActivity();
      
      if (!validateRoomId(roomId)) {
        socket.emit('error', 'Invalid room ID');
        return;
      }

      const sanitizedRoomId = sanitizeString(roomId);

      // Leave current room
      if (socket.data.currentRoom) {
        socket.leave(socket.data.currentRoom);
        const currentRoomUsers = rooms.get(socket.data.currentRoom);
        if (currentRoomUsers) {
          currentRoomUsers.delete(socket.id);
          if (currentRoomUsers.size === 0) {
            rooms.delete(socket.data.currentRoom);
          }
        }
      }

      // Join new room
      socket.join(sanitizedRoomId);
      socket.data.currentRoom = sanitizedRoomId;

      // Add to room tracking
      if (!rooms.has(sanitizedRoomId)) {
        rooms.set(sanitizedRoomId, new Set());
      }
      rooms.get(sanitizedRoomId)!.add(socket.id);

      // Update user data
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id)!;
        userData.room = sanitizedRoomId;
        userData.lastActivity = Date.now();
      }

      // Notify other users in the room
      socket.to(sanitizedRoomId).emit('userJoined', {
        id: socket.id,
        username: socket.data.username || 'Anonymous',
        avatar: socket.data.avatar || { id: 'default', name: 'Default', model: 'default', color: '#3b82f6', accessories: [], position: { x: 0, y: 0, z: 0, rotation: 0 } },
        position: socket.data.position || { x: 0, y: 0, z: 0, rotation: 0 },
        room: sanitizedRoomId
      });

      // Send current room users to the joining user
      const roomUsers = Array.from(rooms.get(sanitizedRoomId) || [])
        .filter(userId => userId !== socket.id)
        .map(userId => connectedUsers.get(userId))
        .filter(Boolean);

      socket.emit('roomUsers', roomUsers);

      console.log(`User ${socket.id} joined room: ${sanitizedRoomId}`);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', 'Failed to join room');
    }
  });

  // Handle user movement with rate limiting
  let lastMoveTime = 0;
  socket.on('move', (position: any) => {
    try {
      updateActivity();
      
      // Rate limit movement updates
      const now = Date.now();
      if (now - lastMoveTime < CONFIG.POSITION_UPDATE_INTERVAL) {
        return; // Ignore too frequent updates
      }
      lastMoveTime = now;
      
      if (!validatePosition(position)) {
        socket.emit('error', 'Invalid position data');
        return;
      }

      if (socket.data.currentRoom) {
        socket.data.position = position;
        
        // Update user data
        if (connectedUsers.has(socket.id)) {
          const userData = connectedUsers.get(socket.id)!;
          userData.position = position;
          userData.lastActivity = Date.now();
        }
        
        socket.to(socket.data.currentRoom).emit('userMoved', {
          userId: socket.id,
          position
        });
      }
    } catch (error) {
      console.error('Error in move:', error);
      socket.emit('error', 'Failed to process movement');
    }
  });

  // Handle chat messages with enhanced validation
  socket.on('sendMessage', (data: { message: string; type?: string }) => {
    try {
      updateActivity();
      
      if (!validateMessage(data.message)) {
        socket.emit('error', 'Invalid message');
        return;
      }

      if (socket.data.currentRoom) {
        const sanitizedMessage = sanitizeString(data.message);
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: socket.id,
          username: socket.data.username || 'Anonymous',
          message: sanitizedMessage,
          timestamp: new Date(),
          type: data.type === 'system' || data.type === 'private' ? data.type : 'chat'
        };

        io.to(socket.data.currentRoom).emit('messageReceived', message);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle avatar updates with validation
  socket.on('updateAvatar', (avatar: any) => {
    try {
      updateActivity();
      
      if (!avatar || typeof avatar !== 'object') {
        socket.emit('error', 'Invalid avatar data');
        return;
      }

      // Validate avatar properties
      const validAvatar = {
        id: typeof avatar.id === 'string' ? sanitizeString(avatar.id) : 'default',
        name: typeof avatar.name === 'string' ? sanitizeString(avatar.name) : 'Default',
        model: typeof avatar.model === 'string' ? sanitizeString(avatar.model) : 'default',
        color: typeof avatar.color === 'string' && /^#[0-9A-F]{6}$/i.test(avatar.color) ? avatar.color : '#3b82f6',
        accessories: Array.isArray(avatar.accessories) ? avatar.accessories.filter((a: any) => typeof a === 'string') : [],
        position: validatePosition(avatar.position) ? avatar.position : { x: 0, y: 0, z: 0, rotation: 0 }
      };

      socket.data.avatar = validAvatar;
      
      // Update user data
      if (connectedUsers.has(socket.id)) {
        const userData = connectedUsers.get(socket.id)!;
        userData.avatar = validAvatar;
        userData.lastActivity = Date.now();
      }
      
      if (socket.data.currentRoom) {
        socket.to(socket.data.currentRoom).emit('avatarUpdated', {
          userId: socket.id,
          avatar: validAvatar
        });
      }
    } catch (error) {
      console.error('Error in updateAvatar:', error);
      socket.emit('error', 'Failed to update avatar');
    }
  });

  // Handle user initialization with enhanced validation
  socket.on('initializeUser', (userData: any) => {
    try {
      updateActivity();
      
      if (!validateUserData(userData)) {
        socket.emit('error', 'Invalid user data');
        return;
      }

      const sanitizedUsername = sanitizeString(userData.username);
      const validAvatar = {
        id: 'default',
        name: 'Default',
        model: 'default',
        color: '#3b82f6',
        accessories: [],
        position: { x: 0, y: 0, z: 0, rotation: 0 }
      };

      socket.data.username = sanitizedUsername;
      socket.data.avatar = userData.avatar || validAvatar;
      socket.data.position = validatePosition(userData.position) ? userData.position : { x: 0, y: 0, z: 0, rotation: 0 };
      socket.data.currentRoom = userData.room || 'lobby';

      // Store user data with enhanced tracking
      connectedUsers.set(socket.id, {
        id: socket.id,
        username: sanitizedUsername,
        avatar: socket.data.avatar,
        position: socket.data.position,
        room: socket.data.currentRoom,
        lastActivity: Date.now(),
        connectionCount: 1,
        isActive: true
      });

      // Join default room
      socket.emit('joinRoom', socket.data.currentRoom);

      console.log(`User initialized: ${sanitizedUsername} (${socket.id})`);
    } catch (error) {
      console.error('Error in initializeUser:', error);
      socket.emit('error', 'Failed to initialize user');
    }
  });

  // Handle disconnection with cleanup
  socket.on('disconnect', () => {
    try {
      console.log(`User disconnected: ${socket.id}`);

      // Update connection count for IP
      const clientIP = socket.handshake.address;
      const currentConnections = ipConnections.get(clientIP) || 0;
      if (currentConnections > 0) {
        ipConnections.set(clientIP, currentConnections - 1);
        // Clean up IP entry if no more connections
        if (currentConnections - 1 === 0) {
          ipConnections.delete(clientIP);
        }
      }

      // Remove from room tracking
      if (socket.data.currentRoom) {
        const roomUsers = rooms.get(socket.data.currentRoom);
        if (roomUsers) {
          roomUsers.delete(socket.id);
          if (roomUsers.size === 0) {
            rooms.delete(socket.data.currentRoom);
          }
        }

        // Notify other users
        socket.to(socket.data.currentRoom).emit('userLeft', socket.id);
      }

      // Remove from connected users
      connectedUsers.delete(socket.id);
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Enhanced health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connectedUsers: connectedUsers.size,
      activeRooms: rooms.size,
      totalConnections: Array.from(ipConnections.values()).reduce((sum, count) => sum + count, 0)
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

// Enhanced stats endpoint
app.get('/stats', (req: express.Request, res: express.Response) => {
  try {
    const stats = {
      connectedUsers: connectedUsers.size,
      activeRooms: Array.from(rooms.keys()),
      users: Array.from(connectedUsers.values()).map(user => ({
        id: user.id,
        username: user.username,
        room: user.room,
        lastActivity: user.lastActivity
      })),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close HTTP server
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close Socket.IO server
    io.close(() => {
      console.log('✅ Socket.IO server closed');
      
      // Clean up connections
      connectedUsers.clear();
      rooms.clear();
      ipConnections.clear();
      
      console.log('✅ Cleanup completed');
      process.exit(0);
    });
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const PORT = CONFIG.PORT;

httpServer.listen(PORT, () => {
  console.log(`🚀 Metaverse server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
  console.log(`🔒 Security: Rate limiting, input validation, and CORS enabled`);
  console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
}); 