import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration?: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  url: string;
  previewUrl?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const platform = searchParams.get('platform') || 'all';
  const pageToken = searchParams.get('pageToken') || '';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let results: MusicTrack[] = [];
    let nextPageToken = '';

    // Only use YouTube Music for best UX (full playback, no preview limitations)
    const youtubeResults = await searchYouTubeMusic(query, pageToken);
    results = youtubeResults.items;
    nextPageToken = youtubeResults.nextPageToken || '';

    return NextResponse.json({
      items: results,
      nextPageToken: nextPageToken || null,
    });
  } catch (error: any) {
    console.error('Music Search Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to search music' },
      { status: 500 }
    );
  }
}

async function searchYouTubeMusic(query: string, pageToken: string): Promise<{ items: MusicTrack[], nextPageToken?: string }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return { items: [] };
  }

  try {
    // Search for music videos
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} music`,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: 20,
        pageToken,
        key: apiKey,
      },
    });

    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

    // Get video details
    const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        id: videoIds,
        key: apiKey,
      },
    });

    const items: MusicTrack[] = videoDetailsResponse.data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      duration: item.contentDetails.duration,
      platform: 'youtube' as const,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      previewUrl: undefined, // YouTube doesn't provide preview URLs directly
    }));

    return {
      items,
      nextPageToken: searchResponse.data.nextPageToken,
    };
  } catch (error) {
    console.error('YouTube Music search error:', error);
    return { items: [] };
  }
}

async function searchSpotify(query: string, offset: string): Promise<{ items: MusicTrack[] }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify credentials not configured');
    return { items: [] };
  }

  try {
    // Get Spotify access token
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Search for tracks
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: query,
        type: 'track',
        limit: 20,
        offset: parseInt(offset) || 0,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const items: MusicTrack[] = searchResponse.data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      thumbnail: track.album.images[0]?.url || track.album.images[1]?.url,
      duration: `${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}`,
      platform: 'spotify' as const,
      url: track.external_urls.spotify,
      previewUrl: track.preview_url, // 30-second preview
    }));

    return { items };
  } catch (error) {
    console.error('Spotify search error:', error);
    return { items: [] };
  }
}

// Optional: SoundCloud integration
async function searchSoundCloud(query: string, offset: string): Promise<{ items: MusicTrack[] }> {
  // You would need a SoundCloud API key
  // This is a placeholder implementation
  console.warn('SoundCloud search not implemented');
  return { items: [] };
}
