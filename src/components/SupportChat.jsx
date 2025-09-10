import React, { useState, useEffect } from 'react';
// Pollinations.AI integration
const POLLINATIONS_API_URL = 'https://text.pollinations.ai';

export default function SupportChat({ occupation, dreamJob, initialMessages }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages && initialMessages.length > 0
    ? initialMessages
    : [{ sender: 'bot', text: `Hi! Your current occupation is ${occupation}. Do you want to see intermediary jobs to reach your dream job (${dreamJob})?` }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset messages when initialMessages changes (for async data)
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setLoading(true);

    // If user asks for intermediary jobs, call Pollinations.AI
  // Trigger AI feedback if user says 'yes' or asks for pathway/intermediary jobs
  const askJobs = /^(yes|y)$/i.test(input.trim()) || /intermediary jobs|recommend|pathway|shortest/i.test(input);
  if (askJobs) {
      try {
        const prompt = `You are a career pathway assistant. Given a current occupation (${occupation}) and a dream job (${dreamJob}), suggest the shortest pathway to reach the dream job. List the intermediary jobs in order, and for each, explain briefly why it is a necessary step.`;
  const res = await fetch(`${POLLINATIONS_API_URL}/${encodeURIComponent(prompt)}`);
        const answer = await res.text();
        // Format response for clarity (simple bullet points if possible)
        let formatted = answer;
        if (answer.includes('\n')) {
          formatted = answer.split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => `• ${line}`).join('\n');
        }
        setMessages(msgs => [...msgs, { sender: 'bot', text: formatted }]);
      } catch {
        setMessages(msgs => [...msgs, { sender: 'bot', text: 'Error fetching recommendations.' }]);
      }
      setLoading(false);
      setInput('');
      return;
    }
    // Default response for other messages
    setTimeout(() => {
      setMessages(msgs => [...msgs, { sender: 'bot', text: 'Here are some recommended intermediary jobs: ...' }]);
      setLoading(false);
    }, 1200);
    setInput('');
  };

  return (
    <>
      {/* Floating button with label */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: '#15803d',
            color: '#fff',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: 'none',
            fontSize: '2rem',
            cursor: 'pointer'
          }}
          aria-label="Open Support Chat"
        >
          💬
        </button>
      </div>
      {/* Chat modal */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '5rem',
          right: '2rem',
          zIndex: 1001,
          width: '350px',
          maxHeight: '500px',
          background: '#fff',
          borderRadius: '1rem',
          boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#15803d', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
            SkillBridge Support
            <button onClick={() => setOpen(false)} style={{ float: 'right', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
          </div>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f8fafc' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '0.8rem', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                <span style={{
                  display: 'inline-block',
                  background: msg.sender === 'user' ? '#d1fae5' : '#fff',
                  color: '#222',
                  borderRadius: '1rem',
                  padding: '0.5rem 1rem',
                  maxWidth: '80%',
                  fontSize: '0.98rem',
                  boxShadow: msg.sender === 'user' ? '0 1px 4px rgba(21,128,61,0.08)' : '0 1px 4px rgba(0,0,0,0.05)'
                }}>{msg.text}</span>
              </div>
            ))}
            {loading && <div style={{ textAlign: 'center', color: '#15803d' }}>Thinking...</div>}
          </div>
          <div style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{ width: '75%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginRight: '0.5rem' }}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 'bold', cursor: 'pointer' }}
              disabled={loading}
            >Send</button>
          </div>
        </div>
      )}
    </>
  );
}
