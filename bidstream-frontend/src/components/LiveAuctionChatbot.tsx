import React, { useState, useEffect, useRef } from 'react';
import { wsService } from '../api/stompClient';
import { axiosClient } from '../api/axiosClient';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Send, FileText, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types/auction';
import { useAuthStore } from '../store/useAuthStore';

interface LiveAuctionChatbotProps {
  auctionId: string | number;
}

const LiveAuctionChatbot: React.FC<LiveAuctionChatbotProps> = ({ auctionId }) => {
  const { user } = useAuthStore();
  const userId = user?.id || 101; // Default to 101 if not logged in
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosClient.get(`/auctions/${auctionId}/chat?userId=${userId}`);
        const data = res.data;
        
        if (data && data.length > 0) {
          const loadedMessages = data.map((msg: any) => ({
            id: msg.id || Date.now().toString() + Math.random(),
            sender: msg.role === 'ASSISTANT' ? 'AI' : 'USER',
            text: msg.content,
            timestamp: msg.timestamp || new Date().toISOString()
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([
            { id: '0', sender: 'AI', text: 'Hello! I am your AI Auctioneer. Ask me anything about this item.', timestamp: new Date().toISOString() }
          ]);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
        setMessages([
          { id: '0', sender: 'AI', text: 'Hello! I am your AI Auctioneer. Ask me anything about this item.', timestamp: new Date().toISOString() }
        ]);
      }
    };
    
    fetchHistory();

    const subscription = wsService.subscribe(`/topic/auction/${auctionId}/assistant/${userId}`, (data: any) => {
      setIsTyping(false);
      
      if (data.status === 'SUCCESS') {
        setMessages(prev => [...prev, {
          id: data.id || Date.now().toString(),
          sender: 'AI',
          text: data.response || data.text,
          timestamp: new Date().toISOString(),
          sourceDocuments: data.sourceDocuments
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'AI',
          text: 'Oops! I encountered an error answering that. Please try again.',
          timestamp: new Date().toISOString()
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
      text: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInputValue('');

    // Send question to backend
    wsService.send(`/app/auction/${auctionId}/ask`, {
      question: userMsg.text,
      userId: userId,
      userEmail: user?.email
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg border border-indigo-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              AI Auctioneer
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Gemini RAG Assistant</p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5 custom-scrollbar bg-slate-900/40">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser 
                    ? 'bg-slate-800 border-slate-700 text-slate-400' 
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 text-sm ${
                    isUser 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl rounded-tl-sm shadow-md'
                  }`}>
                    {isUser ? (
                      msg.text
                    ) : (
                      <div className="chatbot-markdown-content leading-relaxed text-[13px]">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {/* Source Documents */}
                  {!isUser && msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.sourceDocuments.map((doc, i) => (
                        <div key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[9px] text-indigo-300 font-mono">
                          <FileText className="w-2.5 h-2.5" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[9px] text-slate-500 font-mono mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 flex-row"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm flex gap-1.5 items-center w-16">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about provenance, condition..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            disabled={isTyping}
          />
          <button 
            type="submit" 
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LiveAuctionChatbot;
