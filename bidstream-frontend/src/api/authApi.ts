import { axiosClient } from './axiosClient';
import { User } from '../store/useAuthStore';

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string; // the backend expects this field name in the DTO
  role: 'BIDDER' | 'SELLER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  register: async (data: RegistrationData): Promise<User> => {
    const response = await axiosClient.post<User>('/auth/register', data);
    return response.data;
  },
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  resetPassword: async (data: any): Promise<{message: string}> => {
    const response = await axiosClient.post<{message: string}>('/auth/reset-password', data);
    return response.data;
  },
  getUserProfile: async (): Promise<User> => {
    const response = await axiosClient.get<User>('/users/me');
    return response.data;
  }
};
