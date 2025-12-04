# Music Feature Setup Guide 🎵

This guide will help you get the new music listening feature up and running.

## Quick Start

The music feature is already integrated into Watch2Together! Just toggle between Video and Music mode using the switcher at the top of the page.

## What's New

### Music Player Component
- **Platform Support**: Spotify, YouTube Music, SoundCloud (extensible)
- **Synchronized Playback**: Everyone in the room hears the same music at the same time
- **Search & Browse**: Find music across multiple platforms
- **Beautiful UI**: Responsive design with smooth animations

### Features
- 🎵 Real-time music synchronization
- 🔍 Multi-platform search (Spotify, YouTube Music)
- 🎨 Album art display with platform badges
- ⏯️ Synchronized play/pause controls
- 🔊 Volume control sync
- ⏱️ Progress bar with seek functionality
- 📱 Fully responsive design

## API Configuration

### Required APIs

#### 1. YouTube Data API (For YouTube Music)
Already configured if you're using YouTube videos.

#### 2. Spotify Web API (Optional but Recommended)
To enable Spotify music search:

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create a free account
3. Click "Create an App"
4. Fill in the details:
   - App name: "Watch2Together"
   - App description: "Synchronized music player"
   - Redirect URI: Not needed for this integration
5. Click "Create"
6. Copy your **Client ID** and **Client Secret**
7. Add to your `.env.local`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

### Optional APIs

#### SoundCloud (For Future Integration)
The code is prepared for SoundCloud integration. To enable:

1. Visit [SoundCloud Developers](https://soundcloud.com/you/apps)
2. Register a new app
3. Get your Client ID
4. Add to `.env.local`:
   ```env
   SOUNDCLOUD_CLIENT_ID=your_client_id_here
   ```

## How It Works

### Frontend (MusicPlayer.tsx)
- React component with full playback controls
- Receives real-time events via Pusher
- Syncs playback state across all users
- Beautiful UI with Framer Motion animations

### Backend (API Route)
- `/api/music/search` - Search music across platforms
- Integrates with Spotify API for track search
- Uses YouTube API for music videos
- Returns unified response format

### Real-time Sync
Music events synchronized via Pusher:
- `load-track` - New track selected
- `play` - Playback started
- `pause` - Playback paused
- `seek` - Position changed
- `volume` - Volume adjusted

## Usage

1. **Start the app**: `pnpm dev`
2. **Open in browser**: `http://localhost:3000?room=music1`
3. **Toggle to Music mode**: Click the Music button at the top
4. **Search for music**: Click "Browse Music"
5. **Select a platform**: Choose Spotify, YouTube, or All
6. **Play a track**: Click on any search result
7. **Invite friends**: Share the URL with the same room parameter

## Platform Features

### Spotify
- ✅ Full track metadata (title, artist, album)
- ✅ High-quality album art
- ✅ 30-second preview playback
- ✅ Search by song, artist, or album
- ❌ Full-length playback (requires Premium SDK)

### YouTube Music
- ✅ Full-length music videos
- ✅ Extensive music library
- ✅ Free to use
- ✅ High-quality thumbnails
- ⚠️ May include ads (based on YouTube)

### Future: SoundCloud
- 🔄 Integration prepared
- 🔄 Awaiting API implementation

## Troubleshooting

### "Spotify credentials not configured"
- Make sure you've added `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to `.env.local`
- Restart the dev server after adding environment variables

### "YouTube API key not configured"
- Add `YOUTUBE_API_KEY` to your `.env.local`
- Restart the dev server

### Music doesn't sync
- Check that all users are in the same room
- Verify Pusher credentials are correct
- Check browser console for errors

### Preview doesn't play
- Spotify only provides 30-second previews for most tracks
- Some tracks may not have preview URLs available
- Try a different track or use YouTube Music mode

## Development

### Adding New Platforms

To add support for a new music platform:

1. **Add platform type** in `MusicPlayer.tsx`:
   ```typescript
   type Platform = 'spotify' | 'youtube' | 'soundcloud' | 'apple-music';
   ```

2. **Create search function** in `/app/api/music/search/route.ts`:
   ```typescript
   async function searchAppleMusic(query: string) {
     // Implementation
   }
   ```

3. **Add platform filter** in the UI
4. **Add platform icon/color** using helper functions

### Extending Features

Ideas for future enhancements:
- [ ] Playlist creation and sharing
- [ ] Queue system with upcoming tracks
- [ ] Full Spotify SDK integration for Premium users
- [ ] Apple Music integration
- [ ] Lyrics display
- [ ] Audio visualizer
- [ ] DJ mode (room host controls)
- [ ] Track voting system

## Architecture

```
┌─────────────────┐
│   Browser 1     │
│  MusicPlayer    │
└────────┬────────┘
         │
         ├─────────┐
         │         │
    ┌────▼─────────▼────┐
    │   Pusher Cloud    │
    │  (Real-time sync) │
    └────┬─────────┬────┘
         │         │
         ├─────────┘
         │
┌────────▼────────┐
│   Browser 2     │
│  MusicPlayer    │
└─────────────────┘

Search Flow:
Browser → Next.js API → Spotify/YouTube API → Response → Browser
```

## Performance Tips

1. **API Rate Limits**: 
   - YouTube: 10,000 units/day
   - Spotify: Rate limited per app

2. **Optimization**:
   - Search results are cached on the client
   - Infinite scroll loads more results on demand
   - Images are lazy-loaded

3. **Bandwidth**:
   - Audio previews are short (30s)
   - Album art is optimized
   - Real-time events are minimal

## Credits

- **Music Search**: Powered by Spotify & YouTube APIs
- **Real-time Sync**: Pusher Channels
- **UI**: Tailwind CSS & Framer Motion
- **Icons**: Lucide React

Enjoy listening together! 🎵
