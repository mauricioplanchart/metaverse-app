import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Enhanced interfaces with better type safety
export interface Position {
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface Avatar {
  id: string;
  name: string;
  model: string;
  color: string;
  accessories: string[];
  position: Position;
}

export interface User {
  id: string;
  username: string;
  avatar: Avatar;
  position: Position;
  room: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system' | 'private';
}

export interface WorldObject {
  id: string;
  type: 'building' | 'tree' | 'fountain' | 'bench' | 'lamp' | 'sign' | 'portal' | 'floatingIsland' | 'crystalFormation' | 'waterfall' | 'floatingPlatform';
  position: Position;
  model?: string;
  size?: number;
  rotation?: number;
  text?: string;
  color?: string;
  destination?: string;
  height?: number;
}

export interface Environment {
  lighting: 'day' | 'night' | 'sunset';
  weather: 'clear' | 'rain' | 'snow';
  time: number; // 0-24 hour
}

export interface WorldState {
  users: User[];
  objects: WorldObject[];
  environment: Environment;
}

// Enhanced store interface
interface MetaverseStore {
  // Connection state
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastConnectionAttempt: number;
  
  // User state
  currentUser: User | null;
  isAuthenticated: boolean;
  
  // World state
  worldState: WorldState;
  
  // Chat state
  messages: ChatMessage[];
  isChatOpen: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Connection management
  connectSocket: (url: string) => void;
  disconnectSocket: () => void;
  reconnectSocket: () => void;
  
  // User management
  setCurrentUser: (user: User) => void;
  updateUserPosition: (position: Position) => void;
  updateAvatar: (avatar: Partial<Avatar>) => void;
  logout: () => void;
  
  // Room management
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  
  // Chat management
  sendMessage: (message: string, type?: 'chat' | 'system' | 'private') => void;
  addMessage: (message: ChatMessage) => void;
  toggleChat: () => void;
  clearMessages: () => void;
  
  // World management
  updateWorldState: (updates: Partial<WorldState>) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
}

// Configuration constants
const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
  CONNECTION_TIMEOUT: 10000,
  MESSAGE_RATE_LIMIT: 1000, // ms between messages
  POSITION_UPDATE_RATE: 100, // ms between position updates
} as const;

// Enhanced initial state
const initialWorldState: WorldState = {
  users: [],
  objects: [
    { id: 'building-1', type: 'building', position: { x: -10, y: 0, z: -10, rotation: 0 }, model: 'modern', size: 1 },
    { id: 'tree-1', type: 'tree', position: { x: 10, y: 0, z: 10, rotation: 0 }, model: 'oak', size: 1 },
    { id: 'fountain-1', type: 'fountain', position: { x: 0, y: 0, z: 0, rotation: 0 } },
    { id: 'bench-1', type: 'bench', position: { x: 5, y: 0, z: 5, rotation: 0 } },
    { id: 'lamp-1', type: 'lamp', position: { x: -5, y: 0, z: -5, rotation: 0 } },
    { id: 'sign-1', type: 'sign', position: { x: 15, y: 0, z: 0, rotation: 0 }, text: 'Welcome to Metaverse!' },
    { id: 'portal-1', type: 'portal', position: { x: 20, y: 0, z: 20, rotation: 0 }, destination: 'crystal-realm', color: '#8B5CF6' },
    { id: 'island-1', type: 'floatingIsland', position: { x: -20, y: 5, z: -20, rotation: 0 }, size: 1.5 },
    { id: 'crystal-1', type: 'crystalFormation', position: { x: 25, y: 0, z: 25, rotation: 0 }, color: '#10B981' },
    { id: 'waterfall-1', type: 'waterfall', position: { x: -25, y: 0, z: 25, rotation: 0 }, height: 8 },
    { id: 'platform-1', type: 'floatingPlatform', position: { x: 0, y: 3, z: 30, rotation: 0 }, size: 1.2 },
  ],
  environment: {
    lighting: 'day',
    weather: 'clear',
    time: 12,
  },
};

// Input validation helpers
const validatePosition = (position: any): position is Position => {
  return (
    position &&
    typeof position.x === 'number' && !isNaN(position.x) && isFinite(position.x) &&
    typeof position.y === 'number' && !isNaN(position.y) && isFinite(position.y) &&
    typeof position.z === 'number' && !isNaN(position.z) && isFinite(position.z) &&
    typeof position.rotation === 'number' && !isNaN(position.rotation) && isFinite(position.rotation) &&
    Math.abs(position.x) <= 1000 && Math.abs(position.y) <= 1000 && Math.abs(position.z) <= 1000 &&
    Math.abs(position.rotation) <= Math.PI * 2
  );
};

const validateMessage = (message: any): message is string => {
  return (
    typeof message === 'string' &&
    message.trim().length > 0 &&
    message.length <= 1000 &&
    !message.includes('<script>') && // Basic XSS prevention
    !message.includes('javascript:')
  );
};

