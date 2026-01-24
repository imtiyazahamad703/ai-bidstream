import { axiosClient } from './axiosClient';

export interface Item {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  sellerEmail: string;
  createdAt: string;
  status: 'AVAILABLE' | 'IN_AUCTION' | 'SOLD';
  attributes?: Record<string, any>;
  auctionId?: number;
  imageData?: string;
  // Convenience getter for UI that uses "title"
  title?: string;
  condition?: string;
}

export interface CreateItemData {
  title: string;
  description: string;
  startingPrice: number;
  condition: string;
  attributes?: Record<string, string>;
  imageData?: string;
}

export const itemApi = {
  getSellerItems: async (): Promise<Item[]> => {
    const response = await axiosClient.get<any>('/items');
    const items = response.data.content as Item[];
    // Map backend `name` to `title` for UI compatibility
    return items.map((item: Item) => ({ ...item, title: item.name }));
  },
  
  createItem: async (data: CreateItemData): Promise<Item> => {
    // Backend expects `name`, frontend uses `title`
    const payload = {
      name: data.title,
      description: data.description,
      startingPrice: data.startingPrice,
      attributes: { ...data.attributes, condition: data.condition },
      imageData: data.imageData
    };
    const response = await axiosClient.post<Item>('/items', payload);
    return { ...response.data, title: response.data.name };
  },

  getItemDetails: async (id: string): Promise<Item> => {
    const response = await axiosClient.get<Item>(`/items/${id}`);
    return { ...response.data, title: response.data.name };
  },

  getPublicItemDetails: async (id: string): Promise<Item> => {
    const response = await axiosClient.get<Item>(`/public/items/${id}`);
    return { ...response.data, title: response.data.name };
  },
  
  deleteItem: async (id: string): Promise<void> => {
    await axiosClient.delete(`/items/${id}`);
  },

  uploadItemImage: async (id: string, imageData: string): Promise<Item> => {
    const response = await axiosClient.patch<Item>(`/items/${id}/image`, { imageData });
    return { ...response.data, title: response.data.name };
  },

  uploadItemDocuments: async (id: string, files: File[]): Promise<{ message: string; processedFiles: string[]; totalDocuments: number }> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await axiosClient.post(`/items/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
