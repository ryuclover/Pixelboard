const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
const { rateLimit } = require('express-rate-limit');
const { Chess } = require('chess.js');
const { Checkers } = require('./checkersLogic.cjs');
require('dotenv').config();

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: (origin, callback) => {
    // In production, we typically want to disallow requests with no origin (non-browser)
    if (!origin && isProduction) {
      return callback(new Error('CORS origin denied'));
    }
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin denied'));
  },
  methods: ['GET', 'POST']
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Apply rate limiter to all auth routes
app.use('/auth/', authLimiter);

const normalizeUsername = (username) =>
  typeof username === 'string' ? username.trim() : '';
const isValidPasswordForLogin = (password) =>
  typeof password === 'string' && password.length > 0 && password.length <= 128;
const isValidPasswordForRegistration = (password) =>
  typeof password === 'string' && password.length >= 8 && password.length <= 128;
const isValidUsernameForRegistration = (username) =>
  /^(?=.{3,32}$)(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]*[a-zA-Z0-9]$/.test(username);
const createToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// Guest Login
app.post('/auth/guest', async (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `Guest_${randomSuffix}`;
    const guestPassword = randomBytes(32).toString('hex');
    const dummyPassword = await bcrypt.hash(guestPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        password: dummyPassword,
        avatar: "👻",
        coins: 50 // Guest starts with less coins
      }
    });

    const token = createToken(user);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, coins: user.coins } });
  } catch (error) {
    res.status(500).json({ error: 'Could not create guest account' });
  }
});

// Register
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);

  if (
    !isValidUsernameForRegistration(normalizedUsername) ||
    !isValidPasswordForRegistration(password)
  ) {
    return res.status(400).json({
      error: 'Username must be 3-32 chars (letters, numbers, ._-), with no leading/trailing or repeated special chars; password must be 8-128 chars'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        password: hashedPassword,
        avatar: "🧙‍♂️",
        coins: 100 // Starting coins
      }
    });

    const token = createToken(user);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, coins: user.coins } });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername || !isValidPasswordForLogin(password)) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = createToken(user);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, coins: user.coins } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Profile (Protected)
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, avatar: true, coins: true, gamesPlayed: true, gamesWon: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile (Public)
app.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, username: true, avatar: true, gamesPlayed: true, gamesWon: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- GAME ENDPOINTS ---

