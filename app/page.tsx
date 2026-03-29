"use client";

import { useState, useEffect } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ------------------ Supabase setup (client-only) ------------------
const SUPABASE_URL = "https://astuejjjoggcpxtkiivm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdHVlampqb2dnY3B4dGtpaXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzUzMzYsImV4cCI6MjA5MDMxMTMzNn0.jxYTomV0QwuLTTAI8K1x4hbdPP884ARuMa8QAfiTxCk";

// ------------------ Hardcoded users ------------------
const USERS = [
  { username: "user1", password: "ComplexPassword1!" },
  { username: "user2", password: "ComplexPassword2!" }
];

// ------------------ Helper function ------------------
function isValidUser(username: string, password: string) {
  return USERS.some((u) => u.username === username && u.password === password);
}

// ------------------ Component ------------------
export default function ReelsChatApp() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [reels, setReels] = useState<string[]>([]);
  const [newReelUrl, setNewReelUrl] = useState("");
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // ------------------ Initialize Supabase client on client-side ------------------
  useEffect(() => {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setSupabase(supabaseClient);
  }, []);

  // ------------------ Load data from Supabase ------------------
  useEffect(() => {
    if (!supabase) return;

    async function loadData() {
      const { data: reelData } = await supabase.from("reels").select("*");
      setReels(reelData?.map((r: any) => r.url) || []);

      const { data: chatData } = await supabase.from("chat").select("*");
      setMessages(chatData || []);
    }
    loadData();
  }, [supabase]);

  // ------------------ Submit new reel ------------------
  const handleAddReel = async () => {
    if (!newReelUrl || !supabase) return;
    setReels((prev) => [...prev, newReelUrl]);
    await supabase.from("reels").insert([{ url: newReelUrl }]);
    setNewReelUrl("");
  };

  // ------------------ Send chat message ------------------
  const handleSendMessage = async () => {
    if (!newMessage || !loggedInUser || !supabase) return;
    const msgObj = { user: loggedInUser, text: newMessage };
    setMessages((prev) => [...prev, msgObj]);
    await supabase.from("chat").insert([msgObj]);
    setNewMessage("");
  };

  // ------------------ Clear board ------------------
  const handleClearBoard = async () => {
    if (!supabase) return;
    setReels([]);
    setMessages([]);
    await supabase.from("reels").delete().neq("id", 0);
    await supabase.from("chat").delete().neq("id", 0);
  };

  // ------------------ Daily auto-reset ------------------
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const timer = setTimeout(() => {
      handleClearBoard();
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, [reels, messages]);

  // ------------------ Login form ------------------
  if (!loggedInUser) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
        <h2>Login</h2>
        <input
          placeholder="Username"
          value={loginForm.username}
          onChange={(e) =>
            setLoginForm({ ...loginForm, username: e.target.value })
          }
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <input
          placeholder="Password"
          type="password"
          value={loginForm.password}
          onChange={(e) =>
            setLoginForm({ ...loginForm, password: e.target.value })
          }
          style={{ display: "block", marginBottom: 10, width: "100%" }}
        />
        <button
          onClick={() => {
            if (isValidUser(loginForm.username, loginForm.password)) {
              setLoggedInUser(loginForm.username);
            } else {
              alert("Invalid credentials");
            }
          }}
        >
          Login
        </button>
      </div>
    );
  }

  // ------------------ Main App ------------------
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Welcome, {loggedInUser}</h1>

      <button onClick={handleClearBoard} style={{ marginBottom: 20 }}>
        Clear Board
      </button>

      <h2>Share an Instagram Reel</h2>
      <input
        placeholder="Paste Reel URL"
        value={newReelUrl}
        onChange={(e) => setNewReelUrl(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <button onClick={handleAddReel}>Add Reel</button>

      <div style={{ marginTop: 20 }}>
        <h3>Reels Board</h3>
        {reels.map((url, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <iframe
              src={url.replace(
                "https://www.instagram.com",
                "https://www.instagram.com/embed"
              )}
              width="320"
              height="480"
              allowFullScreen
              style={{ border: "none" }}
            ></iframe>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Chat</h3>
        <div
          style={{
            border: "1px solid #ccc",
            padding: 10,
            maxHeight: 200,
            overflowY: "auto",
            marginBottom: 10
          }}
        >
          {messages.map((m, i) => (
            <div key={i}>
              <strong>{m.user}:</strong> {m.text}
            </div>
          ))}
        </div>
        <input
          placeholder="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
