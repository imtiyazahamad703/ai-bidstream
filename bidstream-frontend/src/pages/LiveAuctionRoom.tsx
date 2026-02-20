import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BidHistory from '../components/BidHistory';
import ParticipantInfo from '../components/ParticipantInfo';
import NotificationCenter from '../components/NotificationCenter';
import BidPlacementForm from '../components/BidPlacementForm';
import { wsService } from '../api/stompClient';

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

  const [bids, setBids] = useState(mockBids);
  const [participants, _setParticipants] = useState(mockParticipants);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [auctionStatus, _setAuctionStatus] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  useEffect(() => {
    if (token) {
      wsService.connect(token);
      setIsConnected(true);

      const bidSub = wsService.subscribe(`/topic/auctions/${id}/bids`, (message) => {
        setBids(prev => {
          // If the new bid is higher and from someone else, trigger outbid warning
          if (prev.length > 0 && message.bidderId !== 101 /* Assuming current user is 101 */) {
            setNotifications(n => [{
              id: Date.now().toString(),
              message: `You have been outbid! New highest bid is $${message.amount}`,
              type: 'OUTBID',
              timestamp: new Date().toISOString()
            }, ...n]);
          }
          return [message, ...prev];
        });
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
        bidSub?.unsubscribe();
        participantSub?.unsubscribe();
        notificationSub?.unsubscribe();
        wsService.disconnect();
        setIsConnected(false);
      };
    }
  }, [token, id]);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-6rem)] relative">
      {!isConnected && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-2 rounded-b-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <span>⚠️</span>
          <span className="font-medium text-sm">Connection lost. Attempting to reconnect...</span>
        </div>
      )}
      <div className="lg:col-span-3 flex flex-col space-y-4">
        {/* Main View Area */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
            <h1 className="text-2xl font-bold text-white">Live Auction #{id}</h1>
            <div className="flex items-center space-x-6">
              <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-600">
                <span className="text-slate-400 text-sm font-medium mr-2">Time Remaining:</span>
                <span className="text-white font-mono text-xl">00:14:59</span>
              </div>
              <div className="bg-indigo-500/20 px-4 py-2 rounded-lg border border-indigo-500/30">
                <span className="text-indigo-300 text-sm font-medium mr-2">Current Highest Bid:</span>
                <span className="text-indigo-400 font-bold text-xl">
                  ${bids.length > 0 ? bids[0].amount.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-semibold text-sm">LIVE</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 relative overflow-hidden">
            <span className="text-slate-500">Product Image Stream</span>
            {auctionStatus === 'COMPLETED' && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in">
                {bids.length > 0 && bids[0].bidderId === 101 ? (
                  <div className="flex flex-col items-center animate-bounce">
                    <span className="text-6xl mb-4">🏆</span>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">You Won!</h2>
                    <p className="text-xl text-slate-200">Winning Bid: ${bids[0].amount.toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Auction Ended</h2>
                    <p className="text-slate-300">
                      Winner: Bidder #{bids.length > 0 ? bids[0].bidderId : 'N/A'}
                      at ${bids.length > 0 ? bids[0].amount.toFixed(2) : '0.00'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 flex flex-col space-y-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <BidPlacementForm
            currentBid={bids.length > 0 ? bids[0].amount : 0}
            onPlaceBid={(amount) => {
              wsService.send(`/app/auctions/${id}/bid`, { amount, bidderId: 101 });
            }}
            disabled={auctionStatus === 'COMPLETED'}
          />
        </div>
        <div className="flex-1 min-h-[300px]">
          {/* Bid Stream Panel */}
          <BidHistory bids={bids} />
        </div>
        <ParticipantInfo participants={participants} />
      </div>

      <NotificationCenter notifications={notifications} />
    </div>
  );
};

export default LiveAuctionRoom;
