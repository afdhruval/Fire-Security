import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { messagesApi } from '../services/api';
import { formatTime } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';

const Chat = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const loadMessages = async () => {
    if (!token) return;
    try {
      const { messages: msgs } = await messagesApi.list(token);
      setMessages(msgs || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadMessages(); }, [token]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;
    try {
      await messagesApi.send(token, { senderName: user.name, message: newMessage });
      setNewMessage('');
      await loadMessages();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] lg:h-screen p-6 lg:p-10">
      <div className="h-full bg-white border border-secondary-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="h-18 flex items-center justify-between border-b border-secondary-200 px-6 flex-shrink-0">
          <h3 className="text-lg font-bold">Team Chat</h3>
          <span className="text-sm text-secondary-500">{messages.length} messages</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(msg => (
            <div key={msg.id || msg._id} className={`flex ${msg.senderName === user.name ? 'justify-end' : ''}`}>
              <div className={`max-w-[70%] rounded-2xl p-4 ${msg.senderName === user.name ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white' : 'bg-secondary-100'}`}>
                {msg.senderName !== user.name && <p className="text-xs font-bold mb-1 opacity-80">{msg.senderName}</p>}
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-60 mt-2">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="h-20 border-t border-secondary-200 px-6 flex items-center gap-3 flex-shrink-0">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 h-12 bg-secondary-50 border-0 rounded-xl text-sm px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          <button type="submit" className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition"><Send size={20} /></button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
