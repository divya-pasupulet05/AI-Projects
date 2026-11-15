import { useEffect, useRef, useState } from "react";
import { Bot, Plus, Send, Trash2, MessageSquare, Sparkles, Menu, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  async function refreshConversations() {
    try {
      const res = await fetch(`${API}/api/conversations`);
      if (!res.ok) throw new Error("Could not load conversations");
      setConversations(await res.json());
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { refreshConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function openConversation(id) {
    setActiveId(id);
    setError("");
    try {
      const res = await fetch(`${API}/api/conversations/${id}/messages`);
      if (!res.ok) throw new Error("Could not load chat");
      setMessages(await res.json());
    } catch (e) { setError(e.message); }
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  async function deleteConversation(e, id) {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`${API}/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (activeId === id) newChat();
      await refreshConversations();
    } catch (err) { setError(err.message); }
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    setMessages(prev => [...prev, { role: "user", content: text, localId: Date.now() }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: activeId, message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setActiveId(data.conversation_id);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, localId: Date.now() + 1 }]);
      await refreshConversations();
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: "assistant", content: "I couldn't complete that request. Please check the server/API configuration and try again.", localId: Date.now() + 2 }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="brand"><div className="brand-icon"><Sparkles size={20}/></div><span>nova<span className="brand-light">.ai</span></span></div>
        <button className="new-chat" onClick={newChat}><Plus size={18}/> New chat</button>
        <div className="side-label">YOUR CHATS</div>
        <div className="conversation-list">
          {conversations.map(c => <button key={c.id} className={`conversation ${activeId === c.id ? "selected" : ""}`} onClick={() => openConversation(c.id)}>
            <MessageSquare size={16}/><span>{c.title}</span><Trash2 className="delete-icon" size={15} onClick={e => deleteConversation(e, c.id)}/>
          </button>)}
          {!conversations.length && <p className="empty-history">Your conversations will appear here.</p>}
        </div>
        <div className="sidebar-footer"><div className="avatar">N</div><div><strong>Nova Assistant</strong><small>AI Chat Workspace</small></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <X/> : <Menu/>}</button>
          <div><div className="top-title">Conversational AI</div><div className="status"><span/> Online</div></div>
          <button className="top-new" onClick={newChat}><Plus size={16}/> New chat</button>
        </header>

        <section className="chat-area">
          {messages.length === 0 ? <div className="welcome">
            <div className="welcome-icon"><Bot size={34}/></div>
            <p className="eyebrow">YOUR AI ASSISTANT</p>
            <h1>How can I help<br/><span>you today?</span></h1>
            <p className="welcome-copy">Ask a question, explore an idea, or get help with a task. I'm here to help.</p>
            <div className="suggestions">
              {["Explain microservices with an example", "Help me prepare for a Java interview", "Write a Python function to sort a list"].map(s =>
                <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}<span>↗</span></button>)}
            </div>
          </div> : <div className="messages">
            {messages.map((m, i) => <div className={`message-row ${m.role}`} key={m.id || m.localId || i}>
              <div className={`message-avatar ${m.role}`}>{m.role === "assistant" ? <Bot size={18}/> : "You"}</div>
              <div className="message-content"><div className="message-name">{m.role === "assistant" ? "Nova" : "You"}</div><div className="bubble">{m.content}</div></div>
            </div>)}
            {loading && <div className="message-row assistant"><div className="message-avatar assistant"><Bot size={18}/></div><div className="message-content"><div className="message-name">Nova</div><div className="bubble typing"><i/><i/><i/></div></div></div>}
            <div ref={bottomRef}/>
          </div>}
        </section>

        {error && <div className="error-banner">{error}</div>}
        <form className="composer-wrap" onSubmit={sendMessage}>
          <div className="composer">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Message Nova..." rows={1}/>
            <button className="send-button" type="submit" disabled={!input.trim() || loading}><Send size={18}/></button>
          </div>
          <p className="disclaimer">Nova can make mistakes. Verify important information. Press Enter to send · Shift + Enter for a new line.</p>
        </form>
      </main>
    </div>
  );
}
