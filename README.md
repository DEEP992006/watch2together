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