// Save game result (Protected)
app.post('/games/result', authenticateToken, async (req, res) => {
  const { gameType, opponentId, winnerId, reason, moves } = req.body;
  
  if (!gameType || !opponentId || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const playerId = req.user.id;
    const opponentIdNum = parseInt(opponentId);
    
    // Verify opponent exists
    const opponent = await prisma.user.findUnique({ where: { id: opponentIdNum } });
    if (!opponent) return res.status(404).json({ error: 'Opponent not found' });

    // Save game
    const game = await prisma.game.create({
      data: {
        gameType,
        playerId1: playerId,
        playerId2: opponentIdNum,
        winnerId: winnerId ? parseInt(winnerId) : null,
        reason,
        moves: moves ? JSON.stringify(moves) : '{}'
      }
    });

    // Update player stats
    await prisma.user.update({
      where: { id: playerId },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon: winnerId === playerId ? { increment: 1 } : undefined
      }
    });

    // Update opponent stats
    await prisma.user.update({
      where: { id: opponentIdNum },
      data: {
        gamesPlayed: { increment: 1 },
        gamesWon: winnerId === opponentIdNum ? { increment: 1 } : undefined
      }
    });

    res.json({ success: true, game });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
app.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await prisma.user.findMany({
      select: { id: true, username: true, avatar: true, gamesPlayed: true, gamesWon: true },
      orderBy: { gamesWon: 'desc' },
      take: 100
    });
    
    const leaderboard = topPlayers.map((player, idx) => ({
      rank: idx + 1,
      ...player,
      winRate: player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1) : 0
    }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user game history
app.get('/users/:id/games', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { playerId1: userId },
          { playerId2: userId }
        ]
      },
      include: {
        player1: { select: { id: true, username: true, avatar: true } },
        player2: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- FRIENDS ENDPOINTS ---

// Get user's friends
app.get('/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await prisma.friend.findMany({
      where: { userId: req.user.id },
      include: {
        friend: { select: { id: true, username: true, avatar: true } }
      }
    });
    res.json(friends.map(f => f.friend));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add friend
app.post('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    if (friendId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' });
    
    const friend = await prisma.user.findUnique({ where: { id: friendId } });
    if (!friend) return res.status(404).json({ error: 'User not found' });
    
    const existing = await prisma.friend.findUnique({
      where: { userId_friendId: { userId: req.user.id, friendId } }
    });
    if (existing) return res.status(400).json({ error: 'Already friends' });
    
    const newFriend = await prisma.friend.create({
      data: { userId: req.user.id, friendId }
    });
    res.json(newFriend);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend
app.delete('/friends/:friendId', authenticateToken, async (req, res) => {
  try {
    const friendId = parseInt(req.params.friendId);
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId: req.user.id, friendId },
          { userId: friendId, friendId: req.user.id }
        ]
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CHAT ENDPOINTS ---

// Get recent chat messages
app.get('/chat', async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SHOP ENDPOINTS ---

// Get shop items
app.get('/shop', async (req, res) => {
  try {
    const items = await prisma.shopItem.findMany();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user inventory
app.get('/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await prisma.userItem.findMany({
      where: { userId: req.user.id },
      include: { item: true }
    });
    res.json(inventory.map(ui => ui.item));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Buy item
app.post('/shop/buy/:itemId', authenticateToken, async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.coins < item.price) return res.status(400).json({ error: 'Not enough coins' });

    // Check if already owned
    const owned = await prisma.userItem.findUnique({
      where: { userId_itemId: { userId: req.user.id, itemId } }
    });
    if (owned) return res.status(400).json({ error: 'Already owned' });

    // Deduct coins and add to inventory
    await prisma.user.update({
      where: { id: req.user.id },
      data: { coins: { decrement: item.price } }
    });

    const userItem = await prisma.userItem.create({
      data: { userId: req.user.id, itemId }
    });

    res.json(userItem);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Seed shop items (dev endpoint)
app.post('/shop/seed', async (req, res) => {
  try {
    const existing = await prisma.shopItem.count();
    if (existing > 0) return res.json({ message: 'Shop already seeded' });

    const items = [
      { name: 'Dragon Avatar', description: 'A fierce dragon', icon: '🐉', price: 150, type: 'avatar' },
      { name: 'Gold Border', description: 'Fancy gold border', icon: '✨', price: 200, type: 'border' },
      { name: 'Fire Theme', description: 'Fiery effects', icon: '🔥', price: 300, type: 'cosmetic' },
      { name: 'Ice King Avatar', description: 'Frozen royalty', icon: '👑', price: 250, type: 'avatar' },
      { name: 'Rainbow Aura', description: 'Colorful vibration', icon: '🌈', price: 400, type: 'cosmetic' }
    ];

    const created = await prisma.shopItem.createMany({ data: items });
    res.json({ message: `Created ${created.count} shop items`, items: created });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SOCKET.IO MULTIPLAYER LOGIC ---

// Simple queues for matchmaking
let queues = {
  chess: [],
  damas: []
};

// Map socket id to room metadata { roomId, gameId, state }
let socketToRoom = {};
let activeRooms = {}; // roomId -> { gameId, players: [], gameState: Chess|null, startTime: Date }

// Timer tick for online matches
setInterval(() => {
  for (const roomId in activeRooms) {
    const room = activeRooms[roomId];
    const socket1 = io.sockets.sockets.get(room.players[0]);
    const socket2 = io.sockets.sockets.get(room.players[1]);
    
    if (socket1 && socket2) {
      socket1.emit('timer_sync', { whiteTime: 600, blackTime: 600 });
      socket2.emit('timer_sync', { whiteTime: 600, blackTime: 600 });
    }
  }
}, 5000); // Every 5 seconds

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join global chat
  socket.on('chat_message', async (data) => {
    try {
      const message = await prisma.chatMessage.create({
        data: {
          userId: data.userId,
          username: data.username,
          avatar: data.avatar,
          message: data.message
        }
      });
      io.emit('chat_message', message);
    } catch (error) {
      console.error('Chat error:', error);
    }
  });

  socket.on('join_queue', ({ gameId }) => {
    if (!queues[gameId]) queues[gameId] = [];
    
    // Check if already in queue
    if (queues[gameId].includes(socket.id)) return;
    
    queues[gameId].push(socket.id);
    
    // Matchmaking
    if (queues[gameId].length >= 2) {
      const p1 = queues[gameId].shift();
      const p2 = queues[gameId].shift();
      
      const roomId = `room_${Math.random().toString(36).substring(7)}`;
      
      // Initialize game state
      const roomData = {
        gameId,
        players: [p1, p2],
        gameState: gameId === 'chess' ? new Chess() : (gameId === 'damas' ? new Checkers() : null)
      };
      
      activeRooms[roomId] = roomData;
      socketToRoom[p1] = roomId;
      socketToRoom[p2] = roomId;
      
      const socket1 = io.sockets.sockets.get(p1);
      const socket2 = io.sockets.sockets.get(p2);
      
      if (socket1 && socket2) {
        socket1.join(roomId);
        socket2.join(roomId);
        
        // Assign colors (p1 is white/starts, p2 is black)
        socket1.emit('match_found', { roomId, color: 'w', opponentId: p2 });
        socket2.emit('match_found', { roomId, color: 'b', opponentId: p1 });
        console.log(`Match created: ${roomId} for ${gameId}`);
      }
    }
  });

  socket.on('make_move', (data) => {
    const roomId = socketToRoom[socket.id];
    const room = activeRooms[roomId];
    
    if (room) {
      // Server-side validation for Chess
      if (room.gameId === 'chess' && room.gameState) {
        try {
          const move = room.gameState.move(data.move);
          if (!move) {
            console.log(`Invalid move attempted in room ${roomId}:`, data.move);
            return;
          }
        } catch (e) {
          console.error('Chess move validation error:', e);
          return;
        }
      }
      
      // Server-side validation for Damas
      if (room.gameId === 'damas' && room.gameState) {
        try {
          const result = room.gameState.move(data.moveReq);
          if (!result) {
            console.log(`Invalid Damas move attempted in room ${roomId}:`, data.moveReq);
            return;
          }
        } catch (e) {
          console.error('Damas move validation error:', e);
          return;
        }
      }
      
      // Broadcast to others in the room
      socket.to(roomId).emit('opponent_moved', data);
    }
  });
  
  const handleLeave = () => {
    const roomId = socketToRoom[socket.id];
    if (roomId) {
      socket.to(roomId).emit('opponent_disconnected');
      
      // Cleanup room if someone leaves
      delete activeRooms[roomId];
      
      // Clean up player references
      for (const socketId in socketToRoom) {
        if (socketToRoom[socketId] === roomId) {
          delete socketToRoom[socketId];
        }
      }
    }
    // Remove from queues
    for (let gameId in queues) {
      queues[gameId] = queues[gameId].filter(id => id !== socket.id);
    }
  };

  socket.on('leave_match', handleLeave);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleLeave();
  });

  // Reconnection handling
  socket.on('reconnect_to_match', ({ roomId }) => {
    if (activeRooms[roomId]) {
      socketToRoom[socket.id] = roomId;
      socket.join(roomId);
      console.log(`User ${socket.id} reconnected to room ${roomId}`);
      socket.emit('match_reconnected', { status: 'reconnected' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server and Socket.io running on http://localhost:${PORT}`);
});
