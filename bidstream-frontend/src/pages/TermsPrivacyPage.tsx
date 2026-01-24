import React from 'react';

interface TermsPrivacyPageProps {
  type: 'terms' | 'privacy' | 'how-it-works';
}

const TermsPrivacyPage: React.FC<TermsPrivacyPageProps> = ({ type }) => {
  const content = {
    'terms': {
      title: 'Terms of Service',
      description: 'By accessing and placing bids on BidStream, you agree to these comprehensive terms of service governing real-time auction interactions and escrow protocols.',
      sections: [
        {
          title: '1. Live Bidding & Commitments',
          text: 'All bids placed through the BidStream interface are legally binding. Our WebSocket infrastructure ensures that bids are processed sequentially, and retracting a bid after it has been acknowledged by the server is strictly prohibited.'
        },
        {
          title: '2. Escrow & Payments',
          text: 'Winning bidders must transfer 100% of the funds to our cryptographic multi-signature escrow within 48 hours. Funds are released to the seller only upon the buyer\'s physical receipt and successful condition inspection.'
        },
        {
          title: '3. Asset Authenticity',
          text: 'Sellers are required to upload verifiable provenance documents. While our AI Auctioneer fact-checks these documents, BidStream acts as a neutral venue. The ultimate responsibility for verifying the physical asset remains with the buyer during the inspection window.'
        }
      ]
    },
    'privacy': {
      title: 'Privacy Policy',
      description: 'Your privacy and data security are paramount. Learn how BidStream handles your personal information, bidding history, and encrypted communications.',
      sections: [
        {
          title: '1. Information Collection',
          text: 'We collect necessary information to facilitate secure auctions, including identity verification data, payment details, and real-time interaction logs (bidding history and chat questions) during live events.'
        },
        {
          title: '2. Use of AI and Chat Logs',
          text: 'Questions asked to our AI Auctioneer are logged for quality assurance and model fine-tuning. Personally identifiable information is scrubbed from these logs before they are processed by our internal machine learning pipelines.'
        },
        {
          title: '3. Data Sharing',
          text: 'We do not sell your personal data. Escrow-related data is shared exclusively with our licensed financial partners to execute the multi-signature transaction releases.'
        }
      ]
    },
    'how-it-works': {
      title: 'How BidStream Works',
      description: 'A transparent, secure, and exhilarating platform designed for the highest-tier of digital live auctions.',
      sections: [
        {
          title: '1. Pre-Auction Verification',
          text: 'Sellers list items and upload provenance documents. Our system indexes these documents using advanced AI (RAG) to prepare the AI Auctioneer to answer any bidder questions accurately.'
        },
        {
          title: '2. The Live Event',
          text: 'When the auction goes live, buyers enter the real-time WebSocket room. Bids are processed with sub-second latency. The AI Auctioneer dynamically updates users with facts, remaining time, and outbid alerts.'
        },
        {
          title: '3. Escrow & Delivery',
          text: 'Upon winning, the buyer secures funds in our institutional escrow. The seller ships the item. Once the buyer verifies the condition against the AI-certified documents, funds are released to the seller.'
        }
      ]
    }
  };

  const currentContent = content[type];

  return (
    <div className="w-full bg-slate-950 text-slate-200 min-h-screen pt-20 pb-20 transition-colors duration-300">
      
      {/* Header */}
      <section className="text-center mb-12 px-6 pt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-white transition-colors">
          {currentContent.title}
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto transition-colors">
          {currentContent.description}
        </p>
      </section>

      {/* Content Sections */}
      <section className="container mx-auto px-6 lg:px-20 max-w-4xl">
        <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-2xl shadow-xl space-y-10">
          
          {currentContent.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-xl font-bold text-white transition-colors">
                {section.title}
              </h3>
              <p className="text-slate-400 leading-relaxed transition-colors">
                {section.text}
              </p>
            </div>
          ))}

        </div>
      </section>
      
    </div>
  );
};

export default TermsPrivacyPage;
