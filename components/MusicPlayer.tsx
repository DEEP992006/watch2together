'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Search, Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, X, TrendingUp, Clock, Radio } from 'lucide-react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import YouTube, { YouTubeProps } from 'react-youtube';

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

interface MusicEvent {
  type: 'play' | 'pause' | 'seek' | 'load-track' | 'volume';
  time: number;
  senderId?: string;
  trackId?: string;
  platform?: 'spotify' | 'youtube' | 'soundcloud';
  volume?: number;
  track?: MusicTrack;
}

interface MusicPlayerProps {
  room: string;
  username: string;
  triggerEvent: (event: string, data: any) => Promise<void>;
  pusherChannel: any;
}

export default function MusicPlayer({ room, username, triggerEvent, pusherChannel }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'spotify' | 'youtube' | 'soundcloud'>('all');
  const [nextPageToken, setNextPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isReceivingUpdate = useRef(false);
  const senderIdRef = useRef(Math.random().toString(36));
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!pusherChannel) return;

    const handleMusicEvent = async (data: MusicEvent) => {
      if (data.senderId === senderIdRef.current) return;
      
      isReceivingUpdate.current = true;

      try {
        if (data.type === 'load-track' && data.track) {
          // Load track from another user
          loadTrack(data.track, false);
        } else if (data.type === 'play') {
          if (youtubePlayerRef.current) {
            try {
              const currentYtTime = await youtubePlayerRef.current.getCurrentTime();
              if (Math.abs(currentYtTime - data.time) > 1) {
                youtubePlayerRef.current.seekTo(data.time, true);
              }
              youtubePlayerRef.current.playVideo();
              setIsPlaying(true);
            } catch (err) {
              // Player not ready
            }
          } else if (audioRef.current) {
            audioRef.current.currentTime = data.time;
            await audioRef.current.play();
            setIsPlaying(true);
          }
        } else if (data.type === 'pause') {
          if (youtubePlayerRef.current) {
            try {
              const currentYtTime = await youtubePlayerRef.current.getCurrentTime();
              if (Math.abs(currentYtTime - data.time) > 1) {
                youtubePlayerRef.current.seekTo(data.time, true);
              }
              youtubePlayerRef.current.pauseVideo();
              setIsPlaying(false);
            } catch (err) {
              // Player not ready
            }
          } else if (audioRef.current) {
            audioRef.current.currentTime = data.time;
            audioRef.current.pause();
            setIsPlaying(false);
          }
        } else if (data.type === 'seek') {
          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.seekTo(data.time, true);
            } catch (err) {
              // Player not ready
            }
          } else if (audioRef.current) {
            audioRef.current.currentTime = data.time;
          }
        } else if (data.type === 'volume' && data.volume !== undefined) {
          setVolume(data.volume);
          if (youtubePlayerRef.current) {
            try {
              youtubePlayerRef.current.setVolume(data.volume * 100);
            } catch (err) {
              // Player not ready
            }
          } else if (audioRef.current) {
            audioRef.current.volume = data.volume;
          }
        }
      } catch (err) {
        console.error('Music sync error:', err);
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 300);
    };

    pusherChannel.bind('music-event', handleMusicEvent);

    return () => {
      pusherChannel.unbind('music-event', handleMusicEvent);
    };
  }, [pusherChannel]);

  useEffect(() => {
    if (currentTrack?.platform === 'youtube' && youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.setVolume(volume * 100);
      } catch (err) {
        // Player not ready yet
      }
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, currentTrack]);

  // Update current time for YouTube
  useEffect(() => {
    if (currentTrack?.platform === 'youtube' && isPlaying && youtubePlayerRef.current) {
      updateIntervalRef.current = setInterval(async () => {
        try {
          const time = await youtubePlayerRef.current?.getCurrentTime();
          if (time !== undefined) {
            setCurrentTime(time);
          }
        } catch (err) {
          // Player not ready
        }
      }, 500);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [currentTrack, isPlaying]);

  const searchMusic = useCallback(async (query: string, pageToken = '') => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get('/api/music/search', {
        params: {
          q: query,
          platform: selectedPlatform,
          pageToken,
        },
      });

      const { items, nextPageToken: newPageToken } = response.data;
      
      if (pageToken) {
        setSearchResults((prev) => [...prev, ...items]);
      } else {
        setSearchResults(items);
      }
      
      setNextPageToken(newPageToken || '');
      setHasMore(!!newPageToken);
    } catch (error) {
      console.error('Music search error:', error);
      setSearchResults([]);
      setHasMore(false);
    } finally {
      setIsSearching(false);
    }
  }, [selectedPlatform]);

  const handleSearch = () => {
    setNextPageToken('');
    setHasMore(true);
    searchMusic(searchQuery);
  };

  const loadMoreResults = () => {
    if (nextPageToken && !isSearching) {
      searchMusic(searchQuery, nextPageToken);
    }
  };

  const loadTrack = async (track: MusicTrack, broadcast = true) => {
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);

    if (broadcast) {
      triggerEvent('music-event', {
        type: 'load-track',
        time: 0,
        senderId: senderIdRef.current,
        trackId: track.id,
        platform: track.platform,
        track: track,
      });
    }

    setShowSearch(false);
    
    // Auto-play after a short delay to ensure player is ready
    setTimeout(async () => {
      if (track.platform === 'youtube' && youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.playVideo();
          setIsPlaying(true);
          if (broadcast) {
            triggerEvent('music-event', {
              type: 'play',
              time: 0,
              senderId: senderIdRef.current,
            });
          }
        } catch (err) {
          console.error('Auto-play error:', err);
        }
      } else if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          if (broadcast) {
            triggerEvent('music-event', {
              type: 'play',
              time: 0,
              senderId: senderIdRef.current,
            });
          }
        } catch (err) {
          console.error('Auto-play error:', err);
        }
      }
    }, 1000);
  };

  const togglePlay = async () => {
    if (!currentTrack) return;

    if (isPlaying) {
      if (currentTrack.platform === 'youtube' && youtubePlayerRef.current) {
        const time = await youtubePlayerRef.current.getCurrentTime();
        youtubePlayerRef.current.pauseVideo();
        setIsPlaying(false);
        if (!isReceivingUpdate.current) {
          triggerEvent('music-event', {
            type: 'pause',
            time,
            senderId: senderIdRef.current,
          });
        }
      } else if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (!isReceivingUpdate.current) {
          triggerEvent('music-event', {
            type: 'pause',
            time: audioRef.current.currentTime,
            senderId: senderIdRef.current,
          });
        }
      }
    } else {
      try {
        if (currentTrack.platform === 'youtube' && youtubePlayerRef.current) {
          const time = await youtubePlayerRef.current.getCurrentTime();
          youtubePlayerRef.current.playVideo();
          setIsPlaying(true);
          if (!isReceivingUpdate.current) {
            triggerEvent('music-event', {
              type: 'play',
              time,
              senderId: senderIdRef.current,
            });
          }
        } else if (audioRef.current) {
          await audioRef.current.play();
          setIsPlaying(true);
          if (!isReceivingUpdate.current) {
            triggerEvent('music-event', {
              type: 'play',
              time: audioRef.current.currentTime,
              senderId: senderIdRef.current,
            });
          }
        }
      } catch (err) {
        console.error('Playback error:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    
    if (currentTrack?.platform === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    
    if (!isReceivingUpdate.current) {
      triggerEvent('music-event', {
        type: 'seek',
        time,
        senderId: senderIdRef.current,
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    
    if (!isReceivingUpdate.current) {
      triggerEvent('music-event', {
        type: 'volume',
        time: currentTime,
        volume: vol,
        senderId: senderIdRef.current,
      });
    }
  };

  const playNext = () => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentIndex(nextIndex);
    loadTrack(searchResults[nextIndex]);
  };

  const playPrevious = () => {
    if (searchResults.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    loadTrack(searchResults[prevIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'spotify': return 'from-green-500 to-emerald-600';
      case 'youtube': return 'from-red-500 to-rose-600';
      case 'soundcloud': return 'from-orange-500 to-amber-600';
      default: return 'from-purple-500 to-pink-600';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'spotify': return '🎵';
      case 'youtube': return '▶️';
      case 'soundcloud': return '☁️';
      default: return '🎵';
    }
  };

  // YouTube player handlers
  const onYouTubeReady: YouTubeProps['onReady'] = async (event) => {
    youtubePlayerRef.current = event.target;
    try {
      const dur = await event.target.getDuration();
      setDuration(dur);
      event.target.setVolume(volume * 100);
    } catch (err) {
      console.error('YouTube player setup error:', err);
    }
  };

  const onYouTubeStateChange: YouTubeProps['onStateChange'] = async (event) => {
    if (isReceivingUpdate.current) return;
    
    const state = event.data;
    // 1 = playing, 2 = paused, 0 = ended
    if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2) {
      setIsPlaying(false);
    } else if (state === 0) {
      setIsPlaying(false);
      // Auto-play next track
      playNext();
    }
  };

  const youtubeOpts: YouTubeProps['opts'] = {
    width: '1',
    height: '1',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
    },
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-rose-100">
      {/* Current Track Display */}
      {!currentTrack ? (
        <div className="aspect-video bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-rose-300 p-6">
          <Music className="w-16 h-16 text-rose-400 mb-3" />
          <p className="text-gray-600 text-center mb-3 text-sm">No track playing</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(true)}
            className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-5 py-2 rounded-full font-semibold shadow-lg text-sm"
          >
            Explore Music
          </motion.button>
        </div>
      ) : (
        <div>
          {/* Compact Album Art */}
          <div className="relative mb-4">
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.01, 1] : 1 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
              className="aspect-video rounded-xl overflow-hidden shadow-lg relative"
            >
              {/* Always show thumbnail/poster */}
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay animation when playing */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-t from-rose-500/30 via-purple-500/20 to-transparent"
                />
              )}
              
              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                  <div className="flex gap-0.5">
                    <motion.div
                      animate={{ height: [6, 12, 6] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-0.5 bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ height: [8, 14, 8] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      className="w-0.5 bg-white rounded-full"
                    />
                    <motion.div
                      animate={{ height: [6, 12, 6] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      className="w-0.5 bg-white rounded-full"
                    />
                  </div>
                  <span className="text-white text-xs font-medium">Playing</span>
                </div>
              )}
            </motion.div>
            
            {/* Platform Badge */}
            <div className={`absolute top-3 right-3 bg-gradient-to-r ${getPlatformColor(currentTrack.platform)} text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
              <span>{getPlatformIcon(currentTrack.platform)}</span>
            </div>
          </div>
          
          {/* Hidden YouTube Player for audio */}
          {currentTrack.platform === 'youtube' && (
            <div className="hidden">
              <YouTube
                videoId={currentTrack.id}
                opts={youtubeOpts}
                onReady={onYouTubeReady}
                onStateChange={onYouTubeStateChange}
              />
            </div>
          )}

          {/* Track Info - Compact */}
          <div className="text-center mb-3">
            <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">{currentTrack.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">{currentTrack.artist}</p>
          </div>

          {/* Progress Bar - Compact */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(244, 63, 94) 0%, rgb(244, 63, 94) ${(currentTime / (duration || 100)) * 100}%, rgb(254, 205, 211) ${(currentTime / (duration || 100)) * 100}%, rgb(254, 205, 211) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls - Better sized */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playPrevious}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipBack className="w-4 h-4 text-gray-700" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-rose-500 to-purple-600"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" fill="white" />
              ) : (
                <Play className="w-5 h-5 text-white" fill="white" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playNext}
              className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipForward className="w-4 h-4 text-gray-700" />
            </motion.button>
          </div>

          {/* Volume Control - Compact */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-rose-50 to-purple-50 p-3 rounded-lg">
            <Volume2 className="w-4 h-4 text-gray-600" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(244, 63, 94) 0%, rgb(244, 63, 94) ${volume * 100}%, rgb(254, 205, 211) ${volume * 100}%, rgb(254, 205, 211) 100%)`
              }}
            />
            <span className="text-xs text-gray-600 w-10 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Search Modal */}
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
              {/* Search Header */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Music className="w-6 h-6 text-rose-500" />
                    Explore Music
                  </h3>
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
                      placeholder="Search for songs, artists, albums..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>

                {/* Info Badge */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Music className="w-4 h-4" />
                  <span>Powered by YouTube Music - Full songs, no previews</span>
                </div>
              </div>

              {/* Results */}
              <div id="musicScrollableDiv" className="overflow-y-auto flex-1 p-4 md:p-6">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="text-center py-12">
                    <Music className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">Search for your favorite songs!</p>
                    <p className="text-xs text-gray-400">Full songs powered by YouTube Music</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {['Pop Hits', 'Rock Music', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Indie', 'Country'].map((genre) => (
                        <button
                          key={genre}
                          onClick={() => {
                            setSearchQuery(genre);
                            setTimeout(() => handleSearch(), 100);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-rose-50 to-purple-50 text-gray-700 rounded-full text-sm hover:from-rose-100 hover:to-purple-100 transition-all"
                        >
                          🎵 {genre}
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
                    scrollableTarget="musicScrollableDiv"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {searchResults.map((track) => (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadTrack(track)}
                          className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100"
                        >
                          <div className="relative aspect-square bg-gray-200">
                            <img
                              src={track.thumbnail}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-12 h-12 text-white drop-shadow-lg" fill="white" />
                            </div>
                            <div className={`absolute top-2 right-2 bg-gradient-to-r ${getPlatformColor(track.platform)} text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg`}>
                              {getPlatformIcon(track.platform)}
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-800 line-clamp-1 mb-1">
                              {track.title}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-1">{track.artist}</p>
                            {track.album && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-1">{track.album}</p>
                            )}
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

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(244, 63, 94);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgb(244, 63, 94);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
