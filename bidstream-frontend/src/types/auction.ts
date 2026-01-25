export interface Item {
  id: string;
  sellerId?: number;
  sellerEmail?: string;
  name?: string;
  title?: string;
  description: string;
  category?: string;
  startingPrice: number;
  condition?: string;
  imageData?: string;
  imageBase64?: string;
  images?: string[];
  documents?: {
    id: number;
    fileName: string;
    fileSize: string;
    uploadDate: string;
    summary: string;
    contentExcerpt: string;
  }[];
  documentTexts?: string[];
  attributes?: Record<string, any>;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  auctionId?: number;
}

export interface Auction {
  id: number;
  itemId: string;
  sellerId: number;
  sellerName?: string;
  sellerRating?: number;
  sellerAvatar?: string;
  startingPrice: number;
  currentBid: number;
  currentHighestBid?: number; // for compatibility with reference
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string; // ISO 8601 Date
  endTime: string;   // ISO 8601 Date
  item?: Item;
  featured?: boolean;
  totalBidsCount?: number;
  activeViewers?: number;
}

export interface Bid {
  id: number;
  auctionId: number;
  bidderEmail: string;
  bidderName?: string;
  amount: number;
  createdAt: string; // ISO 8601 Date
  status?: string;
  trackingId?: string;
  isCurrentUser?: boolean;
}

export interface AuctionEvent {
  auctionId: number;
  type: 'BID_PLACED' | 'AUCTION_STARTED' | 'AUCTION_ENDED' | 'OUTBID';
  payload: {
    amount?: number;
    bidder?: string;
    bidderEmail?: string;
    bidderName?: string;
    timestamp?: string;
    winner?: string;
    finalAmount?: number;
    [key: string]: any;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  senderName?: string;
  userEmail?: string;
  userId?: number | string;
  text: string;
  timestamp: string; // ISO 8601 Date
  sourceDocuments?: string[];
  status?: 'SUCCESS' | 'ERROR' | 'THINKING';
}

export interface OutbidNotification {
  id: string;
  auctionId: number;
  auctionTitle: string;
  newAmount: number;
  previousBid: number;
  timestamp: string;
  message: string;
}

export interface UserProfile {
  token?: string;
  email: string;
  role: 'BIDDER' | 'SELLER';
  firstName?: string;
  lastName?: string;
  balance?: number;
  avatarUrl?: string;
  isLoggedIn?: boolean;
}
