'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Upload, Send, Users, Video, Youtube, Search, X, TrendingUp, Clock, Filter, PlayCircle, Smile } from 'lucide-react';
import YouTube, { YouTubeProps } from 'react-youtube';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface VideoEvent {
  type: 'play' | 'pause' | 'seek' | 'load-video';
  time: number;
  senderId?: string;
  videoSrc?: string;
  videoType?: 'file' | 'youtube';
}

interface ChatMessage {
  user: string;
  text: string;
  senderId?: string;
}

interface EmojiReaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  viewCount?: string;
  duration?: string;
}

const DEFAULT_EMOJIS = ['❤️', '😂', '🎉', '🔥', '👏'];
const AVAILABLE_EMOJIS = ['❤️', '😍', '😘', '🥰', '💕', '💖', '💗', '💓', '💞', '😊', '😂', '🤣', '😎', '🥳', '🎉', '🔥', '👏', '🙌', '💪', '✨', '⭐', '🌟', '💯', '🎬', '🎵', '🎶', '🍿', '🎮', '👍', '👎', '🙏', '💔', '💝', '💖', '🌹'];

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [videoType, setVideoType] = useState<'file' | 'youtube'>('file');
  const [messages, setMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [emojiReactions, setEmojiReactions] = useState<EmojiReaction[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string>('');
  const [hasMore, setHasMore] = useState(true);
  const [searchFilter, setSearchFilter] = useState<'relevance' | 'date' | 'viewCount' | 'rating'>('relevance');
  const [videoDuration, setVideoDuration] = useState<'any' | 'short' | 'medium' | 'long'>('any');
  const [userEmojis, setUserEmojis] = useState<string[]>(DEFAULT_EMOJIS);
  const [showEmojiEditor, setShowEmojiEditor] = useState(false);
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  const isReceivingUpdate = useRef(false);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const senderIdRef = useRef(Math.random().toString(36));
  const shouldBePlaying = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Load custom emojis from localStorage
    const savedEmojis = localStorage.getItem('taradeepvibes-emojis');
    if (savedEmojis) {
      try {
        const parsed = JSON.parse(savedEmojis);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserEmojis(parsed);
        }
      } catch (e) {
        console.error('Failed to load emojis:', e);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || 'default';
    setRoom(roomParam);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '25786def95c5c13eda17', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    pusherRef.current = pusher;

    const channel = pusher.subscribe(`room-${roomParam}`);

    channel.bind('video-event', async (data: VideoEvent) => {
      const video = videoRef.current;
      
      // Handle load-video event for YouTube sync
      if (data.type === 'load-video' && data.senderId !== senderIdRef.current) {
        if (data.videoType === 'youtube' && data.videoSrc) {
          setVideoSrc(data.videoSrc);
          setVideoType('youtube');
          setYoutubeUrl(''); // Clear input
        } else if (data.videoType === 'file') {
          // For file uploads, show a notification
          setMessages((prev) => [...prev, `System: Another user loaded a video file. Please load the same file to sync.`]);
        }
        return;
      }

      // Ignore events sent by this client
      if (data.senderId === senderIdRef.current) return;

      isReceivingUpdate.current = true;

      try {
        // Handle YouTube player events
        if (data.videoType === 'youtube' && youtubePlayerRef.current) {
          if (data.type === 'play') {
            const currentTime = await youtubePlayerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentTime - data.time);
            if (timeDiff > 1) {
              youtubePlayerRef.current.seekTo(data.time, true);
            }
            const state = await youtubePlayerRef.current.getPlayerState();
            if (state !== 1) { // 1 = playing
              youtubePlayerRef.current.playVideo();
            }
          } else if (data.type === 'pause') {
            const currentTime = await youtubePlayerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentTime - data.time);
            if (timeDiff > 1) {
              youtubePlayerRef.current.seekTo(data.time, true);
            }
            const state = await youtubePlayerRef.current.getPlayerState();
            if (state === 1) { // 1 = playing
              youtubePlayerRef.current.pauseVideo();
            }
          } else if (data.type === 'seek') {
            const currentTime = await youtubePlayerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentTime - data.time);
            if (timeDiff > 1) {
              youtubePlayerRef.current.seekTo(data.time, true);
            }
          }
        }
        // Handle HTML5 video events
        else if (video && data.videoType === 'file') {
          if (data.type === 'play') {
            const timeDiff = Math.abs(video.currentTime - data.time);
            if (timeDiff > 0.5) {
              video.currentTime = data.time;
            }
            if (video.paused) {
              await video.play().catch((err) => {
                console.log('Play interrupted:', err);
              });
            }
          } else if (data.type === 'pause') {
            const timeDiff = Math.abs(video.currentTime - data.time);
            if (timeDiff > 0.5) {
              video.currentTime = data.time;
            }
            if (!video.paused) {
              video.pause();
            }
          } else if (data.type === 'seek') {
            const timeDiff = Math.abs(video.currentTime - data.time);
            if (timeDiff > 0.5) {
              video.currentTime = data.time;
            }
          }
        }
      } catch (err) {
        console.error('Video sync error:', err);
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 300);
    });

    channel.bind('chat-message', (data: ChatMessage) => {
      // Ignore messages sent by this client to avoid duplicates
      if (data.senderId === senderIdRef.current) return;
      setMessages((prev) => [...prev, `${data.user}: ${data.text}`]);
    });

    channel.bind('emoji-reaction', (data: { emoji: string; x: number; y: number }) => {
      const id = Math.random().toString(36);
      setEmojiReactions((prev) => [...prev, { id, ...data }]);
      setTimeout(() => {
        setEmojiReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  const triggerEvent = async (event: string, data: any) => {
    await fetch('/api/pusher/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: `room-${room}`,
        event,
        data,
      }),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setVideoType('file');
      setYoutubeUrl('');
      
      // Notify other users that a file was loaded
      triggerEvent('video-event', {
        type: 'load-video',
        time: 0,
        senderId: senderIdRef.current,
        videoType: 'file',
      });
    }
  };

  const handleYoutubeSubmit = () => {
    if (youtubeUrl.trim()) {
      // Extract video ID from various YouTube URL formats
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        loadYouTubeVideo(videoId);
      }
    }
  };

  const loadYouTubeVideo = (videoId: string) => {
    setVideoSrc(videoId);
    setVideoType('youtube');
    setShowSearch(false);
    
    // Broadcast to other users to load the same YouTube video
    triggerEvent('video-event', {
      type: 'load-video',
      time: 0,
      senderId: senderIdRef.current,
      videoSrc: videoId,
      videoType: 'youtube',
    });
  };

  const searchYouTube = useCallback(async (query: string, pageToken = '') => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get('/api/youtube/search', {
        params: {
          q: query,
          pageToken,
          order: searchFilter,
          videoDuration,
        },
      });

      const { items, nextPageToken: newPageToken } = response.data;
      
      if (pageToken) {
        // Append for infinite scroll
        setSearchResults((prev) => [...prev, ...items]);
      } else {
        // New search
        setSearchResults(items);
      }
      
      setNextPageToken(newPageToken || '');
      setHasMore(!!newPageToken);
    } catch (error) {
      console.error('YouTube search error:', error);
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchFilter, videoDuration]);

  const handleSearch = () => {
    setNextPageToken('');
    setHasMore(true);
    searchYouTube(searchQuery);
  };

  const loadMoreResults = () => {
    if (nextPageToken && !isSearching) {
      searchYouTube(searchQuery, nextPageToken);
    }
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  // YouTube player event handlers
  const onYouTubeReady: YouTubeProps['onReady'] = (event) => {
    youtubePlayerRef.current = event.target;
  };

  const onYouTubeStateChange: YouTubeProps['onStateChange'] = async (event) => {
    if (isReceivingUpdate.current) return;
    
    const state = event.data;
    const player = event.target;
    const time = await player.getCurrentTime();
    
    // 1 = playing, 2 = paused
    if (state === 1) {
      shouldBePlaying.current = true;
      triggerEvent('video-event', {
        type: 'play',
        time,
        senderId: senderIdRef.current,
        videoType: 'youtube',
      });
    } else if (state === 2) {
      shouldBePlaying.current = false;
      triggerEvent('video-event', {
        type: 'pause',
        time,
        senderId: senderIdRef.current,
        videoType: 'youtube',
      });
    }
  };

  const youtubeOpts: YouTubeProps['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handlePlay = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    shouldBePlaying.current = true;
    isReceivingUpdate.current = true;
    triggerEvent('video-event', {
      type: 'play',
      time: videoRef.current.currentTime,
      senderId: senderIdRef.current,
      videoType: 'file',
    });
    setTimeout(() => {
      isReceivingUpdate.current = false;
    }, 300);
  };

  const handlePause = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    shouldBePlaying.current = false;
    isReceivingUpdate.current = true;
    triggerEvent('video-event', {
      type: 'pause',
      time: videoRef.current.currentTime,
      senderId: senderIdRef.current,
      videoType: 'file',
    });
    setTimeout(() => {
      isReceivingUpdate.current = false;
    }, 300);
  };

  const handleSeeked = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    
    // Debounce seek events to prevent multiple rapid triggers
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
    
    seekTimeoutRef.current = setTimeout(() => {
      if (!videoRef.current) return;
      triggerEvent('video-event', {
        type: 'seek',
        time: videoRef.current.currentTime,
        senderId: senderIdRef.current,
        videoType: 'file',
      });
    }, 200);
  };

  const sendChat = () => {
    if (!chatInput.trim() || !username.trim()) return;
    triggerEvent('chat-message', {
      user: username,
      text: chatInput,
      senderId: senderIdRef.current,
    });
    setMessages((prev) => [...prev, `${username}: ${chatInput}`]);
    setChatInput('');
    setShowChatEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setChatInput((prev) => prev + emojiData.emoji);
  };

  const sendEmoji = (emoji: string) => {
    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) return;
    
    const rect = videoContainer.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    
    triggerEvent('emoji-reaction', { emoji, x, y });
    
    const id = Math.random().toString(36);
    setEmojiReactions((prev) => [...prev, { id, emoji, x, y }]);
    setTimeout(() => {
      setEmojiReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  };

  const addEmoji = (emoji: string) => {
    if (userEmojis.length >= 10) {
      alert('Maximum 10 emojis allowed');
      return;
    }
    if (!userEmojis.includes(emoji)) {
      const newEmojis = [...userEmojis, emoji];
      setUserEmojis(newEmojis);
      localStorage.setItem('taradeepvibes-emojis', JSON.stringify(newEmojis));
    }
  };

  const removeEmoji = (emoji: string) => {
    const newEmojis = userEmojis.filter(e => e !== emoji);
    if (newEmojis.length === 0) {
      alert('You must have at least one emoji');
      return;
    }
    setUserEmojis(newEmojis);
    localStorage.setItem('taradeepvibes-emojis', JSON.stringify(newEmojis));
  };

  const resetEmojis = () => {
    setUserEmojis(DEFAULT_EMOJIS);
    localStorage.setItem('taradeepvibes-emojis', JSON.stringify(DEFAULT_EMOJIS));
  };

  const startWatching = () => {
    if (username.trim()) {
      setShowWelcome(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Animated background hearts */}
      {mounted && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-rose-200/30"
              initial={{ y: '100vh', x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) }}
              animate={{
                y: '-10vh',
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
                delay: Math.random() * 5,
              }}
            >
              <Heart className="w-8 h-8" fill="currentColor" />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center mb-6"
              >
                <Heart className="w-12 h-12 md:w-16 md:h-16 text-rose-500" fill="currentColor" />
              </motion.div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
                TaraDeepVibes
              </h1>
              
              <p className="text-gray-600 text-center mb-8 text-sm md:text-base">
                Share magical moments together ✨
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && startWatching()}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all text-base"
                    autoFocus
                  />
                </div>
                
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-purple-700 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Room: {room}</span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Everyone in this room will watch together
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startWatching}
                  className="w-full bg-gradient-to-r from-rose-600 to-purple-600 text-white py-3 md:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow text-base md:text-lg"
                >
                  Start Watching ❤️
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-2 sm:py-3 lg:py-4 max-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          {/* Video Section */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl p-2 sm:p-3 md:p-4 border border-rose-100">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Video Player</h2>
                </div>
                
                {/* Change Video Button - Same row as heading */}
                {videoSrc && (
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <motion.div
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)' }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 text-white transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Local</span>
                      </motion.div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowSearch(true)}
                      className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 text-white transition-all"
                    >
                      <Youtube className="w-4 h-4" />
                      <span className="hidden sm:inline">YouTube</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {!videoSrc ? (
                <div id="video-container" className="aspect-video bg-gradient-to-br from-rose-100 to-purple-100 rounded-xl md:rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-rose-300 p-4 relative">
                  {/* Only show video type switcher when no video is loaded */}
                  <div className="flex gap-2 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVideoType('file')}
                      className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
                        videoType === 'file'
                          ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white/80 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      File Upload
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setVideoType('youtube')}
                      className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-all ${
                        videoType === 'youtube'
                          ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg'
                          : 'bg-white/80 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <Youtube className="w-4 h-4" />
                      YouTube
                    </motion.button>
                  </div>

                  {videoType === 'file' ? (
                    <>
                      <Upload className="w-12 h-12 md:w-16 md:h-16 text-rose-400 mb-4" />
                      <label className="cursor-pointer">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 md:px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-sm md:text-base"
                        >
                          Choose Video File
                        </motion.div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs md:text-sm text-gray-500 mt-3 text-center px-4">
                        Both of you need to load the same video
                      </p>
                    </>
                  ) : (
                    <>
                      <Youtube className="w-12 h-12 md:w-16 md:h-16 text-rose-400 mb-4" />
                      <div className="w-full max-w-md px-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowSearch(true)}
                          className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 md:px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow text-base md:text-lg mb-4 flex items-center justify-center gap-2"
                        >
                          <Search className="w-5 h-5" />
                          Explore & Search YouTube
                        </motion.button>
                        
                        <div className="relative mb-3">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gradient-to-br from-rose-100 to-purple-100 text-gray-500">or paste URL</span>
                          </div>
                        </div>
                        
                        <input
                          type="text"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                          placeholder="Paste YouTube URL or video ID"
                          className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all text-sm md:text-base mb-3"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleYoutubeSubmit}
                          className="w-full bg-white text-gray-700 border-2 border-gray-200 px-6 md:px-8 py-3 rounded-full font-semibold hover:border-rose-300 hover:bg-rose-50 transition-all text-sm md:text-base"
                        >
                          Load from URL
                        </motion.button>
                        <p className="text-xs md:text-sm text-gray-500 mt-3 text-center">
                          Search, explore, or paste a direct link
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div id="video-container" className="relative">
                    {videoType === 'file' ? (
                      <video
                        ref={videoRef}
                        src={videoSrc}
                        controls
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeeked={handleSeeked}
                        onSeeking={(e) => {
                          // Prevent pause during seeking if video should be playing
                          const video = e.currentTarget;
                          if (shouldBePlaying.current && video.paused) {
                            video.play().catch(() => {});
                          }
                        }}
                        className="w-full rounded-xl md:rounded-2xl shadow-lg"
                      />
                    ) : (
                      <div className="aspect-video w-full rounded-xl md:rounded-2xl shadow-lg overflow-hidden bg-black">
                        <YouTube
                          videoId={videoSrc}
                          opts={youtubeOpts}
                          onReady={onYouTubeReady}
                          onStateChange={onYouTubeStateChange}
                          className="w-full h-full"
                          iframeClassName="w-full h-full rounded-xl md:rounded-2xl"
                        />
                      </div>
                    )}
                    
                    {/* Emoji Reactions Overlay */}
                    <AnimatePresence>
                      {emojiReactions.map((reaction) => (
                        <motion.div
                          key={reaction.id}
                          initial={{ opacity: 1, scale: 0, x: reaction.x, y: reaction.y }}
                          animate={{ 
                            opacity: 0, 
                            scale: 2, 
                            y: reaction.y - 100,
                            rotate: Math.random() * 40 - 20
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 3, ease: 'easeOut' }}
                          className="absolute text-4xl pointer-events-none"
                          style={{ left: 0, top: 0 }}
                        >
                          {reaction.emoji}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
              )}

              {/* Emoji Reaction Bar */}
              {videoSrc && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 sm:mt-3 bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-rose-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 font-medium">Quick Reactions</span>
                    <button
                      onClick={() => setShowEmojiEditor(!showEmojiEditor)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      {showEmojiEditor ? 'Done' : 'Customize'}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
                    {userEmojis.map((emoji, idx) => (
                      <div key={idx} className="relative group">
                        <motion.button
                          whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => sendEmoji(emoji)}
                          className="text-2xl sm:text-3xl md:text-4xl p-1 sm:p-2 hover:bg-white/80 rounded-xl transition-all transform hover:shadow-lg"
                        >
                          {emoji}
                        </motion.button>
                        {showEmojiEditor && (
                          <button
                            onClick={() => removeEmoji(emoji)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Emoji Editor */}
                  {showEmojiEditor && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-rose-200"
                    >
                      <p className="text-xs text-gray-600 mb-2">Add more emojis ({userEmojis.length}/10):</p>
                      <div className="flex items-center gap-1 flex-wrap max-h-32 overflow-y-auto">
                        {AVAILABLE_EMOJIS.filter(e => !userEmojis.includes(e)).map((emoji, idx) => (
                          <button
                            key={idx}
                            onClick={() => addEmoji(emoji)}
                            className="text-2xl p-1 hover:bg-white/80 rounded-lg transition-all"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={resetEmojis}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Reset to defaults
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Chat Section */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl p-2 sm:p-3 md:p-4 border border-rose-100 h-[280px] sm:h-[320px] md:h-[380px] lg:h-[500px] flex flex-col">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" fill="currentColor" />
                </motion.div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Chat</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-2 sm:mb-3 space-y-1.5 sm:space-y-2 pr-1 sm:pr-2">
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const [sender, ...textParts] = msg.split(': ');
                    const text = textParts.join(': ');
                    const isMe = sender === username;
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[80%] px-3 md:px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <p className={`text-xs font-semibold mb-1 ${isMe ? 'text-rose-100' : 'text-gray-600'}`}>
                            {sender}
                          </p>
                          <p className="text-sm break-words">{text}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="relative">
                {/* Emoji Picker */}
                {showChatEmojiPicker && (
                  <div className="absolute bottom-full mb-2 right-0 z-10 shadow-2xl rounded-2xl overflow-hidden">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={280}
                      height={350}
                      previewConfig={{ showPreview: false }}
                      searchPlaceHolder="Search emoji..."
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChatEmojiPicker(!showChatEmojiPicker)}
                    className={`p-2.5 md:p-3 rounded-xl shadow-lg transition-all ${
                      showChatEmojiPicker
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white'
                        : 'bg-white text-gray-600 border-2 border-rose-200 hover:border-rose-300'
                    }`}
                  >
                    <Smile className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.button>
                  
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all text-sm md:text-base"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendChat}
                    className="bg-gradient-to-r from-rose-500 to-purple-600 text-white p-2.5 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* YouTube Search Results Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                      <Youtube className="w-6 h-6 text-rose-500" />
                      Explore YouTube
                    </h3>
                    {videoSrc && videoType === 'youtube' && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <PlayCircle className="w-3 h-3" />
                        Currently playing • Select a new video to change
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search for videos..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Search</span>
                  </motion.button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="date">Latest</option>
                    <option value="viewCount">Most Viewed</option>
                    <option value="rating">Top Rated</option>
                  </select>

                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                  >
                    <option value="any">Any Duration</option>
                    <option value="short">Under 4 minutes</option>
                    <option value="medium">4-20 minutes</option>
                    <option value="long">Over 20 minutes</option>
                  </select>
                </div>
              </div>
              
              {/* Results */}
              <div
                id="scrollableDiv"
                className="overflow-y-auto flex-1 p-4 md:p-6"
              >
                {searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-12">
                    <Youtube className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Search for videos to get started!</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {['Music', 'Gaming', 'Movies', 'Comedy', 'Podcast'].map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSearchQuery(tag);
                            setTimeout(() => handleSearch(), 100);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-rose-50 to-purple-50 text-gray-700 rounded-full text-sm hover:from-rose-100 hover:to-purple-100 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <InfiniteScroll
                    dataLength={searchResults.length}
                    next={loadMoreResults}
                    hasMore={hasMore}
                    loader={
                      <div className="text-center py-4">
                        <div className="inline-block w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    }
                    endMessage={
                      <p className="text-center text-gray-500 py-4 text-sm">
                        No more results
                      </p>
                    }
                    scrollableTarget="scrollableDiv"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {searchResults.map((video) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadYouTubeVideo(video.id)}
                          className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100"
                        >
                          <div className="relative aspect-video bg-gray-200">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" fill="white" />
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2 leading-tight">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-1">{video.channelTitle}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {video.viewCount && (
                                <span>{formatViewCount(video.viewCount)}</span>
                              )}
                              {video.publishedAt && (
                                <>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </InfiniteScroll>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
