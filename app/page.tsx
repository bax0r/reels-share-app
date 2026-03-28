"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const USERS = [
  { username: "user1", password: "ComplexPass1!" },
  { username: "user2", password: "ComplexPass2!" }
];

export default function HomePage() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [reels, setReels] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ user: string; text: string }[]>([]);

  // Daily reset at midnight
  useEffect(() => {
    const now = new Date();
    const millisUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const timeout = setTimeout(() => {
      setReels([]);
      setChat([]);
    }, millisUntilMidnight);
    return () => clearTimeout(timeout);
  }, [reels, chat]);

  const handleLogin = () => {
    const user = USERS.find(u => u.username === loginUser && u.password === loginPass);
    if (user) setLoggedInUser(user.username);
    else alert("Invalid credentials");
  };

  const handleAddReel = () => {
    if (!message) return;
    setReels(prev => [...prev, message]);
    setMessage("");
  };

  const handleSendChat = () => {
    if (!message || !loggedInUser) return;
    setChat(prev => [...prev, { user: loggedInUser, text: message }]);
    setMessage("");
  };

  const handleClearBoard = () => {
    setReels([]);
    setChat([]);
  };

  if (!loggedInUser)
    return (
      <div style={{ padding: 20 }}>
        <h1>Login</h1>
        <input
          placeholder="Username"
          value={loginUser}
          onChange={e => setLoginUser(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={loginPass}
          onChange={e => setLoginPass(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {loggedInUser}</h1>

      <div>
        <h2>Share Reel</h2>
        <input
          placeholder="Instagram Reel URL"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={handleAddReel}>Add Reel</button>
      </div>

      <div>
        <h2>Reels Board</h2>
        {reels.map((url, i) => (
          <iframe
            key={i}
            src={url}
            width="320"
            height="480"
            style={{ margin: "10px 0" }}
            allow="autoplay; encrypted-media"
          />
        ))}
      </div>

      <div>
        <h2>Chat</h2>
        {chat.map((c, i) => (
          <div key={i}>
            <b>{c.user}: </b>
            {c.text}
          </div>
        ))}
        <input
          placeholder="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={handleSendChat}>Send</button>
      </div>

      <div>
        <button onClick={handleClearBoard}>Clear Board</button>
      </div>
    </div>
  );
}
