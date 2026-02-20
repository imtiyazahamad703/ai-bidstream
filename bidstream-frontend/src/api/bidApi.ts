import { axiosClient } from './axiosClient';

export interface Bid {
  id: number;
  auctionId: number;
  bidderId: number;
  amount: number;
  timestamp: string;
}

export const bidApi = {
  getHighestBid: async (auctionId: number): Promise<number> => {
    const response = await axiosClient.get<number>(`/auctions/${auctionId}/bids/highest`);
    return response.data;
  },
  
  getBidHistory: async (auctionId: number): Promise<Bid[]> => {
    const response = await axiosClient.get<any>(`/auctions/${auctionId}/bids`);
    return response.data.content;
  }
};
