import React, { useState, useEffect, useRef } from 'react';
import { wsService } from '../api/stompClient';
import ReactMarkdown from 'react-markdown';

interface LiveAuctionChatbotProps {
  auctionId: string;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
}

const LiveAuctionChatbot: React.FC<LiveAuctionChatbotProps> = ({ auctionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { axiosClient } = await import('../api/axiosClient');
        const res = await axiosClient.get(`/auctions/${auctionId}/chat`);
        const data = res.data;
        
        if (data && data.length > 0) {
          const loadedMessages = data.map((msg: any) => ({
            id: msg.id || Date.now().toString() + Math.random(),
            sender: msg.role === 'ASSISTANT' ? 'AI' : 'USER',
            text: msg.content
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([
            { id: '0', sender: 'AI', text: 'Hello! I am your AI Auctioneer. Ask me anything about this item.' }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        setMessages([
          { id: '0', sender: 'AI', text: 'Hello! I am your AI Auctioneer. Ask me anything about this item.' }
        ]);
      }
    };
    
    fetchHistory();

    const subscription = wsService.subscribe(`/topic/auction/${auctionId}/assistant`, (data: any) => {
      setIsTyping(false);
      
      if (data.status === 'SUCCESS') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'AI',
          text: data.response
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'AI',
          text: 'Oops! I encountered an error answering that. Please try again.'
        }]);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [auctionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'USER',
      text: inputValue
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');

    wsService.send(`/app/auction/${auctionId}/ask`, {
      question: userMsg.text,
      userId: 101 // Hardcoded for demo, normally from JWT/auth state
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl flex flex-col mt-4" style={{ height: '350px' }}>
      <div className="p-3 border-b border-slate-700 bg-slate-900/50 rounded-t-xl flex items-center space-x-2">
        <span className="text-xl">🤖</span>
        <h3 className="text-white font-bold">AI Auction Assistant</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-3 text-sm prose prose-sm prose-invert ${
              msg.sender === 'USER' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg rounded-bl-none p-3 flex space-x-2 items-center">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-700 bg-slate-900/50 rounded-b-xl flex space-x-2">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about the item..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          disabled={isTyping}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isTyping}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default LiveAuctionChatbot;
