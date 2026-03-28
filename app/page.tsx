"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const USERS: any = {
  user1: "9fK!2mX#7qL@pZ",
  user2: "3Qa$8vN!5rT@wY"
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [reels, setReels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [chat, setChat] = useState("");

  const login = () => {
    if (USERS[username] === password) setUser(username);
    else alert("wrong login");
  };

  const getEmbed = (url: string) => {
    try {
      const id = url.split("/reel/")[1].split("/")[0];
      return `https://www.instagram.com/reel/${id}/embed`;
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    const { data: r } = await supabase.from("reels").select("*").order("created_at", { ascending: false });
    const { data: m } = await supabase.from("messages").select("*").order("created_at");
    setReels(r || []);
    setMessages(m || []);
  };

  useEffect(() => {
    if (user) loadData();
    const i = setInterval(loadData, 3000);
    return () => clearInterval(i);
  }, [user]);

  const addReel = async () => {
    await supabase.from("reels").insert({ url: input, user_name: user });
    setInput("");
  };

  const sendMsg = async () => {
    await supabase.from("messages").insert({ message: chat, user_name: user });
    setChat("");
  };

  const clearBoard = async () => {
    if (!confirm("Clear everything?")) return;
    await supabase.from("reels").delete().neq("id", "");
    await supabase.from("messages").delete().neq("id", "");
    loadData();
  };

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Login</h2>
        <input placeholder="user" onChange={e => setUsername(e.target.value)} />
        <input placeholder="pass" type="password" onChange={e => setPassword(e.target.value)} />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 10 }}>
      <h3>Logged in as {user}</h3>

      <button onClick={clearBoard}>Clear Board</button>

      <h2>Add Reel</h2>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addReel}>Add</button>

      <h2>Reels</h2>
      {reels.map(r => (
        <div key={r.id}>
          <p>{r.user_name}</p>
          <iframe src={getEmbed(r.url)} width="100%" height="400" />
        </div>
      ))}

      <h2>Chat</h2>
      <div style={{ height: 200, overflow: "auto" }}>
        {messages.map(m => (
          <p key={m.id}><b>{m.user_name}:</b> {m.message}</p>
        ))}
      </div>

      <input value={chat} onChange={e => setChat(e.target.value)} />
      <button onClick={sendMsg}>Send</button>
    </div>
  );
}
