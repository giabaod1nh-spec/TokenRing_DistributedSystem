const express = require("express");
const path = require("path");
const TokenRingNode = require("./TokenRingNode");
const fs = require("fs");

// Load configuration
const configPath = path.join(__dirname, "..", "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Create Express app
const app = express();
const HTTP_PORT = config.port + 1000; // HTTP server on different port

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Create Token Ring Node
const node = new TokenRingNode(config);

// Store messages for display
const messages = [];
const maxMessages = 100;

// Event handlers
node.on("started", () => {
  console.log(`[Server] Node started successfully`);
});

node.on("token-received", () => {
  console.log(`[Server] Token received - broadcasting to clients`);
  broadcastStatus();
});

node.on("token-passed", (toNodeId) => {
  console.log(`[Server] Token passed to Node ${toNodeId}`);
  broadcastStatus();
});

node.on("message-sent", (message) => {
  messages.push({
    ...message,
    direction: "sent",
  });
  if (messages.length > maxMessages) {
    messages.shift();
  }
  broadcastMessages();
  broadcastStatus();
});

node.on("message-received", (message) => {
  messages.push({
    ...message,
    direction: "received",
  });
  if (messages.length > maxMessages) {
    messages.shift();
  }
  broadcastMessages();
});

node.on("message-queued", (message) => {
  console.log(`[Server] Message queued`);
  broadcastStatus();
});

node.on("peer-connected", (peerId) => {
  console.log(`[Server] Peer ${peerId} connected`);
  broadcastStatus();
});

node.on("peer-disconnected", (peerId) => {
  console.log(`[Server] Peer ${peerId} disconnected`);
  broadcastStatus();
});

// API Routes
app.get("/api/status", (req, res) => {
  res.json(node.getStatus());
});

app.get("/api/messages", (req, res) => {
  res.json(messages);
});

app.post("/api/send-message", (req, res) => {
  const { toNodeId, content } = req.body;

  if (!toNodeId || !content) {
    return res.status(400).json({ error: "Missing toNodeId or content" });
  }

  try {
    node.sendMessage(parseInt(toNodeId), content);
    res.json({ success: true, message: "Message sent/queued" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/config", (req, res) => {
  res.json({
    nodeId: config.nodeId,
    port: config.port,
    peers: config.peers,
    allNodes: [config.nodeId, ...config.peers.map((p) => p.nodeId)].sort(
      (a, b) => a - b
    ),
  });
});

// SSE for real-time updates
const clients = new Set();

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);

  // Send initial data
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    clients.delete(res);
  });
});

function broadcastStatus() {
  const status = node.getStatus();
  const data = JSON.stringify({ type: "status", data: status });

  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (error) {
      clients.delete(client);
    }
  }
}

function broadcastMessages() {
  const data = JSON.stringify({ type: "messages", data: messages });

  for (const client of clients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (error) {
      clients.delete(client);
    }
  }
}

// Start servers
async function start() {
  try {
    // Start Token Ring Node
    await node.start();

    // Start HTTP server
    app.listen(HTTP_PORT, () => {
      console.log(
        `[Server] HTTP server listening on http://localhost:${HTTP_PORT}`
      );
      console.log(`[Server] Open this URL in your browser to access the GUI`);
    });
  } catch (error) {
    console.error("[Server] Failed to start:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down gracefully...");
  node.shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Server] Shutting down gracefully...");
  node.shutdown();
  process.exit(0);
});

// Start the application
start();
