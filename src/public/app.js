// Global state
let currentNodeId = null;
let hasToken = false;
let allNodes = [];
let activeNodes = [];
let config = {};

// DOM elements
const nodeIdBadge = document.getElementById("nodeIdBadge");
const tokenStatus = document.getElementById("tokenStatus");
const recipientSelect = document.getElementById("recipientSelect");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const sendStatus = document.getElementById("sendStatus");
const messageLog = document.getElementById("messageLog");
const connectedPeers = document.getElementById("connectedPeers");
const messagesSent = document.getElementById("messagesSent");
const messagesReceived = document.getElementById("messagesReceived");
const queuedMessages = document.getElementById("queuedMessages");
const connectionStatus = document.getElementById("connectionStatus");

// Initialize
async function init() {
  console.log("Initializing application...");

  // Load config
  await loadConfig();

  // Setup event listeners
  setupEventListeners();

  // Connect to event stream
  connectEventStream();

  // Load initial data
  await loadStatus();
  await loadMessages();

  console.log("Application initialized");
}

// Load configuration
async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    config = await response.json();

    currentNodeId = config.nodeId;
    allNodes = config.allNodes;

    nodeIdBadge.textContent = `Node ${currentNodeId}`;

    // Populate recipient select
    populateRecipientSelect();

    console.log("Config loaded:", config);
  } catch (error) {
    console.error("Failed to load config:", error);
  }
}

// Populate recipient select dropdown
function populateRecipientSelect() {
  recipientSelect.innerHTML =
    '<option value="">-- Select recipient --</option>';

  allNodes.forEach((nodeId) => {
    if (nodeId !== currentNodeId) {
      const option = document.createElement("option");
      option.value = nodeId;
      option.textContent = `Node ${nodeId}`;
      recipientSelect.appendChild(option);
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  sendButton.addEventListener("click", handleSendMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSendMessage();
    }
  });
}

// Connect to server-sent events
function connectEventStream() {
  const eventSource = new EventSource("/api/events");

  eventSource.onopen = () => {
    console.log("Connected to event stream");
    connectionStatus.textContent = "Connected";
    connectionStatus.className = "status-value status-connected";
  };

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "status":
        updateStatus(data.data);
        break;
      case "messages":
        updateMessages(data.data);
        break;
      case "connected":
        console.log("Event stream connected");
        break;
    }
  };

  eventSource.onerror = (error) => {
    console.error("Event stream error:", error);
    connectionStatus.textContent = "Disconnected";
    connectionStatus.className = "status-value status-disconnected";

    // Reconnect after 5 seconds
    setTimeout(() => {
      console.log("Reconnecting...");
      connectEventStream();
    }, 5000);
  };
}

// Load status
async function loadStatus() {
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    updateStatus(status);
  } catch (error) {
    console.error("Failed to load status:", error);
  }
}

// Update status
function updateStatus(status) {
  hasToken = status.hasToken;
  activeNodes = status.activeNodes;

  // Update token status
  if (hasToken) {
    tokenStatus.textContent = "🎫 You have the token!";
    tokenStatus.classList.add("has-token");
    recipientSelect.disabled = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
  } else {
    tokenStatus.textContent = "⏳ Waiting for token...";
    tokenStatus.classList.remove("has-token");
    recipientSelect.disabled = true;
    messageInput.disabled = true;
    sendButton.disabled = true;
  }

  // Update statistics
  connectedPeers.textContent = status.connectedPeers.length;
  messagesSent.textContent = status.stats.messagesSent;
  messagesReceived.textContent = status.stats.messagesReceived;
  queuedMessages.textContent = status.queuedMessages;

  // Update ring visualization
  drawRing(status);
}

// Load messages
async function loadMessages() {
  try {
    const response = await fetch("/api/messages");
    const messages = await response.json();
    updateMessages(messages);
  } catch (error) {
    console.error("Failed to load messages:", error);
  }
}

// Update messages display
function updateMessages(messages) {
  if (messages.length === 0) {
    messageLog.innerHTML =
      '<p class="no-messages">No messages yet. Send a message when you receive the token!</p>';
    return;
  }

  messageLog.innerHTML = "";

  // Display messages in reverse order (newest first)
  const reversedMessages = [...messages].reverse();

  reversedMessages.forEach((msg) => {
    const messageItem = document.createElement("div");
    messageItem.className = `message-item ${msg.direction}`;

    const header = document.createElement("div");
    header.className = "message-header";

    const direction = document.createElement("span");
    direction.className = `message-direction ${msg.direction}`;
    direction.textContent =
      msg.direction === "sent"
        ? `📤 To Node ${msg.to}`
        : `📨 From Node ${msg.from}`;

    const timestamp = document.createElement("span");
    timestamp.className = "message-timestamp";
    timestamp.textContent = formatTimestamp(msg.timestamp);

    header.appendChild(direction);
    header.appendChild(timestamp);

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = msg.content;

    messageItem.appendChild(header);
    messageItem.appendChild(content);

    messageLog.appendChild(messageItem);
  });
}

