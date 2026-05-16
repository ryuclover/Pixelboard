const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow frontend access
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_pixelboard';

app.use(cors());
app.use(express.json());

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
    const dummyPassword = await bcrypt.hash('guestpass123', 10);
    
    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        password: dummyPassword,
        avatar: "👻",
        coins: 50 // Guest starts with less coins
      }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, coins: user.coins } });
  } catch (error) {
    res.status(500).json({ error: 'Could not create guest account' });
  }
});

// Register
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        avatar: "🧙‍♂️",
        coins: 100 // Starting coins
      }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
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

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
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
