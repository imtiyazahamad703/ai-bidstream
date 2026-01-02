import { axiosClient } from './axiosClient';

export interface Bid {
  id: number;
  auctionId: number;
  bidderEmail: string;
  amount: number;
  createdAt: string;
  status?: string;
  trackingId?: string;
}

export const bidApi = {
  getHighestBid: async (auctionId: number): Promise<number> => {
    const response = await axiosClient.get<number>(`/auctions/${auctionId}/bids/highest`);
    return response.data;
  },
  
  getBidHistory: async (auctionId: number): Promise<Bid[]> => {
    const response = await axiosClient.get<any>(`/auctions/${auctionId}/bids`);
    return response.data.content;
  },
  
  placeBid: async (auctionId: number, amount: number): Promise<Bid> => {
    const response = await axiosClient.post<Bid>(`/auctions/${auctionId}/bids`, { amount });
    return response.data;
  }
};