// Handle send message
async function handleSendMessage() {
  const toNodeId = recipientSelect.value;
  const content = messageInput.value.trim();

  if (!toNodeId) {
    showSendStatus("Please select a recipient", "error");
    return;
  }

  if (!content) {
    showSendStatus("Please enter a message", "error");
    return;
  }

  try {
    const response = await fetch("/api/send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ toNodeId, content }),
    });

    const result = await response.json();

    if (response.ok) {
      showSendStatus(
        hasToken
          ? "Message sent!"
          : "Message queued (will send when token is received)",
        "success"
      );
      messageInput.value = "";
      recipientSelect.value = "";
    } else {
      showSendStatus(`Error: ${result.error}`, "error");
    }
  } catch (error) {
    showSendStatus(`Failed to send message: ${error.message}`, "error");
  }
}

// Show send status message
function showSendStatus(message, type) {
  sendStatus.textContent = message;
  sendStatus.className = `send-status ${type}`;

  setTimeout(() => {
    sendStatus.style.display = "none";
    sendStatus.className = "send-status";
  }, 3000);
}

// Draw ring visualization
function drawRing(status) {
  const svg = document.getElementById("ringSvg");
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 140;

  // Clear existing content
  svg.innerHTML = "";

  // Draw ring circle
  const ringCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  ringCircle.setAttribute("cx", centerX);
  ringCircle.setAttribute("cy", centerY);
  ringCircle.setAttribute("r", radius);
  ringCircle.setAttribute("fill", "none");
  ringCircle.setAttribute("stroke", "#ddd");
  ringCircle.setAttribute("stroke-width", "2");
  ringCircle.setAttribute("stroke-dasharray", "5,5");
  svg.appendChild(ringCircle);

  // Calculate node positions
  const nodeCount = allNodes.length;
  const angleStep = (2 * Math.PI) / nodeCount;

  allNodes.forEach((nodeId, index) => {
    const angle = -Math.PI / 2 + index * angleStep; // Start from top
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Determine node state
    const isActive = activeNodes.includes(nodeId);
    const isCurrentNode = nodeId === currentNodeId;
    const hasTokenNow = status.hasToken && isCurrentNode;

    // Draw connection line to next node
    const nextIndex = (index + 1) % nodeCount;
    const nextAngle = -Math.PI / 2 + nextIndex * angleStep;
    const nextX = centerX + radius * Math.cos(nextAngle);
    const nextY = centerY + radius * Math.sin(nextAngle);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x);
    line.setAttribute("y1", y);
    line.setAttribute("x2", nextX);
    line.setAttribute("y2", nextY);
    line.setAttribute(
      "stroke",
      isActive && activeNodes.includes(allNodes[nextIndex]) ? "#667eea" : "#ccc"
    );
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(line);

    // Draw node circle
    const nodeCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    nodeCircle.setAttribute("cx", x);
    nodeCircle.setAttribute("cy", y);
    nodeCircle.setAttribute("r", "30");

    if (hasTokenNow) {
      nodeCircle.setAttribute("fill", "#4caf50");
      nodeCircle.setAttribute("stroke", "#388e3c");
      nodeCircle.setAttribute("stroke-width", "3");

      // Add glow effect
      const glow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      glow.setAttribute("cx", x);
      glow.setAttribute("cy", y);
      glow.setAttribute("r", "35");
      glow.setAttribute("fill", "none");
      glow.setAttribute("stroke", "#4caf50");
      glow.setAttribute("stroke-width", "2");
      glow.setAttribute("opacity", "0.5");
      svg.appendChild(glow);

      // Animate glow
      const animate = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "animate"
      );
      animate.setAttribute("attributeName", "r");
      animate.setAttribute("values", "35;45;35");
      animate.setAttribute("dur", "2s");
      animate.setAttribute("repeatCount", "indefinite");
      glow.appendChild(animate);
    } else if (isCurrentNode) {
      nodeCircle.setAttribute("fill", "#ff9800");
      nodeCircle.setAttribute("stroke", "#f57c00");
      nodeCircle.setAttribute("stroke-width", "3");
    } else if (isActive) {
      nodeCircle.setAttribute("fill", "#2196f3");
      nodeCircle.setAttribute("stroke", "#1976d2");
      nodeCircle.setAttribute("stroke-width", "2");
    } else {
      nodeCircle.setAttribute("fill", "#ccc");
      nodeCircle.setAttribute("stroke", "#999");
      nodeCircle.setAttribute("stroke-width", "2");
    }

    svg.appendChild(nodeCircle);

    // Draw node label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y + 5);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", "bold");
    text.textContent = nodeId;
    svg.appendChild(text);

    // Add token icon if this node has the token
    if (hasTokenNow) {
      const tokenText = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      tokenText.setAttribute("x", x);
      tokenText.setAttribute("y", y - 45);
      tokenText.setAttribute("text-anchor", "middle");
      tokenText.setAttribute("font-size", "24");
      tokenText.textContent = "🎫";
      svg.appendChild(tokenText);
    }
  });

  // Define arrowhead marker
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "marker"
  );
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "10");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");

  const polygon = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );
  polygon.setAttribute("points", "0 0, 10 3, 0 6");
  polygon.setAttribute("fill", "#667eea");

  marker.appendChild(polygon);
  defs.appendChild(marker);
  svg.insertBefore(defs, svg.firstChild);
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

// Start the application
init();
