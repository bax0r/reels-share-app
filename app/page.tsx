"use client";

import { useState, useEffect, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------- Supabase client ----------------
const SUPABASE_URL = "https://astuejjjoggcpxtkiivm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdHVlampqb2dnY3B4dGtpaXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MzUzMzYsImV4cCI6MjA5MDMxMTMzNn0.jxYTomV0QwuLTTAI8K1x4hbdPP884ARuMa8QAfiTxCk";

// ---------------- Hardcoded users ----------------
const USERS = [
  { username: "user1", password: "ComplexPassword1!" },
  { username: "user2", password: "ComplexPassword2!" },
];

function isValidUser(username: string, password: string) {
  return USERS.some((u) => u.username === username && u.password === password);
}

function extractReelId(url: string) {
  const match = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function ReelsChatBoard() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [reels, setReels] = useState<string[]>([]);
  const [newReelUrl, setNewReelUrl] = useState("");
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ---------------- Initialize Supabase ----------------
  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setSupabase(client);
  }, []);

  // ---------------- Load data + realtime subscriptions ----------------
  useEffect(() => {
    if (!supabase) return;

    async function loadData() {
      const { data: reelData } = await supabase.from("reels").select("*");
      setReels(reelData?.map((r: any) => r.url) || []);

      const { data: chatData } = await supabase.from("chat").select("*");
      setMessages(chatData || []);
    }

    loadData();

    // --- Realtime reels subscription ---
    const reelChannel = supabase
      .channel("reels-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reels" },
        (payload) => setReels((prev) => [...prev, payload.new.url])
      )
      .subscribe();

// --- Realtime chat subscription ---
const chatChannel = supabase
  .channel("chat-channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "chat" },
    (payload) =>
      setMessages((prev) => [
        ...prev,
        payload.new as { user: string; text: string },
      ])
  )
  .subscribe();

    return () => {
      supabase.removeChannel(reelChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [supabase]);

  // ---------------- Add reel ----------------
  const handleAddReel = async () => {
    if (!newReelUrl || !supabase) return;
    await supabase.from("reels").insert([{ url: newReelUrl }]);
    setNewReelUrl("");
  };

  // ---------------- Send message ----------------
  const handleSendMessage = async () => {
    if (!newMessage || !loggedInUser || !supabase) return;
    await supabase.from("chat").insert([{ user: loggedInUser, text: newMessage }]);
    setNewMessage("");
  };

  // ---------------- Clear board ----------------
  const handleClearBoard = async () => {
    if (!supabase) return;
    await supabase.from("reels").delete().neq("id", 0);
    await supabase.from("chat").delete().neq("id", 0);
    setReels([]);
    setMessages([]);
  };

  // ---------------- Daily reset ----------------
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
      now.getTime();
    const timer = setTimeout(() => handleClearBoard(), msUntilMidnight);
    return () => clearTimeout(timer);
  }, [reels, messages]);

  // ---------------- Auto-scroll chat ----------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- Login ----------------
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
          style={{ width: "100%", padding: "8px 0" }}
        >
          Login
        </button>
      </div>
    );
  }

  // ---------------- Main Sticky Board ----------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 600,
        margin: "0 auto",
        padding: 10,
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 18 }}>Welcome, {loggedInUser}</h1>
        <button onClick={handleClearBoard} style={{ padding: "4px 8px" }}>
          Clear Board
        </button>
      </div>

      {/* Reels input */}
      <div style={{ display: "flex", gap: 5 }}>
        <input
          placeholder="Paste Reel URL"
          value={newReelUrl}
          onChange={(e) => setNewReelUrl(e.target.value)}
          style={{ flex: 1, padding: 6 }}
        />
        <button onClick={handleAddReel} style={{ padding: "6px 10px" }}>
          Add
        </button>
      </div>

      {/* Reels board */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 6,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 6,
        }}
      >
        {reels.map((url, i) => {
          const reelId = extractReelId(url);
          const thumbUrl = reelId
            ? `https://instagram.com/p/${reelId}/media/?size=l`
            : "";
          return (
            <div
              key={i}
              style={{
                border: "1px solid #aaa",
                borderRadius: 6,
                overflow: "hidden",
                textAlign: "center",
                background: "#fff",
              }}
            >
              {thumbUrl ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={thumbUrl}
                    alt="Reel"
                    style={{ width: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      padding: 2,
                      color: "#555",
                      background: "#f0f0f0",
                    }}
                  >
                    View on Instagram
                  </div>
                </a>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Open Reel
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Chat section (sticky) */}
      <div
        style={{
          borderTop: "1px solid #ccc",
          paddingTop: 4,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            maxHeight: 150,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 4,
            background: "#fafafa",
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 2, fontSize: 12 }}>
              <strong>{m.user}:</strong> {m.text}
            </div>
          ))}
          <div ref={chatEndRef}></div>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          <input
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ flex: 1, padding: 6 }}
          />
          <button onClick={handleSendMessage} style={{ padding: "6px 10px" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
