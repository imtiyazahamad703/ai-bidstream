import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws/auction';

class WebSocketService {
  private client: Client;
  private connected: boolean = false;
  
  constructor() {
    this.client = new Client({
      // We use webSocketFactory because SockJS is required for spring boot websocket fallback
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log('Connected to WebSocket server');
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      console.log('WebSocket connection closed');
    };
  }

  connect(token?: string) {
    if (this.connected) return;
    
    if (token) {
      this.client.connectHeaders = {
        Authorization: `Bearer ${token}`
      };
    }
    
    this.client.activate();
  }

  disconnect() {
    if (!this.connected) return;
    this.client.deactivate();
  }

  subscribe(destination: string, callback: (message: any) => void) {
    if (!this.connected) {
      console.warn('Cannot subscribe, not connected to WebSocket');
      return null;
    }
    
    return this.client.subscribe(destination, (message) => {
      if (message.body) {
        callback(JSON.parse(message.body));
      }
    });
  }

  send(destination: string, body: any) {
    if (!this.connected) {
      console.error('Cannot send message, not connected to WebSocket');
      return;
    }
    
    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }
}

// Export a singleton instance
export const wsService = new WebSocketService();
