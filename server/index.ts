import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface WSMessage {
  room: string;
  type: 'play' | 'pause' | 'seek' | 'chat';
  time?: number;
  text?: string;
  user?: string;
}

interface Client {
  ws: WebSocket;
  room: string;
}

const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket) => {
  let currentRoom: string | null = null;

  ws.on('message', (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      const { room, type, time, text, user } = message;

      if (!currentRoom) {
        currentRoom = room;
        if (!rooms.has(room)) {
          rooms.set(room, new Set());
        }
        rooms.get(room)!.add(ws);
      }

      const roomClients = rooms.get(room);
      if (!roomClients) return;

      roomClients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, time, text, user }));
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      const roomClients = rooms.get(currentRoom);
      if (roomClients) {
        roomClients.delete(ws);
        if (roomClients.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
