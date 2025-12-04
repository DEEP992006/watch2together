import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const pageToken = searchParams.get('pageToken') || '';
  const order = searchParams.get('order') || 'relevance';
  const videoDuration = searchParams.get('videoDuration') || 'any';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  try {
    // Search for videos
    const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 20,
        pageToken,
        order,
        videoDuration,
        key: apiKey,
      },
    });

    // Get video IDs for additional details
    const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video statistics and content details
    const videoDetailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'statistics,contentDetails',
        id: videoIds,
        key: apiKey,
      },
    });

    // Combine search results with video details
    const items = searchResponse.data.items.map((item: any) => {
      const videoDetails = videoDetailsResponse.data.items.find(
        (detail: any) => detail.id === item.id.videoId
      );

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        viewCount: videoDetails?.statistics?.viewCount || '0',
        duration: videoDetails?.contentDetails?.duration || '',
      };
    });

    return NextResponse.json({
      items,
      nextPageToken: searchResponse.data.nextPageToken || null,
    });
  } catch (error: any) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to search YouTube videos' },
      { status: 500 }
    );
  }
}
