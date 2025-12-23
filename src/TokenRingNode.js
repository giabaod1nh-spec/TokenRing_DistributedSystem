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
<<<<<<< HEAD
    this.tokenTimeout = config.tokenTimeout || 10000; // 5 seconds
=======
    this.tokenTimeout = config.tokenTimeout || 5000; // default 5s
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176
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
<<<<<<< HEAD
    this.lastTokenSeenAt = 0; // Initialize to 0 so we know token hasn't been seen yet
    this.lastKnownTokenHolder = null; // Track which node has the token
    this.tokenEverSeen = false; // Track if we've ever seen the token
=======
    this.lastTokenSeenAt = Date.now();
    this.lastTokenHolder = null;
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176

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

<<<<<<< HEAD
    // Check if we need to regenerate token after peer disconnect
    if (!this.hasToken && !this.pendingToken) {
      const disconnectedNodeHadToken = this.lastKnownTokenHolder === nodeId;
      const disconnectedWasCoordinator = nodeId === Math.min(...this.ringOrder);
      const tokenNeverSeen = !this.tokenEverSeen;
      
      console.log(
        `[Node ${this.nodeId}] Checking token status - lastKnownHolder: ${this.lastKnownTokenHolder}, disconnected: ${nodeId}, tokenEverSeen: ${this.tokenEverSeen}, disconnectedWasCoordinator: ${disconnectedWasCoordinator}`
      );
      
      // Token might be lost if:
      // 1. Disconnected node was known to hold the token, OR
      // 2. Disconnected node was coordinator and token was never seen (initial token holder crashed), OR
      // 3. Token hasn't been seen for a while
      const tokenMightBeLost = disconnectedNodeHadToken || 
                               (disconnectedWasCoordinator && tokenNeverSeen) ||
                               this._isTokenPotentiallyLost();
      
      if (tokenMightBeLost) {
        console.warn(
          `[Node ${this.nodeId}] ⚠️ Node ${nodeId} disconnected, token may be lost!`
        );
        
        // Check if we are the successor (next node) of the failed node
        if (this._amSuccessorOf(nodeId)) {
          console.log(
            `[Node ${this.nodeId}] 🔄 I am successor of failed node ${nodeId}, will regenerate token`
          );
          // Delay to allow network to stabilize and avoid duplicate tokens
          setTimeout(() => {
            if (!this.hasToken && !this.pendingToken && !this._isAnyoneHoldingToken()) {
              console.log(`[Node ${this.nodeId}] 🆕 Regenerating token after node ${nodeId} failure`);
              this._receiveToken();
            }
          }, 2000);
        } else if (this._amNewCoordinator()) {
          // If no successor logic applies and we're now the coordinator, we regenerate
          console.log(
            `[Node ${this.nodeId}] 🔄 I am now coordinator after node ${nodeId} failure, will regenerate token`
          );
          setTimeout(() => {
            if (!this.hasToken && !this.pendingToken && !this._isAnyoneHoldingToken()) {
              console.log(`[Node ${this.nodeId}] 🆕 Regenerating token as new coordinator`);
              this._receiveToken();
            }
          }, 3000); // Slightly longer delay for coordinator fallback
        }
=======
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
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176
      }
    }
  }

  /**
   * Check if this node is the new coordinator among active nodes
   */
  _amNewCoordinator() {
    const activeNodeIds = Array.from(this.activeNodes);
    if (activeNodeIds.length === 0) return true;
    return this.nodeId === Math.min(...activeNodeIds);
  }

  /**
   * Check if the token is potentially lost (no node claims to have it recently)
   */
  _isTokenPotentiallyLost() {
    // If token was never seen, it might be lost
    if (!this.tokenEverSeen) {
      return false; // Let other conditions handle this case
    }
    
    const now = Date.now();
    // Token is potentially lost if we haven't seen it for more than 2 token timeouts
    const timeSinceTokenSeen = now - this.lastTokenSeenAt;
    return timeSinceTokenSeen > this.tokenTimeout * 2;
  }

  /**
   * Check if any active node is known to be holding the token
   */
  _isAnyoneHoldingToken() {
    // If we have the token, yes
    if (this.hasToken) return true;
    
    // If we know who has the token and they're still active, yes
    if (this.lastKnownTokenHolder !== null && 
        this.lastKnownTokenHolder !== this.nodeId &&
        this.activeNodes.has(this.lastKnownTokenHolder)) {
      // But only if we've seen the token recently
      const now = Date.now();
      const timeSinceTokenSeen = now - this.lastTokenSeenAt;
      if (timeSinceTokenSeen < this.tokenTimeout * 2) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if this node is the successor (next node) of a given node in the ring
   */
  _amSuccessorOf(nodeId) {
    const failedIndex = this.ringOrder.indexOf(nodeId);
    if (failedIndex === -1) return false;

    // Find the next active node after the failed node
    let nextIndex = (failedIndex + 1) % this.ringOrder.length;
    let attempts = 0;

    while (attempts < this.ringOrder.length) {
      const candidateId = this.ringOrder[nextIndex];
      
      // Skip inactive nodes (but include ourselves)
      if (this.activeNodes.has(candidateId) || candidateId === this.nodeId) {
        // This is the successor
        return candidateId === this.nodeId;
      }
      
      nextIndex = (nextIndex + 1) % this.ringOrder.length;
      attempts++;
    }

    return false;
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
      case "token-holder-update":
        this._handleTokenHolderUpdate(message);
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
<<<<<<< HEAD
    this.tokenEverSeen = true;
=======
    this.lastTokenHolder = message.from;
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176

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
<<<<<<< HEAD
    this.lastKnownTokenHolder = this.nodeId; // We now hold the token
    this.tokenEverSeen = true;
=======
    this.lastTokenHolder = this.nodeId;
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176
    this.emit("token-received");

    // Broadcast to all peers that we now have the token
    // This ensures all nodes know who has the token for failover
    this._broadcastTokenHolder();

    // Process any queued messages
    this._processMessageQueue();

    // Set timeout to pass token
    this.tokenTimeoutId = setTimeout(() => {
      this._passToken();
    }, this.tokenTimeout);
  }

  /**
   * Broadcast to all peers that this node now holds the token
   */
  _broadcastTokenHolder() {
    for (const peerId of this.connections.keys()) {
      this._sendToPeer(peerId, {
        type: "token-holder-update",
        from: this.nodeId,
        tokenHolder: this.nodeId,
        timestamp: Date.now(),
      });
    }
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
<<<<<<< HEAD
    this.lastKnownTokenHolder = nextNode; // Token is being passed to next node
=======
    this.lastTokenHolder = this.nodeId;
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176

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

    // Update token holder info from heartbeat
    if (message.hasToken) {
      this.lastKnownTokenHolder = message.from;
      this.lastTokenSeenAt = Date.now();
      this.tokenEverSeen = true;
    }
  }

  /**
   * Handle token holder update - another node is announcing it has the token
   */
  _handleTokenHolderUpdate(message) {
    console.log(
      `[Node ${this.nodeId}] 📢 Token holder update: Node ${message.tokenHolder} now has the token`
    );
    this.lastKnownTokenHolder = message.tokenHolder;
    this.lastTokenSeenAt = Date.now();
    this.tokenEverSeen = true;
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
        hasToken: this.hasToken, // Include token status in heartbeat
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
    
    // Determine if we should check for token loss
    let shouldCheck = false;
    let reason = "";
    
    if (this.tokenEverSeen) {
      // Token was seen before - check if it's been too long
      const timeSinceTokenSeen = now - this.lastTokenSeenAt;
      
      // Use shorter threshold if the last known token holder is no longer active
      let effectiveThreshold = this.tokenLossThresholdMs;
      const lastHolderStillActive = this.lastKnownTokenHolder !== null && 
                                     this.activeNodes.has(this.lastKnownTokenHolder);
      
      if (!lastHolderStillActive && this.lastKnownTokenHolder !== this.nodeId) {
        // Token holder may have crashed - use shorter threshold (2x token timeout)
        effectiveThreshold = this.tokenTimeout * 2;
      }
      
      if (timeSinceTokenSeen >= effectiveThreshold) {
        shouldCheck = true;
        reason = `Token not seen for ${timeSinceTokenSeen}ms (threshold: ${effectiveThreshold}ms)`;
      }
    }
    
    if (!shouldCheck) {
      return;
    }

<<<<<<< HEAD
    // If we know who had the token last, only successor regenerates
    // Otherwise fall back to coordinator
    let shouldRegenerate = false;

    if (this.lastKnownTokenHolder !== null && this.lastKnownTokenHolder !== this.nodeId) {
      // If last known holder is inactive, their successor should regenerate
      if (!this.activeNodes.has(this.lastKnownTokenHolder)) {
        shouldRegenerate = this._amSuccessorOf(this.lastKnownTokenHolder);
      }
    }
    
    // Fallback: if no one regenerated and we're the coordinator among active nodes, do it
    if (!shouldRegenerate && this._amNewCoordinator()) {
      shouldRegenerate = true;
    }

    if (!shouldRegenerate) {
      return;
    }

    console.warn(`[Node ${this.nodeId}] ${reason}, regenerating`);
=======
    const regenCandidate = this._nextActiveAfter(this.lastTokenHolder);
    if (regenCandidate !== this.nodeId) {
      return;
    }

    console.warn(
      `[Node ${this.nodeId}] Token not seen for ${this.tokenLossThresholdMs}ms, regenerating as successor`
    );
>>>>>>> 2ad335a9af52aa7bf7929c3d01a1eda8c76d2176
    this._receiveToken();
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
