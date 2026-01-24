import React, { useState, useEffect, useRef } from 'react';
import { wsService } from '../api/stompClient';
import { axiosClient } from '../api/axiosClient';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types/auction';

interface SellerChatMonitorProps {
  auctionId: string | number;
}

const SellerChatMonitor: React.FC<SellerChatMonitorProps> = ({ auctionId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllHistory = async () => {
      try {
        const res = await axiosClient.get(`/auctions/${auctionId}/chat/all`);
        const data = res.data;
        
        if (data && data.length > 0) {
          const loadedMessages = data.map((msg: any) => ({
            id: msg.id || Date.now().toString() + Math.random(),
            sender: msg.role === 'ASSISTANT' ? 'AI' : 'USER',
            text: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            userId: msg.userId,
            userEmail: msg.userEmail // Keep track of which user asked
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([
            { id: '0', sender: 'AI', text: 'Waiting for bidders to ask questions...', timestamp: new Date().toISOString() }
          ]);
        }
      } catch (err: any) {
        console.error("Failed to load chat history", err);
        setError("Could not load monitor history.");
      }
    };
    
    fetchAllHistory();

    const subscription = wsService.subscribe(`/topic/auction/${auctionId}/assistant/monitor`, (data: any) => {
      // Add user question if it's in the payload
      if (data.question) {
         setMessages(prev => [...prev, {
            id: Date.now().toString() + '-q',
            sender: 'USER',
            text: data.question,
            timestamp: new Date().toISOString(),
            userId: data.userId,
            userEmail: data.userEmail
         }]);
      }
      
      if (data.status === 'SUCCESS') {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-a',
          sender: 'AI',
          text: data.response || data.text,
          timestamp: new Date().toISOString(),
          userId: data.userId,
          userEmail: data.userEmail,
          sourceDocuments: data.sourceDocuments
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-a',
          sender: 'AI',
          text: `[Error generating response for User ${data.userId}]`,
          timestamp: new Date().toISOString(),
          userId: data.userId,
          userEmail: data.userEmail
        }]);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [auctionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-2xl flex flex-col h-full shadow-2xl shadow-indigo-500/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-indigo-500/30 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 text-indigo-400">
              <Eye className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 animate-pulse rounded-full border-2 border-slate-950"></div>
          </div>
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              Live Monitor Console
            </h3>
            <p className="text-[10px] text-indigo-400 font-mono">Intercepting all bidder queries</p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/80">
        {error && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'USER';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row'}`} // Always left aligned in monitor
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-1 ${
                  isUser 
                    ? 'bg-slate-800 border-slate-700 text-slate-400' 
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase ${isUser ? 'text-slate-400' : 'text-indigo-400'}`}>
                          {isUser ? (msg.userEmail ? msg.userEmail.split('@')[0] : `User ${msg.userId || 'Unknown'}`) : 'AI Assistant'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                  </div>

                  <div className={`px-4 py-3 text-sm rounded-xl border ${
                    isUser 
                      ? 'bg-slate-800/50 border-slate-700 text-slate-200' 
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100'
                  }`}>
                    {isUser ? (
                      msg.text
                    ) : (
                      <div className="chatbot-markdown-content leading-relaxed text-[13px]">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default SellerChatMonitor;
// Dummy Eye component since it wasn't imported from lucide-react in the file
const Eye = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
