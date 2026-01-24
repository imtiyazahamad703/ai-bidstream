import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gavel, 
  Bot, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [actualAuctions, setActualAuctions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRealAuctions = async () => {
      try {
        const { auctionApi } = await import('../api/auctionApi');
        const { itemApi } = await import('../api/itemApi');
        const data = await auctionApi.getActiveAuctions();
        
        if (data && data.length > 0) {
          // Fetch up to 5 items
          const auctionsWithItems = await Promise.all(
            data.slice(0, 5).map(async (auction: any) => {
              try {
                const item = await itemApi.getPublicItemDetails(auction.itemId);
                return { ...auction, item };
              } catch {
                return auction;
              }
            })
          );
          setActualAuctions(auctionsWithItems);
        }
      } catch (err) {
        console.error("Failed to fetch real auctions for landing page", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRealAuctions();
  }, []);

  // Use actual auctions. If empty, it will just show the Explore More slide.
  const displayAuctions = actualAuctions.map(a => ({
    id: a.id,
    title: a.item?.title || `Item #${a.itemId.substring(0,8)}`,
    itemCode: `Item #${a.itemId.substring(0,8)}`,
    description: a.item?.description || "Live auction happening right now. Place your bids!",
    price: `$${(a.currentHighestBid || a.currentBid || a.startingPrice || 0).toLocaleString()}`,
    image: a.item?.imageData || null
  }));

  const handleExploreLiveAuctions = () => {
    navigate('/auctions');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  const handleSellerDashboard = () => {
    navigate('/seller/dashboard');
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-12 space-y-12 min-h-[calc(100vh-64px)] flex flex-col justify-start">
      {/* Hero Headline & Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start lg:pt-6">
        {/* Left Column: Clear, Professional Headline & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REAL-TIME LIVE AUCTION PLATFORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Institutional Live Bidding,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300">
              Verified by AI Provenance.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            BidStream delivers low-latency live auction rings for luxury watches, rare automobiles, and fine art. Ask questions directly to our AI Auctioneer backed by authentic inspection documents.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={handleExploreLiveAuctions}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Gavel className="w-4 h-4" />
              <span>Browse Live Auctions</span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </button>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignIn}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-colors"
              >
                Sign In / Register
              </button>
            ) : (
              user?.role === 'SELLER' && (
                <button
                  type="button"
                  onClick={handleSellerDashboard}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition-colors flex items-center gap-2"
                >
                  <span>Seller Dashboard</span>
                </button>
              )
            )}
          </div>


        </div>

        {/* Right Column: Sleek Featured Live Auction Preview Carousel */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 shadow-2xl hover:border-slate-700 transition-all duration-300 relative group h-[420px] sm:h-[480px] lg:h-[500px] flex flex-col">
            
            {currentSlide < displayAuctions.length ? (
              // Regular Auction Slide
              <div className="flex flex-col h-full space-y-4 animate-fade-in">
                <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden bg-slate-950">
                  {displayAuctions[currentSlide].image ? (
                    <img
                      key={displayAuctions[currentSlide].image}
                      src={displayAuctions[currentSlide].image}
                      alt={displayAuctions[currentSlide].title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/50">
                      <Gavel className="w-12 h-12 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white font-mono text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      LIVE RING
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-600/20">
                      {displayAuctions[currentSlide].price}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 px-1 shrink-0 h-20 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white truncate pr-2">{displayAuctions[currentSlide].title}</h3>
                    <span className="text-xs text-slate-400 font-mono shrink-0">{displayAuctions[currentSlide].itemCode}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {displayAuctions[currentSlide].description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (actualAuctions.length > 0) {
                      navigate(`/auctions/${displayAuctions[currentSlide].id}`);
                    } else {
                      handleExploreLiveAuctions();
                    }
                  }}
                  className="shrink-0 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Gavel className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Enter Live Auction Room</span>
                </button>
              </div>
            ) : (
              // Explore More Slide
              <div className="flex flex-col items-center justify-center flex-1 w-full h-full px-6 text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Search className="w-10 h-10 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Explore More</h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Sign in to discover 100+ active institutional live auctions happening right now.
                  </p>
                </div>
                <button
                  onClick={handleSignIn}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <span>Sign In & Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Navigation Arrows */}
            <button 
              onClick={() => setCurrentSlide((prev) => (prev === 0 ? displayAuctions.length : prev - 1))}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev === displayAuctions.length ? 0 : prev + 1))}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {[...Array(displayAuctions.length + 1)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${currentSlide === i ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* 3 Simple Value Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">Real-Time Live Bidding</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Experience sub-second WebSocket feeds that guarantee instant bid execution, zero latency, and robust anti-sniping protection. Compete fairly in high-stakes auction rings.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">AI Provenance Fact-Checking</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Our integrated AI Auctioneer instantly analyzes and verifies uploaded certificates of authenticity, comprehensive condition reports, and historical service logs in real-time.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:bg-slate-900 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">Institutional-Grade Escrow</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your capital is fiercely protected. 100% of winning auction funds are secured in a cryptographic multi-sig escrow vault until the physical asset is thoroughly inspected and delivered.
          </p>
        </div>
      </div>
    </section>
  );
};
