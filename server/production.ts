import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface WSMessage {
  room: string;
  type: 'play' | 'pause' | 'seek' | 'chat';
  time?: number;
  text?: string;
  user?: string;
}

const rooms = new Map<string, Set<WebSocket>>();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  const wss = new WebSocketServer({ server });

  // WebSocket setup
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

  // Next.js request handling
  expressApp.all('*', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
  });
});
