const WebSocket = require("ws");
const EventEmitter = require("events");

/**
 * TokenRingNode - Represents a node in the Token Ring network
 * Implements the Token Ring Algorithm for distributed message passing
 */
class TokenRingNode extends EventEmitter {
  constructor(config) {
    super();

    this.nodeId = config.nodeId;
    this.port = config.port;
    this.peers = config.peers || [];
    this.tokenTimeout = config.tokenTimeout || 5000; // default 5s
    this.tokenAckTimeoutMs = config.tokenAckTimeoutMs || 3000;
    this.tokenLossThresholdMs =
      config.tokenLossThresholdMs || this.tokenTimeout * 3;
    this.isInitialTokenHolder = config.isInitialTokenHolder || false;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs || 2000;
    this.heartbeatTimeoutMs = config.heartbeatTimeoutMs || 30000;

    // Token Ring state
    this.hasToken = false;
    this.tokenTimeoutId = null;
    this.pendingToken = null; // { id, toNodeId, timeoutId }
    this.lastTokenSeenAt = Date.now();
    this.lastTokenHolder = null;

    // Network connections
    this.server = null;
    this.connections = new Map(); // nodeId -> WebSocket
    this.reconnectIntervals = new Map(); // nodeId -> interval ID
    this.heartbeatIntervalId = null;
    this.heartbeatCheckIntervalId = null;
    this.tokenWatchdogIntervalId = null;

    // Message queue
    this.messageQueue = [];

    // Ring topology
    this.ringOrder = this._buildRingOrder();
    this.activeNodes = new Set(this.ringOrder);
    this.lastHeartbeat = new Map(); // nodeId -> timestamp

    // Statistics
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      tokensPassed: 0,
      tokensReceived: 0,
    };

