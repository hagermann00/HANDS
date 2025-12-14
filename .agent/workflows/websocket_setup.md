---
description: Set up WebSocket real-time communication
---

# WebSocket Setup

## Prerequisites
- Node.js server running
- npm initialized

## Option A: Socket.IO

// turbo
1. Install Socket.IO:
```bash
npm install socket.io
```

2. Server setup (src/socket.js):
```javascript
const { Server } = require('socket.io');

function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Join rooms
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
    });
    
    // Handle messages
    socket.on('message', (data) => {
      // Broadcast to room
      io.to(data.roomId).emit('message', {
        id: Date.now(),
        userId: socket.id,
        text: data.text,
        timestamp: new Date().toISOString()
      });
    });
    
    // Typing indicator
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('user-typing', socket.id);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = setupSocket;
```

3. Integrate with Express:
```javascript
const express = require('express');
const http = require('http');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

// Make io available in routes
app.set('io', io);

server.listen(3000);
```

4. Client setup:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Connect
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Join room
socket.emit('join-room', 'room-123');

// Send message
socket.emit('message', { roomId: 'room-123', text: 'Hello!' });

// Receive messages
socket.on('message', (data) => {
  console.log('New message:', data);
});

// Disconnect handling
socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

## Option B: Native WebSocket (ws)

// turbo
1. Install ws:
```bash
npm install ws
```

2. Server setup:
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    // Broadcast to all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

## Success Criteria
- WebSocket server running
- Clients can connect
- Messages broadcast correctly
- Rooms/channels work
