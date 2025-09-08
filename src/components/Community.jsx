import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Community({ userId }) {
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!userId) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .single();
      setUserProfile(data);
    }
    fetchProfile();
  }, [userId]);

  // Ensure General channel exists, fetch its info
  useEffect(() => {
    async function ensureGeneralChannel() {
      setLoading(true);
      let { data: channels, error: fetchError } = await supabase
        .from('community_channels')
        .select('*')
        .eq('name', 'General')
        .order('created_at', { ascending: true })
        .limit(1);
      if (fetchError) console.error('Error fetching General channel:', fetchError);
      let channelData = channels && channels.length > 0 ? channels[0] : null;
      if (!channelData) {
        const { data: newChannel, error: insertError } = await supabase
          .from('community_channels')
          .insert({
            name: 'General',
            description: 'Open space for everyone',
            channel_type: 'general'
          })
          .select('*')
          .single();
        if (insertError) console.error('Error creating General channel:', insertError);
        channelData = newChannel;
      }
      setChannel(channelData);
      setLoading(false);
    }
    ensureGeneralChannel();
  }, []);

  // Fetch messages and subscribe to realtime updates
  useEffect(() => {
    if (!channel) return;
    let subscription;
    async function fetchMessages() {
      const { data: msgs } = await supabase
        .from('community_messages')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
    }
    fetchMessages();
    // Realtime subscription
    subscription = supabase
      .channel('community_messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'community_messages', filter: `channel_id=eq.${channel.id}` },
        payload => {
          fetchMessages();
        }
      )
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [channel]);

  // Send message
  async function sendMessage() {
    if (!input.trim() || !channel || !userId) return;
    setSending(true);
    await supabase
      .from('community_messages')
      .insert({
        channel_id: channel.id,
        user_id: userId,
        content: input.trim()
      });
    setInput('');
    setSending(false);
    // Fetch messages immediately after sending
    if (channel) {
      const { data: msgs } = await supabase
        .from('community_messages')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true });
      setMessages(msgs || []);
    }
  }

  if (loading || !channel) return <div className="py-8 text-center text-gray-500">Loading Community...</div>;

  return (
  <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow p-8" style={{ minHeight: '90vh' }}>
      <div className="mb-4 border-b pb-2 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-green-700"># General</div>
          <div className="text-sm text-gray-500">Open space for everyone</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mb-4 px-2">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No messages yet. Start the conversation!</div>
        ) : (
          messages.map(msg => {
            const isMine = msg.user_id === userId;
            return (
              <div key={msg.id} className={`flex items-end gap-3 mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && (
                  <img src={msg.user_profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_profiles?.full_name || 'User')}&background=10b981&color=fff`} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <div className={`max-w-[60%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`font-semibold ${isMine ? 'text-green-700' : 'text-gray-700'} text-sm mb-1`}>{isMine ? 'You' : (msg.user_profiles?.full_name || 'User')}</div>
                  <div className={`px-4 py-2 rounded-2xl text-base font-medium ${isMine ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'} shadow-sm mb-1`}>
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                {isMine && (
                  <img src={msg.user_profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_profiles?.full_name || 'You')}&background=10b981&color=fff`} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2 mt-auto pt-2">
        <input
          type="text"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          disabled={sending}
        />
        <button
          className="px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 text-base"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
        >Send</button>
      </div>
    </div>
  );
}