const validateUser = (user: any): user is User => {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    user.username.trim().length > 0 &&
    user.username.length <= 50 &&
    user.avatar &&
    validatePosition(user.position)
  );
};

// Rate limiting for messages and position updates
let lastMessageTime = 0;
let lastPositionUpdateTime = 0;

export const useMetaverseStore = create<MetaverseStore>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionAttempts: 0,
  lastConnectionAttempt: 0,
  currentUser: null,
  isAuthenticated: false,
  worldState: initialWorldState,
  messages: [],
  isChatOpen: false,
  isLoading: false,
  error: null,

  // Enhanced connection management with retry logic
  connectSocket: (url: string) => {
    try {
      const { connectionAttempts, lastConnectionAttempt } = get();
      const now = Date.now();

      // Check if we should attempt reconnection
      if (connectionAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
        set({ error: 'Maximum reconnection attempts reached. Please refresh the page.' });
        return;
      }

      // Rate limit connection attempts
      if (now - lastConnectionAttempt < CONFIG.RECONNECT_DELAY) {
        return;
      }

      set({ isConnecting: true, error: null });

      const socket = io(url, {
        transports: ['websocket', 'polling'],
        timeout: CONFIG.CONNECTION_TIMEOUT,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: CONFIG.MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: CONFIG.RECONNECT_DELAY,
        reconnectionDelayMax: 5000,
      });

      socket.on('connect', () => {
        console.log('✅ Connected to server');
        set({ 
          socket, 
          isConnected: true, 
          isConnecting: false, 
          connectionAttempts: 0,
          error: null 
        });
        
        // If we have a current user, emit initializeUser
        const { currentUser } = get();
        if (currentUser) {
          console.log('Socket connected, emitting initializeUser for existing user');
          socket.emit('initializeUser', currentUser);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        set({ 
          isConnected: false, 
          isConnecting: false,
          connectionAttempts: get().connectionAttempts + 1,
          lastConnectionAttempt: Date.now()
        });

        // Auto-reconnect for certain disconnect reasons, but with limits
        const { connectionAttempts } = get();
        if ((reason === 'io server disconnect' || reason === 'transport close') && 
            connectionAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            get().reconnectSocket();
          }, CONFIG.RECONNECT_DELAY);
        } else if (connectionAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
          set({ error: 'Maximum reconnection attempts reached. Please refresh the page.' });
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        console.error('❌ Connection error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        set({ 
          isConnecting: false,
          error: `Connection failed: ${error.message}`,
          connectionAttempts: get().connectionAttempts + 1,
          lastConnectionAttempt: Date.now()
        });
      });

      socket.on('error', (error: string) => {
        console.error('❌ Socket error:', error);
        set({ error });
      });

      // Enhanced event handlers with validation
      socket.on('userJoined', (user: User) => {
        try {
          if (!validateUser(user)) {
            console.warn('Invalid user data received:', user);
            return;
          }

          const { worldState } = get();
          const existingUserIndex = worldState.users.findIndex(u => u.id === user.id);
          
          if (existingUserIndex >= 0) {
            // Update existing user
            const updatedUsers = [...worldState.users];
            updatedUsers[existingUserIndex] = user;
            set({ worldState: { ...worldState, users: updatedUsers } });
          } else {
            // Add new user
            const updatedUsers = [...worldState.users, user];
            set({ worldState: { ...worldState, users: updatedUsers } });
          }
        } catch (error) {
          console.error('Error handling userJoined:', error);
          set({ error: 'Failed to handle user join' });
        }
      });

      socket.on('userLeft', (userId: string) => {
        try {
          if (typeof userId !== 'string') {
            console.warn('Invalid userId received:', userId);
            return;
          }

          const { worldState } = get();
          const updatedUsers = worldState.users.filter(user => user.id !== userId);
          set({ worldState: { ...worldState, users: updatedUsers } });
        } catch (error) {
          console.error('Error handling userLeft:', error);
          set({ error: 'Failed to handle user leave' });
        }
      });

      socket.on('userMoved', (data: { userId: string; position: Position }) => {
        try {
          if (!data || typeof data.userId !== 'string' || !validatePosition(data.position)) {
            console.warn('Invalid movement data received:', data);
            return;
          }

          const { worldState } = get();
          const updatedUsers = worldState.users.map(user =>
            user.id === data.userId ? { ...user, position: data.position } : user
          );
          set({ worldState: { ...worldState, users: updatedUsers } });
        } catch (error) {
          console.error('Error handling userMoved:', error);
          set({ error: 'Failed to handle user movement' });
        }
      });

      socket.on('messageReceived', (message: ChatMessage) => {
        try {
          if (!message || typeof message.id !== 'string' || !validateMessage(message.message)) {
            console.warn('Invalid message received:', message);
            return;
          }

          get().addMessage(message);
        } catch (error) {
          console.error('Error handling messageReceived:', error);
          set({ error: 'Failed to handle message' });
        }
      });

      socket.on('worldStateUpdate', (worldState: Partial<WorldState>) => {
        try {
          get().updateWorldState(worldState);
        } catch (error) {
          console.error('Error handling worldStateUpdate:', error);
          set({ error: 'Failed to update world state' });
        }
      });

    } catch (error) {
      console.error('Error connecting socket:', error);
      set({ 
        isConnecting: false,
        error: 'Failed to connect to server',
        connectionAttempts: get().connectionAttempts + 1,
        lastConnectionAttempt: Date.now()
      });
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ 
      socket: null, 
      isConnected: false, 
      isConnecting: false,
      connectionAttempts: 0 
    });
  },

  reconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.connect();
    }
  },

  // Enhanced user management
  setCurrentUser: (user: User) => {
    try {
      console.log('🔵 setCurrentUser called with:', user);
      if (!validateUser(user)) {
        console.error('❌ Invalid user data:', user);
        set({ error: 'Invalid user data' });
        return;
      }

      console.log('✅ Setting user and marking as authenticated');
      set({ currentUser: user, isAuthenticated: true, error: null });
      console.log('✅ User state updated, isAuthenticated should be true');
      
      const { socket } = get();
      if (socket && socket.connected) {
        console.log('🔌 Socket connected, emitting initializeUser');
        socket.emit('initializeUser', user);
      } else {
        console.log('🔌 Socket not connected yet, will emit when connected');
      }
    } catch (error) {
      console.error('❌ Error setting current user:', error);
      set({ error: 'Failed to set user' });
    }
  },

  updateUserPosition: (position: Position) => {
    try {
      if (!validatePosition(position)) {
        console.warn('Invalid position data:', position);
        return;
      }

      // Rate limit position updates
      const now = Date.now();
      if (now - lastPositionUpdateTime < CONFIG.POSITION_UPDATE_RATE) {
        return;
      }
      lastPositionUpdateTime = now;

      const { socket, currentUser } = get();
      if (socket && socket.connected && currentUser) {
        socket.emit('move', position);
        
        // Update local state
        const updatedUser = { ...currentUser, position };
        set({ currentUser: updatedUser });
      }
    } catch (error) {
      console.error('Error updating user position:', error);
      set({ error: 'Failed to update position' });
    }
  },

  updateAvatar: (avatar: Partial<Avatar>) => {
    try {
      const { socket, currentUser } = get();
      if (socket && socket.connected && currentUser) {
        const updatedAvatar = { ...currentUser.avatar, ...avatar };
        const updatedUser = { ...currentUser, avatar: updatedAvatar };
        
        set({ currentUser: updatedUser });
        socket.emit('updateAvatar', updatedAvatar);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      set({ error: 'Failed to update avatar' });
    }
  },

  logout: () => {
    get().disconnectSocket();
    set({
      currentUser: null,
      isAuthenticated: false,
      worldState: initialWorldState,
      messages: [],
      isChatOpen: false,
      error: null,
      isLoading: false,
    });
  },

  // Enhanced room management
  joinRoom: (roomId: string) => {
    try {
      if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
        set({ error: 'Invalid room ID' });
        return;
      }

      const { socket } = get();
      if (socket && socket.connected) {
        socket.emit('joinRoom', roomId.trim());
      }
    } catch (error) {
      console.error('Error joining room:', error);
      set({ error: 'Failed to join room' });
    }
  },

  leaveRoom: () => {
    try {
      const { socket } = get();
      if (socket && socket.connected) {
        socket.emit('leaveRoom');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      set({ error: 'Failed to leave room' });
    }
  },

  // Enhanced chat management
  sendMessage: (message: string, type: 'chat' | 'system' | 'private' = 'chat') => {
    try {
      if (!validateMessage(message)) {
        set({ error: 'Invalid message' });
        return;
      }

      // Rate limit messages
      const now = Date.now();
      if (now - lastMessageTime < CONFIG.MESSAGE_RATE_LIMIT) {
        set({ error: 'Please wait before sending another message' });
        return;
      }
      lastMessageTime = now;

      const { socket } = get();
      if (socket && socket.connected) {
        socket.emit('sendMessage', { message: message.trim(), type });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: 'Failed to send message' });
    }
  },

  addMessage: (message: ChatMessage) => {
    try {
      if (!message || typeof message.id !== 'string' || !validateMessage(message.message)) {
        console.warn('Invalid message data:', message);
        return;
      }

      set(state => ({
        messages: [...state.messages, message].slice(-100) // Keep last 100 messages
      }));
    } catch (error) {
      console.error('Error adding message:', error);
      set({ error: 'Failed to add message' });
    }
  },

  toggleChat: () => {
    set(state => ({ isChatOpen: !state.isChatOpen }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  // Enhanced world management
  updateWorldState: (updates: Partial<WorldState>) => {
    try {
      set(state => ({
        worldState: { ...state.worldState, ...updates }
      }));
    } catch (error) {
      console.error('Error updating world state:', error);
      set({ error: 'Failed to update world state' });
    }
  },

  // Enhanced error handling
  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Enhanced loading states
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
})); 