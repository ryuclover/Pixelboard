const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
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

const normalizeUsername = (username) =>
  typeof username === 'string' ? username.trim() : '';
const isValidPasswordInput = (password) =>
  typeof password === 'string' && password.length > 0 && password.length <= 128;
const isValidPasswordForRegistration = (password) =>
  typeof password === 'string' && password.length >= 8 && password.length <= 128;
const isValidUsernameForRegistration = (username) =>
  /^[a-zA-Z0-9_.-]{3,32}$/.test(username);
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
    return res.status(400).json({ error: 'Invalid username or password' });
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

  if (!normalizedUsername || !isValidPasswordInput(password)) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username: normalizedUsername } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

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

// --- SOCKET.IO MULTIPLAYER LOGIC ---

// Simple queues for matchmaking
let queues = {
  chess: [],
  damas: []
};

// Map socket id to room ID
let activeRooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
      
      // Keep track of rooms
      activeRooms[p1] = roomId;
      activeRooms[p2] = roomId;
      
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
    const roomId = activeRooms[socket.id];
    if (roomId) {
      // Broadcast to others in the room
      socket.to(roomId).emit('opponent_moved', data);
    }
  });
  
  socket.on('leave_match', () => {
    const roomId = activeRooms[socket.id];
    if (roomId) {
      socket.to(roomId).emit('opponent_disconnected');
      socket.leave(roomId);
      delete activeRooms[socket.id];
    }
    // Remove from queues
    for (let gameId in queues) {
      queues[gameId] = queues[gameId].filter(id => id !== socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = activeRooms[socket.id];
    if (roomId) {
      socket.to(roomId).emit('opponent_disconnected');
      delete activeRooms[socket.id];
    }
    for (let gameId in queues) {
      queues[gameId] = queues[gameId].filter(id => id !== socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server and Socket.io running on http://localhost:${PORT}`);
});
