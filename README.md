# Watch2Together

Minimal synced video player with chat using Next.js 14 and WebSocket.

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

This starts both the WebSocket server (port 8000) and Next.js (port 3000).

## Usage

1. Open `http://localhost:3000?room=room1` in multiple browser windows
2. Enter a username
3. Load the same video file in each window
4. Play/pause/seek in one window - others sync automatically
5. Use chat to communicate

Different rooms can be created by changing the `room` query parameter.

## Deploy to Render

1. Push this code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml` and configure everything
6. Click "Create Web Service"

Render will automatically:
- Install dependencies with `pnpm install`
- Build the app with `pnpm build`
- Start the production server with `pnpm start`
- Assign a URL like `https://your-app.onrender.com`

The app will run on a single server handling both WebSocket and HTTP traffic.