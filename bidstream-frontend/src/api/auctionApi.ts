import { axiosClient } from './axiosClient';
import { Item } from './itemApi';

export interface Auction {
  id: number;
  itemId: string;
  sellerId: number;
  startingPrice: number;
  currentBid: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  item?: Item;
}

export interface CreateAuctionData {
  itemId: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
}

export const auctionApi = {
  getSellerAuctions: async (): Promise<Auction[]> => {
    const response = await axiosClient.get<any>('/auctions');
    return response.data.content;
  },

  getActiveAuctions: async (): Promise<Auction[]> => {
    const response = await axiosClient.get<any>('/public/auctions/active');
    return response.data.content;
  },
  
  createAuction: async (data: CreateAuctionData): Promise<Auction> => {
    const response = await axiosClient.post<Auction>('/auctions', data);
    return response.data;
  },

  getAuctionDetails: async (id: number): Promise<Auction> => {
    const response = await axiosClient.get<Auction>(`/auctions/${id}`);
    return response.data;
  },

  searchActiveAuctions: async (query: string, category?: string): Promise<Auction[]> => {
    const response = await axiosClient.get<any>('/public/auctions/search', {
      params: { query, category }
    });
    return response.data.content;
  }
};
