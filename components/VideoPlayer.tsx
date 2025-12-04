'use client';

import { useEffect, useRef, useState } from 'react';

interface WSMessage {
  room: string;
  type: 'play' | 'pause' | 'seek' | 'chat';
  time?: number;
  text?: string;
  user?: string;
}

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
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

    const ws = new WebSocket('ws://localhost:8000');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      const video = videoRef.current;
      if (!video) return;

      isReceivingUpdate.current = true;

      if (message.type === 'play' && message.time !== undefined) {
        video.currentTime = message.time;
        video.play();
      } else if (message.type === 'pause' && message.time !== undefined) {
        video.currentTime = message.time;
        video.pause();
      } else if (message.type === 'seek' && message.time !== undefined) {
        video.currentTime = message.time;
      } else if (message.type === 'chat' && message.text && message.user) {
        setMessages((prev) => [...prev, `${message.user}: ${message.text}`]);
      }

      setTimeout(() => {
        isReceivingUpdate.current = false;
      }, 100);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  const handlePlay = () => {
    if (isReceivingUpdate.current || !wsRef.current || !videoRef.current) return;
    const message: WSMessage = {
      room,
      type: 'play',
      time: videoRef.current.currentTime,
    };
    wsRef.current.send(JSON.stringify(message));
  };

  const handlePause = () => {
    if (isReceivingUpdate.current || !wsRef.current || !videoRef.current) return;
    const message: WSMessage = {
      room,
      type: 'pause',
      time: videoRef.current.currentTime,
    };
    wsRef.current.send(JSON.stringify(message));
  };

  const handleSeeked = () => {
    if (isReceivingUpdate.current || !wsRef.current || !videoRef.current) return;
    const message: WSMessage = {
      room,
      type: 'seek',
      time: videoRef.current.currentTime,
    };
    wsRef.current.send(JSON.stringify(message));
  };

  const sendChat = () => {
    if (!chatInput.trim() || !username.trim() || !wsRef.current) return;
    const message: WSMessage = {
      room,
      type: 'chat',
      text: chatInput,
      user: username,
    };
    wsRef.current.send(JSON.stringify(message));
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
