/**
 * WebSocket connection manager with auto-reconnect and error handling
 */

import { getAPIBaseURL } from './apiConfig';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.enabled = true; // Flag to control if websocket should be used
  }

  /**
   * Initialize the WebSocket connection
   */
  connect(endpoint = 'ws') {
    if (!this.enabled) {
      console.log('WebSocket connections are disabled');
      return;
    }
    
    // Don't try to reconnect if we've hit the limit
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached, giving up`);
      this.enabled = false;
      return;
    }
    
    try {
      // Convert HTTP URL to WebSocket URL
      const apiBase = getAPIBaseURL();
      const wsBase = apiBase.replace('http://', 'ws://').replace('https://', 'wss://');
      const wsUrl = `${wsBase}/${endpoint}`;
      
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Setup event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect the WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(data) {
    if (!this.isConnected || !this.socket) {
      console.warn('Cannot send message, WebSocket not connected');
      return false;
    }
    
    try {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Add a message handler
   */
  addMessageHandler(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Add a connection state handler
   */
  addConnectionHandler(handler) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.connectionHandlers.forEach(handler => handler(true));
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    this.connectionHandlers.forEach(handler => handler(false));
    
    // Only attempt reconnect for normal closures or connection issues
    if (event.code === 1000 || event.code === 1001 || event.code === 1006) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('WebSocket error:', error);
    // Don't need to schedule reconnect here as the close event will fire
  }

  /**
   * Handle WebSocket message event
   */
  handleMessage(event) {
    let data;
    
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      data = event.data;
    }
    
    this.messageHandlers.forEach(handler => handler(data));
  }

  /**
   * Schedule a reconnection attempt
   */
  scheduleReconnect() {
    if (!this.enabled) return;
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 3);
    
    console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  }

  /**
   * Disable WebSocket functionality
   */
  disable() {
    this.enabled = false;
    this.disconnect();
  }

  /**
   * Enable WebSocket functionality
   */
  enable() {
    this.enabled = true;
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Create a singleton instance
const webSocketManager = new WebSocketManager();

// Disable WebSocket by default if on localhost (since local server may not support it)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('Running on localhost - WebSockets disabled by default');
  webSocketManager.disable();
}

export default webSocketManager;
