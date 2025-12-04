# 🎵 Quick Start: Music Feature

## TL;DR - Get Music Working in 5 Minutes

### 1. Get Spotify Credentials (2 minutes)
1. Go to https://developer.spotify.com/dashboard
2. Click "Create App"
3. Name it "Watch2Together", click Create
4. Copy **Client ID** and **Client Secret**

### 2. Update Environment Variables (1 minute)
Add to your `.env.local` file:
```env
SPOTIFY_CLIENT_ID=paste_your_client_id_here
SPOTIFY_CLIENT_SECRET=paste_your_secret_here
```

### 3. Restart Server (1 minute)
```bash
# Stop the current server (Ctrl+C)
pnpm dev
```

### 4. Try It Out! (1 minute)
1. Open http://localhost:3000?room=music
2. Click **Music** toggle at the top
3. Click **Browse Music**
4. Search for your favorite song
5. Click a result to play!

## That's It! 🎉

Your music feature is now fully functional with:
- ✅ Spotify search
- ✅ YouTube Music search  
- ✅ Real-time sync
- ✅ Beautiful UI

## Test It With Friends

Share this URL with friends:
```
http://localhost:3000?room=yourname
```

Everyone in the same room will hear the same music in perfect sync!

## Quick Tips

- **Switch Modes**: Toggle between Video and Music anytime
- **Platform Filter**: Try "Spotify" or "YouTube" filters for specific sources
- **Genre Tags**: Click quick genre tags for instant search results
- **Volume Sync**: Everyone's volume syncs (optional feature)

## Next Steps

- Read `MUSIC_SETUP.md` for detailed configuration
- Check `UPDATE_SUMMARY.md` for all features
- See `README.md` for deployment instructions

---

**Need Help?**
- Spotify not working? Check your credentials in `.env.local`
- YouTube not working? Verify `YOUTUBE_API_KEY` is set
- Sync issues? Make sure everyone is in the same room

Enjoy! 🎵
