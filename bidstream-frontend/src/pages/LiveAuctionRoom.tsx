import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BidHistory from '../components/BidHistory';
import ParticipantInfo from '../components/ParticipantInfo';
import NotificationCenter from '../components/NotificationCenter';
import BidPlacementForm from '../components/BidPlacementForm';
import { wsService } from '../api/stompClient';
import { auctionApi, Auction } from '../api/auctionApi';
import { itemApi, Item } from '../api/itemApi';
import { Bid } from '../api/bidApi';
import LiveAuctionChatbot from '../components/LiveAuctionChatbot';

const mockBids = [
  { id: 1, auctionId: 1, bidderId: 101, amount: 250.00, timestamp: new Date().toISOString() },
  { id: 2, auctionId: 1, bidderId: 102, amount: 200.00, timestamp: new Date(Date.now() - 10000).toISOString() }
];

type NotificationType = 'INFO' | 'OUTBID' | 'WARNING';
interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  { id: '1', message: 'Auction Started!', type: 'INFO', timestamp: new Date().toISOString() }
];

const mockParticipants = [
  { id: 101, username: 'bidder1', isOnline: true },
  { id: 102, username: 'bidder2', isOnline: false },
  { id: 103, username: 'bidder3', isOnline: true }
];

const LiveAuctionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = localStorage.getItem('auth_token');
  const [isConnected, setIsConnected] = useState(false);

  const [bids, setBids] = useState<Bid[]>([]);
  const [participants, _setParticipants] = useState(mockParticipants);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [auctionStatus, setAuctionStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');

  useEffect(() => {
    const loadAuctionData = async () => {
      if (!id) return;
      try {
        const auctionData = await auctionApi.getAuctionDetails(Number(id));
        setAuction(auctionData);
        setAuctionStatus(auctionData.status as any);
        if (auctionData.itemId) {
          try {
            const itemData = await itemApi.getPublicItemDetails(auctionData.itemId);
            setItem(itemData);
          } catch (itemError) {
            console.warn(`Item ${auctionData.itemId} not found in database. Using placeholder.`);
            setItem(null);
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
    if (!auction?.endTime || auctionStatus === 'COMPLETED') return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return '00:00:00';
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction?.endTime, auctionStatus]);

  useEffect(() => {
    if (token) {
      wsService.connect(token);
      setIsConnected(true);

      // Subscribe to live auction events
      const eventSub = wsService.subscribe(`/topic/auction.${id}`, (message) => {
        if (message.type === 'BID_PLACED') {
          const newBid: Bid = {
            id: Date.now(),
            auctionId: Number(id),
            bidderEmail: message.payload.bidder,
            amount: message.payload.amount,
            createdAt: message.payload.timestamp,
            status: 'ACCEPTED'
          };
          setBids(prev => [newBid, ...prev]);
          
          if (newBid.bidderEmail !== localStorage.getItem('user_email')) {
             setNotifications(prev => [{
               id: Date.now().toString(),
               type: 'INFO',
               message: `New bid of $${newBid.amount.toFixed(2)} placed by ${newBid.bidderEmail.split('@')[0]}`,
               timestamp: new Date().toISOString()
             }, ...prev]);
          }
        } else if (message.type === 'AUCTION_ENDED') {
          setAuctionStatus('COMPLETED');
          setNotifications(prev => [{
            id: Date.now().toString(),
            type: 'INFO',
            message: `Auction Ended! Winner: ${message.payload.winner}`,
            timestamp: new Date().toISOString()
          }, ...prev]);
        }
      });

      const participantSub = wsService.subscribe(`/topic/auctions/${id}/participants`, (message) => {
        if (message.type === 'JOIN' || message.type === 'LEAVE') {
          // Handle participant updates
        }
      });

      const notificationSub = wsService.subscribe(`/user/queue/notifications`, (message) => {
        setNotifications(prev => [{
          id: Date.now().toString(),
          message: message.content,
          type: message.type || 'INFO',
          timestamp: new Date().toISOString()
        }, ...prev]);
      });

      return () => {
        eventSub?.unsubscribe();
        participantSub?.unsubscribe();
        notificationSub?.unsubscribe();
      };
    }
  }, [token, id]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      {!isConnected && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <span>⚠️</span>
          <span className="font-medium text-sm">Connection lost. Attempting to reconnect...</span>
        </div>
      )}

      {/* Left Pane: Image & Core Info */}
      <div className="flex-[3] flex flex-col bg-slate-800 border border-slate-700 rounded-xl overflow-hidden relative shadow-2xl">
        {/* Header Bar */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white mb-1">
              {item?.title || `Live Auction #${id}`}
            </h1>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-slate-400">Item #{id}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <span className="text-slate-400">{participants.length} Viewing</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-600 shadow-inner">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-bold block mb-0.5">Time Remaining</span>
              <span className="text-white font-mono text-xl leading-none">{auctionStatus === 'COMPLETED' ? '00:00:00' : timeLeft}</span>
            </div>
            <div className="bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/30 shadow-inner">
              <span className="text-indigo-300 text-xs uppercase tracking-wider font-bold block mb-0.5">Highest Bid</span>
              <span className="text-indigo-400 font-bold text-xl leading-none">
                ${bids.length > 0 ? bids[0].amount.toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-center bg-red-500/10 border border-red-500/30 h-12 w-24 rounded-lg">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-bold tracking-widest text-sm">LIVE</span>
            </div>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 bg-slate-900/80 flex items-center justify-center relative p-8">
          {item?.imageData ? (
            <img 
              src={item.imageData} 
              alt={item.title} 
              className="max-w-full max-h-[60vh] object-contain drop-shadow-2xl rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span>Product Image Stream</span>
            </div>
          )}
          
          {auctionStatus === 'COMPLETED' && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-fade-in">
              {bids.length > 0 && bids[0].bidderId === 101 ? (
                <div className="flex flex-col items-center animate-bounce">
                  <span className="text-8xl mb-6 drop-shadow-lg">🏆</span>
                  <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-2 drop-shadow-sm">You Won!</h2>
                  <p className="text-2xl text-yellow-100 font-medium bg-black/30 px-6 py-2 rounded-full mt-4 border border-yellow-500/30">
                    Winning Bid: ${bids[0].amount.toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-6xl mb-4 opacity-80">🏁</span>
                  <h2 className="text-4xl font-bold text-white mb-2">Auction Ended</h2>
                  <div className="bg-slate-800/80 px-6 py-3 rounded-lg border border-slate-700 mt-4 text-center">
                    <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Winning Bidder</p>
                    <p className="text-white text-xl font-medium">#{bids.length > 0 ? bids[0].bidderId : 'N/A'}</p>
                    <p className="text-indigo-400 font-bold text-2xl mt-2">${bids.length > 0 ? bids[0].amount.toFixed(2) : '0.00'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Interactive Tools */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        
        {/* Bidding Section */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col shadow-lg overflow-hidden min-h-[400px]">
          <div className="p-4 bg-slate-900/40 border-b border-slate-700">
            <h3 className="text-white font-bold flex items-center">
              <span className="mr-2">💰</span> Bidding Arena
            </h3>
          </div>
          
          <div className="p-4 border-b border-slate-700 bg-slate-800/80">
            <BidPlacementForm
              currentBid={bids.length > 0 ? bids[0].amount : (auction?.currentBid || auction?.startingPrice || 0)}
              onPlaceBid={async (amount) => {
                try {
                  const { bidApi } = await import('../api/bidApi');
                  await bidApi.placeBid(Number(id), amount);
                  // Optimistically add notification or just wait for WS
                  setNotifications(prev => [{
                    id: Date.now().toString(),
                    type: 'INFO',
                    message: 'Bid placed successfully! Processing...',
                    timestamp: new Date().toISOString()
                  }, ...prev]);
                } catch (error: any) {
                  console.error("Failed to place bid", error);
                  setNotifications(prev => [{
                    id: Date.now().toString(),
                    type: 'WARNING',
                    message: error.response?.data?.message || 'Failed to place bid. Please try again.',
                    timestamp: new Date().toISOString()
                  }, ...prev]);
                }
              }}
              disabled={auctionStatus === 'COMPLETED'}
            />
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col relative">
            <div className="absolute inset-0 overflow-y-auto no-scrollbar">
              <BidHistory bids={bids} />
            </div>
          </div>
        </div>

        {/* AI Chatbot Section */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden shrink-0">
          {/* We wrap the chatbot in a container that removes its default top margin so it sits flush */}
          <div className="-mt-4"> 
            {id && <LiveAuctionChatbot auctionId={id} />}
          </div>
        </div>

      </div>

      <NotificationCenter notifications={notifications} />
    </div>
  );
};

export default LiveAuctionRoom;
