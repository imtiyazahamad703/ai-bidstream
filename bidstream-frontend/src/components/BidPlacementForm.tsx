import React, { useState, useEffect } from 'react';
import { Gavel } from 'lucide-react';
import { motion, useAnimation } from 'motion/react';

interface BidPlacementFormProps {
  currentBid: number;
  onPlaceBid: (amount: number) => void;
  disabled?: boolean;
}

const BidPlacementForm: React.FC<BidPlacementFormProps> = ({ currentBid, onPlaceBid, disabled }) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    // Reset form when currentBid updates externally
    setBidAmount('');
    setError(null);
  }, [currentBid]);

  const validateBid = (amount: number) => {
    if (isNaN(amount)) return 'Please enter a valid amount.';
    if (amount <= currentBid) return `Bid must be greater than current price ($${currentBid.toLocaleString()})`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(bidAmount.replace(/,/g, ''));
    const validationError = validateBid(amount);
    
    if (validationError) {
      setError(validationError);
      setIsSuccess(false);
      controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });
      return;
    }

    setError(null);
    setIsSuccess(true);
    
    try {
      await onPlaceBid(amount);
      setBidAmount('');
      // Reset success state after animation
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      setError('Failed to place bid. Please try again.');
      setIsSuccess(false);
    }
  };

  const handleQuickBid = (increment: number) => {
    const newAmount = currentBid + increment;
    setBidAmount(newAmount.toString());
    setError(null);
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-800"
      animate={controls}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Maximum Bid</label>
        <span className="text-[10px] text-slate-500 font-mono">Min: ${(currentBid + 1).toLocaleString()}</span>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium flex items-start gap-2"
        >
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </motion.div>
      )}

      {isSuccess && !error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2 justify-center"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Processing via Kafka...
        </motion.div>
      )}

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-slate-400 text-lg font-bold group-focus-within:text-indigo-400 transition-colors">$</span>
        </div>
        <input
          type="text"
          value={bidAmount}
          onChange={(e) => {
            // Allow numbers and one decimal point
            const val = e.target.value.replace(/[^0-9.]/g, '');
            if (val.split('.').length > 2) return;
            setBidAmount(val);
            setError(null);
          }}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xl font-bold font-mono transition-all shadow-inner"
          placeholder={`${(currentBid + 500).toLocaleString()}`}
          disabled={disabled || isSuccess}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[500, 1000, 5000].map(inc => (
          <button
            key={inc}
            type="button"
            disabled={disabled || isSuccess}
            onClick={() => handleQuickBid(inc)}
            className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono transition-colors border border-slate-700 disabled:opacity-50"
          >
            +${inc.toLocaleString()}
          </button>
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={disabled || isSuccess}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className={`w-full rounded-xl px-4 py-4 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
          isSuccess 
            ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none'
        }`}
      >
        <Gavel className={`w-5 h-5 ${isSuccess ? 'animate-bounce' : ''}`} />
        <span>{isSuccess ? 'Bid Accepted' : 'Confirm Bid'}</span>
      </motion.button>
    </motion.form>
  );
};

export default BidPlacementForm;
