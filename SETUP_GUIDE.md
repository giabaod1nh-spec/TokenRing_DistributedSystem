# Message Relay - Network Setup Guide

This guide will help you set up the Message Relay app across 4 different laptops on the same network.

## Prerequisites

- 4 laptops with Node.js installed (v14 or higher)
- All laptops connected to the same Wi-Fi network
- Basic knowledge of terminal/command prompt

## Step-by-Step Setup

### Step 1: Find IP Addresses

On **each laptop**, find its IP address:

**Windows:**

1. Open Command Prompt
2. Type: `ipconfig`
3. Look for "IPv4 Address" (e.g., 192.168.1.101)

**Mac:**

1. Open Terminal
2. Type: `ifconfig | grep "inet " | grep -v 127.0.0.1`

**Linux:**

1. Open Terminal
2. Type: `ip addr show` or `hostname -I`

**Write down the IP addresses:**

- Laptop 1: ********\_********
- Laptop 2: ********\_********
- Laptop 3: ********\_********
- Laptop 4: ********\_********

### Step 2: Install the Application

On **each laptop**:

1. Copy the "Message Relay" project folder to the laptop
2. Open Command Prompt/Terminal in the project folder
3. Run: `npm install` (or double-click `setup.bat` on Windows)

### Step 3: Configure Each Node

On **each laptop**, create a `config.json` file in the root directory with the following content, **replacing the IP addresses** with the ones you found in Step 1:

**Laptop 1 (Node 1):**

```json
{
  "nodeId": 1,
  "port": 3001,
  "tokenTimeout": 5000,
  "peers": [
    { "nodeId": 2, "host": "192.168.1.102", "port": 3002 },
    { "nodeId": 3, "host": "192.168.1.103", "port": 3003 },
    { "nodeId": 4, "host": "192.168.1.104", "port": 3004 }
  ],
  "isInitialTokenHolder": true
}
```

**Laptop 2 (Node 2):**

```json
{
  "nodeId": 2,
  "port": 3002,
  "tokenTimeout": 5000,
  "peers": [
    { "nodeId": 1, "host": "192.168.1.101", "port": 3001 },
    { "nodeId": 3, "host": "192.168.1.103", "port": 3003 },
    { "nodeId": 4, "host": "192.168.1.104", "port": 3004 }
  ],
  "isInitialTokenHolder": false
}
```

**Laptop 3 (Node 3):**

```json
{
  "nodeId": 3,
  "port": 3003,
  "tokenTimeout": 5000,
  "peers": [
    { "nodeId": 1, "host": "192.168.1.101", "port": 3001 },
    { "nodeId": 2, "host": "192.168.1.102", "port": 3002 },
    { "nodeId": 4, "host": "192.168.1.104", "port": 3004 }
  ],
  "isInitialTokenHolder": false
}
```

**Laptop 4 (Node 4):**

```json
{
  "nodeId": 4,
  "port": 3004,
  "tokenTimeout": 5000,
  "peers": [
    { "nodeId": 1, "host": "192.168.1.101", "port": 3001 },
    { "nodeId": 2, "host": "192.168.1.102", "port": 3002 },
    { "nodeId": 3, "host": "192.168.1.103", "port": 3003 }
  ],
  "isInitialTokenHolder": false
}
```

### Step 4: Configure Firewall

On **each laptop**, allow Node.js through the firewall:

**Windows:**

1. When you first run the app, Windows will ask to allow access - click "Allow"
2. Or manually: Windows Defender Firewall → Allow an app → Add Node.js

**Mac:**

1. System Preferences → Security & Privacy → Firewall → Firewall Options
2. Add Node.js or allow incoming connections

**Linux:**

```bash
sudo ufw allow 3001:3004/tcp
```

### Step 5: Start the Application

On **each laptop**, in order:

1. **Start Node 1 first** (it initializes the token):

   ```
   npm start
   ```

   Wait until you see "Server listening on port 3001"

2. **Then start Nodes 2, 3, and 4** (in any order):
   ```
   npm start
   ```

### Step 6: Access the GUI

On **each laptop**, open a web browser and go to:

- Laptop 1: `http://localhost:4001`
- Laptop 2: `http://localhost:4002`
- Laptop 3: `http://localhost:4003`
- Laptop 4: `http://localhost:4004`

You should see the Token Ring interface with all 4 nodes visualized!

## Troubleshooting

### Nodes Can't Connect

1. **Check IP addresses** - Make sure they're correct in config.json
2. **Ping test** - From any laptop, ping another: `ping 192.168.1.102`
3. **Firewall** - Temporarily disable firewall to test, then re-enable and configure properly
4. **Same network** - Ensure all laptops are on the same Wi-Fi network

### Token Not Circulating

1. **Check Node 1** - Make sure it started first and `isInitialTokenHolder` is `true`
2. **Check connections** - Look at "Connected Peers" on each node's GUI
3. **Restart in order** - Stop all nodes, then start 1, 2, 3, 4 in sequence

### Port Already in Use

If you see "EADDRINUSE" error:

1. Close any other applications using ports 3001-3004 or 4001-4004
2. Or change ports in config.json (remember to update all peers too)

### Can't Access GUI

1. **Wrong port** - Node uses WebSocket port (e.g., 3001), GUI uses HTTP port (e.g., 4001 = 3001 + 1000)
2. **Server not started** - Check the terminal for "HTTP server listening" message

## Demo Script

Once everything is running, try this demo scenario:

1. **Observe the Token** - Watch the green node moving in the ring visualization
2. **Send a Message** - When your node gets the token (turns green):
   - Select a recipient
   - Type: "Hello from Node X!"
   - Click "Send Message"
3. **Coordinate Tasks** - Simulate event planning:
   - Node 1: "I'll book the venue"
   - Node 2: "I'll handle invitations"
   - Node 3: "I'll arrange food"
   - Node 4: "I'll manage decorations"
4. **Simulate Failure** - Close Node 3's app and watch the token skip it
5. **Recovery** - Restart Node 3 and watch it rejoin the ring

## Key Concepts Demonstrated

- ✅ **Mutual Exclusion** - Only token holder can send
- ✅ **Fair Scheduling** - Every node gets equal turns
- ✅ **Fault Tolerance** - System adapts to node failures
- ✅ **Ring Topology** - Logical ring structure
- ✅ **Distributed Coordination** - Multiple machines working together

Enjoy your Token Ring demonstration! 🎉
