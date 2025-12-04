'use client';

import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';

interface VideoEvent {
  type: 'play' | 'pause' | 'seek';
  time: number;
}

interface ChatMessage {
  user: string;
  text: string;
}

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const [room, setRoom] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [messages, setMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const isReceivingUpdate = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || 'default';
    setRoom(roomParam);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '25786def95c5c13eda17', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    });

    pusherRef.current = pusher;

    const channel = pusher.subscribe(`room-${roomParam}`);

    channel.bind('video-event', (data: VideoEvent) => {
      const video = videoRef.current;
      if (!video) return;

      isReceivingUpdate.current = true;

      if (data.type === 'play') {
        video.currentTime = data.time;
        video.play();
      } else if (data.type === 'pause') {
        video.currentTime = data.time;
        video.pause();
      } else if (data.type === 'seek') {
        video.currentTime = data.time;
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    });

    channel.bind('chat-message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, `${data.user}: ${data.text}`]);
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
    }
  };

  const handlePlay = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    triggerEvent('video-event', {
      type: 'play',
      time: videoRef.current.currentTime,
    });
  };

  const handlePause = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    triggerEvent('video-event', {
      type: 'pause',
      time: videoRef.current.currentTime,
    });
  };

  const handleSeeked = () => {
    if (isReceivingUpdate.current || !videoRef.current) return;
    triggerEvent('video-event', {
      type: 'seek',
      time: videoRef.current.currentTime,
    });
  };

  const sendChat = () => {
    if (!chatInput.trim() || !username.trim()) return;
    triggerEvent('chat-message', {
      user: username,
      text: chatInput,
    });
    setMessages((prev) => [...prev, `${username}: ${chatInput}`]);
    setChatInput('');
  };

  return (
    <div>
      <h1>Watch2Together - Room: {room}</h1>
      
      <div>
        <label>Username: </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label>Load Video: </label>
        <input type="file" accept="video/*" onChange={handleFileChange} />
      </div>

      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          controls
          width="640"
          height="360"
          onPlay={handlePlay}
          onPause={handlePause}
          onSeeked={handleSeeked}
        />
      )}

      <div>
        <h2>Chat</h2>
        <div>
          {messages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message"
          onKeyPress={(e) => e.key === 'Enter' && sendChat()}
        />
        <button onClick={sendChat}>Send</button>
      </div>
    </div>
  );
}
