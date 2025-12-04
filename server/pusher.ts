import express from 'express';
import Pusher from 'pusher';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2086563',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '25786def95c5c13eda17',
  secret: process.env.PUSHER_SECRET || '7417fc178505e951b901',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
  useTLS: true
});

app.prepare().then(() => {
  const expressApp = express();
  
  expressApp.use(express.json());

  // Pusher event endpoint
  expressApp.post('/api/pusher/trigger', async (req, res) => {
    try {
      const { channel, event, data } = req.body;
      await pusher.trigger(channel, event, data);
      res.json({ success: true });
    } catch (error) {
      console.error('Pusher trigger error:', error);
      res.status(500).json({ error: 'Failed to trigger event' });
    }
  });

  // Next.js request handling
  expressApp.all('*', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const PORT = process.env.PORT || 3000;
  expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
