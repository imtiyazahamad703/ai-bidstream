import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws/auction';

class WebSocketService {
  private client: Client;
  private connected: boolean = false;
  private subscriptions: Map<string, { destination: string, callback: (message: any) => void, internalSub: any }> = new Map();
  private pendingSends: { destination: string, body: any }[] = [];
  private subCounter = 0;
  
  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log('Connected to WebSocket server');
      
      // Resubscribe all active subscriptions
      this.subscriptions.forEach((sub, key) => {
        sub.internalSub = this.client.subscribe(sub.destination, (message) => {
          if (message.body) {
            sub.callback(JSON.parse(message.body));
          }
        });
      });

      // Send pending messages
      this.pendingSends.forEach(send => {
        this.client.publish({ destination: send.destination, body: JSON.stringify(send.body) });
      });
      this.pendingSends = [];
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
    if (this.client.active) return; // Use native 'active' flag to prevent multiple activations
    
    if (token) {
      this.client.connectHeaders = {
        Authorization: `Bearer ${token}`
      };
    }
    
    this.client.activate();
  }

  disconnect() {
    this.connected = false;
    this.client.deactivate();
    this.subscriptions.clear();
  }

  subscribe(destination: string, callback: (message: any) => void) {
    const subId = `sub_${this.subCounter++}`;
    const subEntry = { destination, callback, internalSub: null as any };
    this.subscriptions.set(subId, subEntry);
    
    if (this.connected) {
      subEntry.internalSub = this.client.subscribe(destination, (message) => {
        if (message.body) {
          callback(JSON.parse(message.body));
        }
      });
    }
    
    // Return an unsubscribe object that matches the StompSubscription interface
    return {
      unsubscribe: () => {
        const sub = this.subscriptions.get(subId);
        if (sub && sub.internalSub) {
          sub.internalSub.unsubscribe();
        }
        this.subscriptions.delete(subId);
      }
    };
  }

  send(destination: string, body: any) {
    if (!this.connected) {
      this.pendingSends.push({ destination, body });
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
