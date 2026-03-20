const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const { createInitialState } = require('./game/constants');
const { processMove } = require('./game/state');
const { getLegalMoves, isInCheck, getKingSwapMoves } = require('./game/moves');

const app = express();
app.use(cors());
app.use(express.json());

// Serve built React frontend
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Rooms: roomCode -> { players: [{socketId, color}], state, spectators }
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

// Health check
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size }));

// Catch-all: serve React app for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  socket.on('create_room', () => {
    const code = generateRoomCode();
    const state = createInitialState();
    rooms.set(code, {
      players: [{ id: socket.id, color: 'w' }],
      state,
      spectators: [],
    });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.color = 'w';
    socket.emit('room_created', { code, color: 'w' });
    console.log(`[Room] ${code} created by ${socket.id}`);
  });

  socket.on('join_room', ({ code }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.players.length >= 2) {
      room.spectators.push(socket.id);
      socket.join(code);
      socket.data.roomCode = code;
      socket.data.color = 'spectator';
      socket.emit('joined_as_spectator', { state: room.state });
      return;
    }
    room.players.push({ id: socket.id, color: 'b' });
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.color = 'b';
    socket.emit('game_joined', { code, color: 'b', state: room.state });
    io.to(code).emit('game_start', {
      state: room.state,
      players: room.players.map(p => ({ color: p.color })),
    });
    console.log(`[Room] ${code} started`);
  });

  socket.on('make_move', (move) => {
    const code = socket.data.roomCode;
    const color = socket.data.color;
    if (!code || color === 'spectator') return;
    const room = rooms.get(code);
    if (!room) return;

    const result = processMove(room.state, move, color);
    if (!result.valid) {
      socket.emit('move_rejected', { reason: result.reason });
      return;
    }

    room.state = result.state;
    io.to(code).emit('state_update', { state: room.state });

    if (room.state.winner) {
      io.to(code).emit('game_over', { status: room.state.status, winner: room.state.winner });
    } else if (room.state.status === 'draw') {
      io.to(code).emit('game_over', { status: 'draw', winner: null });
    }
  });

  socket.on('resign', () => {
    const code = socket.data.roomCode;
    const color = socket.data.color;
    if (!code || !color || color === 'spectator') return;
    const room = rooms.get(code);
    if (!room) return;
    const winner = color === 'w' ? 'b' : 'w';
    room.state.winner = winner;
    room.state.status = 'resigned';
    io.to(code).emit('game_over', { status: 'resigned', winner, resignedBy: color });
  });

  socket.on('get_legal_moves', ({ row, col }) => {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const moves = getLegalMoves(room.state.board, row, col);
    socket.emit('legal_moves', { row, col, moves });
  });

  socket.on('get_king_swap_moves', () => {
    const code = socket.data.roomCode;
    const color = socket.data.color;
    if (!code || color === 'spectator') return;
    const room = rooms.get(code);
    if (!room) return;
    const swapUsed = color === 'w' ? room.state.whiteKingSwapUsed : room.state.blackKingSwapUsed;
    if (swapUsed || room.state.status !== 'check') {
      socket.emit('king_swap_moves', { moves: [] });
      return;
    }
    const moves = getKingSwapMoves(room.state.board, color);
    socket.emit('king_swap_moves', { moves });
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    const code = socket.data.roomCode;
    const color = socket.data.color;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    if (color !== 'spectator') {
      io.to(code).emit('player_disconnected', { color });
      setTimeout(() => {
        const r = rooms.get(code);
        if (r && !r.players.some(p => p.id !== socket.id && io.sockets.sockets.has(p.id))) {
          rooms.delete(code);
          console.log(`[Room] ${code} cleaned up`);
        }
      }, 60000);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Tamerlane Chess server running on port ${PORT}`);
});
