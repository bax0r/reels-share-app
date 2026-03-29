"use client";
import { useState } from "react";

export default function HomePage() {
  const [msg, setMsg] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Deployment</h1>
      <input
        placeholder="Type something"
        value={msg}
        onChange={e => setMsg(e.target.value)}
      />
      <p>You typed: {msg}</p>
    </div>
  );
}