    console.log(
      `[Node ${this.nodeId}] Initialized with ring order:`,
      this.ringOrder
    );
  }

  /**
   * Build the ring order from the peer configuration
   */
  _buildRingOrder() {
    const allNodes = [this.nodeId, ...this.peers.map((p) => p.nodeId)];
    return allNodes.sort((a, b) => a - b);
  }

  /**
   * Get the next node in the ring
   */
  _getNextNode() {
    const currentIndex = this.ringOrder.indexOf(this.nodeId);
    let nextIndex = (currentIndex + 1) % this.ringOrder.length;
    let attempts = 0;

    // Skip failed nodes
    while (
      !this.activeNodes.has(this.ringOrder[nextIndex]) &&
      attempts < this.ringOrder.length
    ) {
      nextIndex = (nextIndex + 1) % this.ringOrder.length;
      attempts++;
    }

    if (attempts >= this.ringOrder.length) {
      console.log(`[Node ${this.nodeId}] No active nodes found!`);
      return null;
    }

    return this.ringOrder[nextIndex];
  }

  /**
   * Start the node (server and client connections)
   */
  async start() {
    console.log(`[Node ${this.nodeId}] Starting on port ${this.port}...`);

    // Start WebSocket server
    await this._startServer();

    // Connect to peers
    await this._connectToPeers();

    // Begin heartbeats and watchdog timers
    this._startHeartbeatLoops();
    this._startTokenWatchdog();

    // If this is the initial token holder, start the token circulation
    if (this.isInitialTokenHolder) {
      setTimeout(() => {
        console.log(`[Node ${this.nodeId}] Initializing token circulation...`);
        this._receiveToken();
      }, 2000); // Wait 2 seconds for all nodes to connect
    }

    console.log(`[Node ${this.nodeId}] Started successfully!`);
    this.emit("started");
  }

  /**
   * Start the WebSocket server
   */
  _startServer() {
    return new Promise((resolve) => {
      this.server = new WebSocket.Server({ port: this.port });

      this.server.on("connection", (ws, req) => {
        console.log(
          `[Node ${this.nodeId}] Incoming connection from ${req.socket.remoteAddress}`
        );

        ws.on("message", (data) => {
          try {
            const message = JSON.parse(data.toString());
            this._handleMessage(message, ws);
          } catch (error) {
            console.error(
              `[Node ${this.nodeId}] Error parsing message:`,
              error
            );
          }
        });

        ws.on("close", () => {
          // Find which peer disconnected
          for (const [nodeId, conn] of this.connections.entries()) {
            if (conn === ws) {
              console.log(`[Node ${this.nodeId}] Peer ${nodeId} disconnected`);
              this._handlePeerDisconnect(nodeId);
              break;
            }
          }
        });

        ws.on("error", (error) => {
          console.error(
            `[Node ${this.nodeId}] WebSocket error:`,
            error.message
          );
        });
      });

      this.server.on("listening", () => {
        console.log(
          `[Node ${this.nodeId}] Server listening on port ${this.port}`
        );
        resolve();
      });
    });
  }

  /**
   * Connect to all peers
   */
  async _connectToPeers() {
    const connectionPromises = this.peers.map((peer) =>
      this._connectToPeer(peer)
    );
    await Promise.allSettled(connectionPromises);
  }

  /**
   * Connect to a single peer
   */
  _connectToPeer(peer) {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://${peer.host}:${peer.port}`);

      ws.on("open", () => {
        console.log(`[Node ${this.nodeId}] Connected to Node ${peer.nodeId}`);
        this.connections.set(peer.nodeId, ws);
        this.activeNodes.add(peer.nodeId);
        this.lastHeartbeat.set(peer.nodeId, Date.now());
        this.lastHeartbeat.set(this.nodeId, Date.now());

        // Send handshake
        this._sendToPeer(peer.nodeId, {
          type: "handshake",
          from: this.nodeId,
          timestamp: Date.now(),
        });

        // Clear any reconnect interval
        if (this.reconnectIntervals.has(peer.nodeId)) {
          clearInterval(this.reconnectIntervals.get(peer.nodeId));
          this.reconnectIntervals.delete(peer.nodeId);
        }

        this.emit("peer-connected", peer.nodeId);
        resolve();
      });

      ws.on("error", (error) => {
        console.error(
          `[Node ${this.nodeId}] Failed to connect to Node ${peer.nodeId}:`,
          error.message
        );
        this._scheduleReconnect(peer);
        resolve(); // Resolve anyway to not block other connections
      });

      ws.on("close", () => {
        console.log(
          `[Node ${this.nodeId}] Connection to Node ${peer.nodeId} closed`
        );
        this._handlePeerDisconnect(peer.nodeId);
        this._scheduleReconnect(peer);
      });
    });
  }

  /**
   * Schedule reconnection to a peer
   */
  _scheduleReconnect(peer) {
    if (this.reconnectIntervals.has(peer.nodeId)) {
      return; // Already scheduled
    }

    const intervalId = setInterval(() => {
      console.log(
        `[Node ${this.nodeId}] Attempting to reconnect to Node ${peer.nodeId}...`
      );
      this._connectToPeer(peer);
    }, 5000); // Try every 5 seconds

    this.reconnectIntervals.set(peer.nodeId, intervalId);
  }

  /**
   * Handle peer disconnect
   */
  _handlePeerDisconnect(nodeId) {
    this.connections.delete(nodeId);
    this.activeNodes.delete(nodeId);
    this.lastHeartbeat.delete(nodeId);
    this.emit("peer-disconnected", nodeId);

    console.log(
      `[Node ${this.nodeId}] Active nodes:`,
      Array.from(this.activeNodes)
    );

    // Check if the disconnected node was holding the token
    // The NEXT node (successor) after the failed node will regenerate the token
    if (
      this.lastKnownTokenHolder === nodeId &&
      !this.hasToken &&
      !this.pendingToken
    ) {
      console.warn(
        `[Node ${this.nodeId}] ⚠️ Node ${nodeId} (token holder) disconnected!`
      );

      // Check if we are the successor (next node) of the failed node
      if (this._amSuccessorOf(nodeId)) {
        console.log(
          `[Node ${this.nodeId}] 🔄 I am successor of failed node ${nodeId}, regenerating token`
        );
        // Small delay to ensure network state is updated
        setTimeout(() => {
          if (!this.hasToken && !this.pendingToken) {
            this._receiveToken();
          }
        }, 1000);
      }
    }
  }

  /**
   * Handle incoming messages
   */
  _handleMessage(message, ws) {
    console.log(
      `[Node ${this.nodeId}] Received message:`,
      message.type,
      "from Node",
      message.from
    );

    switch (message.type) {
      case "handshake":
        this._handleHandshake(message, ws);
        break;
      case "token":
        this._handleTokenReceived(message);
        break;
      case "message":
        this._handleMessageReceived(message);
        break;
      case "heartbeat":
        this._handleHeartbeat(message);
        break;
      case "token-ack":
        this._handleTokenAck(message);
        break;
      default:
        console.log(
          `[Node ${this.nodeId}] Unknown message type:`,
          message.type
        );
    }
  }

  /**
   * Handle handshake from peer
   */
  _handleHandshake(message, ws) {
    const peerId = message.from;

    if (!this.connections.has(peerId)) {
      this.connections.set(peerId, ws);
      this.activeNodes.add(peerId);
      console.log(
        `[Node ${this.nodeId}] Established connection with Node ${peerId} via handshake`
      );
      this.emit("peer-connected", peerId);
    }
  }

  /**
   * Handle token received
   */
  _handleTokenReceived(message) {
    console.log(
      `[Node ${this.nodeId}] 🎫 TOKEN RECEIVED from Node ${message.from}`
    );
    this.stats.tokensReceived++;
    this.lastTokenSeenAt = Date.now();
    this.lastTokenHolder = message.from;

    // Ack token receipt so sender knows the token is safe
    this._sendToPeer(message.from, {
      type: "token-ack",
      tokenId: message.tokenId,
      from: this.nodeId,
      timestamp: Date.now(),
    });

    this._receiveToken();
  }

  /**
   * Receive the token
   */
  _receiveToken() {
    this.hasToken = true;
    this.lastTokenSeenAt = Date.now();
    this.lastTokenHolder = this.nodeId;
    this.emit("token-received");

    // Process any queued messages
    this._processMessageQueue();

    // Set timeout to pass token
    this.tokenTimeoutId = setTimeout(() => {
      this._passToken();
    }, this.tokenTimeout);
  }

  /**
   * Pass the token to the next node
   */
  _passToken() {
    if (!this.hasToken) {
      console.log(`[Node ${this.nodeId}] Cannot pass token - don't have it!`);
      return;
    }

    const nextNode = this._getNextNode();

    if (nextNode === null) {
      console.log(`[Node ${this.nodeId}] No active nodes to pass token to!`);
      // Keep the token and try again later
      this.tokenTimeoutId = setTimeout(() => {
        this._passToken();
      }, this.tokenTimeout);
      return;
    }

    console.log(`[Node ${this.nodeId}] 🎫 PASSING TOKEN to Node ${nextNode}`);
    const tokenId = `${Date.now()}-${this.nodeId}-${Math.floor(
      Math.random() * 100000
    )}`;

    this.lastTokenSeenAt = Date.now();
    this.lastTokenHolder = this.nodeId;

    this._sendToPeer(nextNode, {
      type: "token",
      from: this.nodeId,
      tokenId,
      timestamp: Date.now(),
    });

    this.stats.tokensPassed++;

    if (this.tokenTimeoutId) {
      clearTimeout(this.tokenTimeoutId);
      this.tokenTimeoutId = null;
    }

    // Wait for ack; if lost, watchdog will recreate the token later
    const timeoutId = setTimeout(() => {
      this._handleTokenAckTimeout(nextNode, tokenId);
    }, this.tokenAckTimeoutMs);

    this.pendingToken = { id: tokenId, toNodeId: nextNode, timeoutId };
    this.hasToken = false;
    this.emit("token-passed", nextNode);
  }

  /**
   * Send a message to another node
   */
  sendMessage(toNodeId, content) {
    const message = {
      type: "message",
      from: this.nodeId,
      to: toNodeId,
      content: content,
      timestamp: Date.now(),
    };

    if (this.hasToken) {
      // Send immediately
      this._sendToPeer(toNodeId, message);
      this.stats.messagesSent++;
      this.emit("message-sent", message);
      console.log(
        `[Node ${this.nodeId}] 📤 Sent message to Node ${toNodeId}: "${content}"`
      );
    } else {
      // Queue the message
      this.messageQueue.push(message);
      console.log(
        `[Node ${this.nodeId}] 📥 Queued message to Node ${toNodeId} (waiting for token)`
      );
      this.emit("message-queued", message);
    }
  }

  /**
   * Process queued messages
   */
  _processMessageQueue() {
    while (this.messageQueue.length > 0 && this.hasToken) {
      const message = this.messageQueue.shift();
      this._sendToPeer(message.to, message);
      this.stats.messagesSent++;
      this.emit("message-sent", message);
      console.log(
        `[Node ${this.nodeId}] 📤 Sent queued message to Node ${message.to}`
      );
    }
  }

  /**
   * Handle message received
   */
  _handleMessageReceived(message) {
    this.stats.messagesReceived++;
    this.emit("message-received", message);
    console.log(
      `[Node ${this.nodeId}] 📨 Received message from Node ${message.from}: "${message.content}"`
    );
  }

  /**
   * Handle heartbeat
   */
  _handleHeartbeat(message) {
    // Update active nodes
    if (!this.activeNodes.has(message.from)) {
      this.activeNodes.add(message.from);
      console.log(`[Node ${this.nodeId}] Node ${message.from} is back online`);
    }
    this.lastHeartbeat.set(message.from, Date.now());
  }

  /**
   * Handle token ack from peer
   */
  _handleTokenAck(message) {
    if (!this.pendingToken || message.tokenId !== this.pendingToken.id) {
      return;
    }

    console.log(
      `[Node ${this.nodeId}] ✅ Token ack received from Node ${message.from}`
    );

    clearTimeout(this.pendingToken.timeoutId);
    this.pendingToken = null;
  }

  /**
   * Token ack timed out - mark node inactive and rely on watchdog to recover
   */
  _handleTokenAckTimeout(nodeId, tokenId) {
    if (!this.pendingToken || this.pendingToken.id !== tokenId) {
      return;
    }

    console.warn(
      `[Node ${this.nodeId}] Token ack from Node ${nodeId} timed out`
    );

    this.pendingToken = null;
    this._markNodeInactive(nodeId);
  }

  /**
   * Mark a node as inactive and try to reconnect
   */
  _markNodeInactive(nodeId) {
    if (this.connections.has(nodeId)) {
      try {
        this.connections.get(nodeId).close();
      } catch (_) {}
      this.connections.delete(nodeId);
    }
    this.activeNodes.delete(nodeId);
    this.lastHeartbeat.delete(nodeId);
    this.emit("peer-disconnected", nodeId);
    console.log(`[Node ${this.nodeId}] Marked Node ${nodeId} inactive`);

    // Schedule reconnect if we have peer info
    const peer = this.peers.find((p) => p.nodeId === nodeId);
    if (peer) {
      this._scheduleReconnect(peer);
    }
  }

  /**
   * Start heartbeat send/prune loops
   */
  _startHeartbeatLoops() {
    this.lastHeartbeat.set(this.nodeId, Date.now());
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.heartbeatCheckIntervalId) {
      clearInterval(this.heartbeatCheckIntervalId);
    }

    this.heartbeatIntervalId = setInterval(
      () => this._sendHeartbeats(),
      this.heartbeatIntervalMs
    );
    this.heartbeatCheckIntervalId = setInterval(
      () => this._pruneHeartbeats(),
      this.heartbeatIntervalMs
    );
  }

  /**
   * Send heartbeat to all connected peers
   */
  _sendHeartbeats() {
    for (const peerId of this.connections.keys()) {
      this._sendToPeer(peerId, {
        type: "heartbeat",
        from: this.nodeId,
        timestamp: Date.now(),
      });
    }
    this.lastHeartbeat.set(this.nodeId, Date.now());
  }

  /**
   * Remove peers that have missed heartbeats
   */
  _pruneHeartbeats() {
    const now = Date.now();
    for (const nodeId of [...this.activeNodes]) {
      if (nodeId === this.nodeId) continue;
      const lastBeat = this.lastHeartbeat.get(nodeId) || 0;
      if (now - lastBeat > this.heartbeatTimeoutMs) {
        console.warn(
          `[Node ${this.nodeId}] Heartbeat timeout for Node ${nodeId}`
        );
        this._markNodeInactive(nodeId);
      }
    }
  }

  /**
   * Watchdog for token loss - recreate token if coordinator and no token seen
   */
  _startTokenWatchdog() {
    if (this.tokenWatchdogIntervalId) {
      clearInterval(this.tokenWatchdogIntervalId);
    }

    this.tokenWatchdogIntervalId = setInterval(
      () => this._checkTokenLoss(),
      this.tokenTimeout
    );
  }

  _checkTokenLoss() {
    if (this.hasToken || this.pendingToken) {
      return;
    }

    const now = Date.now();
    if (now - this.lastTokenSeenAt < this.tokenLossThresholdMs) {
      return;
    }

    const regenCandidate = this._nextActiveAfter(this.lastTokenHolder);
    if (regenCandidate !== this.nodeId) {
      return;
    }

    console.warn(
      `[Node ${this.nodeId}] Token not seen for ${this.tokenLossThresholdMs}ms, regenerating as successor`
    );
    this._receiveToken();
    this.lastTokenSeenAt = Date.now();
  }

  _nextActiveAfter(nodeId) {
    if (!nodeId || !this.ringOrder.includes(nodeId)) {
      return Math.min(...this.ringOrder);
    }

    const sorted = [...this.ringOrder];
    const startIdx = sorted.indexOf(nodeId);
    for (let i = 1; i <= sorted.length; i++) {
      const idx = (startIdx + i) % sorted.length;
      const candidate = sorted[idx];
      if (this.activeNodes.has(candidate)) {
        return candidate;
      }
    }
    return nodeId;
  }

  /**
   * Send data to a peer
   */
  _sendToPeer(peerId, data) {
    const connection = this.connections.get(peerId);

    if (!connection || connection.readyState !== WebSocket.OPEN) {
      console.error(
        `[Node ${this.nodeId}] Cannot send to Node ${peerId} - not connected`
      );
      return false;
    }

    try {
      connection.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(
        `[Node ${this.nodeId}] Error sending to Node ${peerId}:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Get node status
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      hasToken: this.hasToken,
      activeNodes: Array.from(this.activeNodes),
      connectedPeers: Array.from(this.connections.keys()),
      queuedMessages: this.messageQueue.length,
      stats: this.stats,
      lastTokenSeenAt: this.lastTokenSeenAt,
    };
  }

  /**
   * Shutdown the node
   */
  shutdown() {
    console.log(`[Node ${this.nodeId}] Shutting down...`);

    // Clear timeouts
    if (this.tokenTimeoutId) {
      clearTimeout(this.tokenTimeoutId);
    }
    if (this.pendingToken?.timeoutId) {
      clearTimeout(this.pendingToken.timeoutId);
    }
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
    }
    if (this.heartbeatCheckIntervalId) {
      clearInterval(this.heartbeatCheckIntervalId);
    }
    if (this.tokenWatchdogIntervalId) {
      clearInterval(this.tokenWatchdogIntervalId);
    }

    // Clear reconnect intervals
    for (const intervalId of this.reconnectIntervals.values()) {
      clearInterval(intervalId);
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.close();
    }

    // Close server
    if (this.server) {
      this.server.close();
    }

    console.log(`[Node ${this.nodeId}] Shutdown complete`);
  }
}

module.exports = TokenRingNode;
