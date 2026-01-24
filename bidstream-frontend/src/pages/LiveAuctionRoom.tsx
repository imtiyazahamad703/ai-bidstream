import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BidHistory from '../components/BidHistory';
import BidPlacementForm from '../components/BidPlacementForm';
import LiveAuctionChatbot from '../components/LiveAuctionChatbot';
import { CountdownTimer } from '../components/CountdownTimer';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import SellerChatMonitor from '../components/SellerChatMonitor';
import QuickDocumentUpload from '../components/QuickDocumentUpload';
import { wsService } from '../api/stompClient';
import { auctionApi } from '../api/auctionApi';
import { itemApi } from '../api/itemApi';
import { Bid, Auction, Item, OutbidNotification } from '../types/auction';
import { useAuthStore } from '../store/useAuthStore';
import { Gavel, Eye, FileText, ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type NotificationType = 'INFO' | 'OUTBID' | 'WARNING';
interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

const LiveAuctionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const token = localStorage.getItem('auth_token');
  
  const [isConnected, setIsConnected] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [auctionStatus, setAuctionStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  useEffect(() => {
    const loadAuctionData = async () => {
      if (!id) return;
      try {
        const auctionData = await auctionApi.getAuctionDetails(Number(id));
        setAuction(auctionData as Auction);
        setAuctionStatus(auctionData.status as any);
        
        if (auctionData.itemId) {
          try {
            const itemData = await itemApi.getPublicItemDetails(auctionData.itemId);
            setItem(itemData as unknown as Item);
          } catch (itemError) {
            console.warn(`Item ${auctionData.itemId} not found in database.`);
          }
        }
        
        // Load initial bid history
        try {
          const { bidApi } = await import('../api/bidApi');
          const history = await bidApi.getBidHistory(Number(id));
          if (history && history.length > 0) {
             setBids(history);
          }
        } catch (bidErr) {
          console.error("Failed to load bid history", bidErr);
        }
      } catch (error) {
        console.error("Failed to load auction data", error);
      }
    };
    loadAuctionData();
  }, [id]);

  useEffect(() => {
    if (token && id) {
      wsService.connect(token);
      setIsConnected(true);

      const eventSub = wsService.subscribe(`/topic/auction.${id}`, (message) => {
        if (message.type === 'BID_PLACED') {
          const newBid: Bid = {
            id: Date.now(), // Temporary ID until fetched
            auctionId: Number(id),
            bidderEmail: message.payload.bidderEmail || message.payload.bidder,
            amount: message.payload.amount,
            createdAt: message.payload.timestamp,
            status: 'ACCEPTED',
            trackingId: message.payload.trackingId
          };
          
          setBids(prev => {
            // Prevent duplicates if same message arrives
            if (prev.some(b => b.amount === newBid.amount && b.bidderEmail === newBid.bidderEmail)) return prev;
            return [newBid, ...prev];
          });
          
          if (newBid.bidderEmail !== user?.email) {
             setNotifications(prev => [{
               id: Date.now().toString(),
               type: 'INFO',
               message: `New bid of $${newBid.amount.toLocaleString()} placed`,
               timestamp: new Date().toISOString()
             }, ...prev].slice(0, 5));
          }
        } else if (message.type === 'AUCTION_ENDED') {
          setAuctionStatus('COMPLETED');
          setNotifications(prev => [{
            id: Date.now().toString(),
            type: 'INFO',
            message: `Auction Ended! Winner: ${message.payload.winner}`,
            timestamp: new Date().toISOString()
          }, ...prev].slice(0, 5));
        }
      });

      const participantSub = wsService.subscribe(`/topic/auctions/${id}/participants`, (message) => {
        if (message.type === 'COUNT_UPDATE') {
          setParticipantsCount(message.payload.count || Math.floor(Math.random() * 50) + 10);
        }
      });

      const notificationSub = wsService.subscribe(`/user/queue/notifications`, (message) => {
        setNotifications(prev => [{
          id: Date.now().toString(),
          message: message.message || message.content,
          type: message.type || 'INFO',
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 5));
      });

      // Simulation for demo if backend doesn't send count
      const simInterval = setInterval(() => {
        setParticipantsCount(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
      }, 5000);

      return () => {
        eventSub?.unsubscribe();
        participantSub?.unsubscribe();
        notificationSub?.unsubscribe();
        clearInterval(simInterval);
      };
    }
  }, [token, id, user?.email]);

  const currentBid = bids.length > 0 ? bids[0].amount : (auction?.currentBid || auction?.startingPrice || 0);
  const isWinning = bids.length > 0 && bids[0].bidderEmail === user?.email;
  const isSeller = user?.email === auction?.sellerEmail;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-6rem)]">
      {/* Navigation Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/auctions" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Live Rings</span>
        </Link>
        
        {!isConnected && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reconnecting to stream...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)] min-h-[800px]">
        
        {/* Left Column (Main Image & Bid Form) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          
          {/* Main Visual Arena */}
          <div className="relative flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Overlay Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-rose-600/90 backdrop-blur-md text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE RING
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 shadow-lg">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{participantsCount} Watching</span>
                </div>
              </div>
              
              <div className="pointer-events-auto">
                {auction?.endTime && auctionStatus === 'ACTIVE' && (
                  <CountdownTimer endTime={auction.endTime} onExpire={() => setAuctionStatus('COMPLETED')} />
                )}
              </div>
            </div>

            {/* Image Stream */}
            <div className="flex-1 w-full h-full bg-slate-950 flex items-center justify-center p-12">
              {item?.imageData ? (
                <img 
                  src={item.imageData} 
                  alt={item.title} 
                  className="max-w-full max-h-full object-contain drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-700 animate-pulse">
                  <Gavel className="w-24 h-24 mb-4" />
                  <span className="font-mono text-sm uppercase tracking-widest">Awaiting Visual Stream</span>
                </div>
              )}
            </div>

            {/* Auction Ended Overlay */}
            <AnimatePresence>
              {auctionStatus === 'COMPLETED' && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                  className="absolute inset-0 z-20 bg-slate-950/80 flex flex-col items-center justify-center p-8 text-center"
                >
                  {isWinning ? (
                    <motion.div 
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                      </div>
                      <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                        Lot Won!
                      </h2>
                      <p className="text-slate-300 text-lg">
                        You are the winning bidder at <strong className="text-white">${currentBid.toLocaleString()}</strong>.
                      </p>
                      <button className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">
                        Proceed to Escrow Checkout
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-4"
                    >
                      <Gavel className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                      <h2 className="text-4xl font-extrabold text-white">Auction Closed</h2>
                      <div className="px-6 py-4 rounded-xl bg-slate-900 border border-slate-800 inline-block">
                        <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Final Hammer Price</p>
                        <p className="text-indigo-400 text-3xl font-bold font-mono">${currentBid.toLocaleString()}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info & Bidding Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-8">
            {/* Item Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-white mb-2">{item?.title || `Item #${id}`}</h1>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {item?.description || 'No description available for this lot.'}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsDocsModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Provenance Docs</span>
                </button>
              </div>
            </div>

            {/* Bidding Form */}
            <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 md:pl-8 pt-6 md:pt-0">
              <BidPlacementForm
                currentBid={currentBid}
                onPlaceBid={async (amount) => {
                  try {
                    const { bidApi } = await import('../api/bidApi');
                    await bidApi.placeBid(Number(id), amount);
                  } catch (error: any) {
                    throw error;
                  }
                }}
                disabled={auctionStatus === 'COMPLETED'}
              />
            </div>
          </div>
        </div>

        {/* Right Column (History & Chatbot/Monitor) */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          
          {/* Bid History Widget */}
          <div className="flex-[4] min-h-0">
            <BidHistory bids={bids} />
          </div>

          {/* AI Chatbot or Seller Monitor Widget */}
          <div className="flex-[6] min-h-0 flex flex-col gap-4">
            {isSeller ? (
              <>
                <div className="flex-1 min-h-0">
                  {id && <SellerChatMonitor auctionId={id} />}
                </div>
                {item?.id && id && (
                  <div className="shrink-0">
                    <QuickDocumentUpload itemId={item.id} auctionId={Number(id)} />
                  </div>
                )}
              </>
            ) : (
              id && <LiveAuctionChatbot auctionId={id} />
            )}
          </div>

        </div>
      </div>

      <DocumentViewerModal 
        isOpen={isDocsModalOpen} 
        onClose={() => setIsDocsModalOpen(false)} 
        documents={item?.documents}
      />
    </div>
  );
};

export default LiveAuctionRoom;
