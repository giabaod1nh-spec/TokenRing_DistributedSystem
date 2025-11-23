# Message Relay - Token Ring Algorithm Demo

A simple distributed system app demonstrating the **Token Ring Algorithm** using 4 laptops (nodes) to pass messages in an orderly, fair manner.

## 🎯 Real-Life Analogy

Imagine a group of friends sitting in a circle with a "talking stick." Only the person holding the stick can speak. This app simulates that concept:

- The **token** is the "talking stick"
- Each **laptop** represents a person in the group
- Only the laptop with the token can send a message
- The token passes one by one to ensure fairness

## ✨ Features

1. **Message Passing**: Send messages to other nodes (only when holding the token)
2. **Token Circulation**: Automatic token passing in a ring topology
3. **Visual Ring Display**: See all nodes and track the token's movement
4. **Fault Tolerance**: System adapts when nodes fail or disconnect
5. **Dynamic Participation**: Nodes can join or leave the ring

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- 4 laptops connected to the same local network (Wi-Fi or LAN)

### Installation

1. **Clone/Copy this project** to all 4 laptops

2. **Install dependencies** on each laptop:

   ```bash
   npm install
   ```

3. **Configure each node** by editing `config.json`:
   - Set a unique `nodeId` for each laptop (1, 2, 3, 4)
   - Set the `port` for this node
   - Configure `peers` with the IP addresses of other nodes

### Example Configuration

**Laptop 1 (Node 1)** - `config.json`:

```json
{
  "nodeId": 1,
  "port": 3001,
  "peers": [
    { "nodeId": 2, "host": "192.168.1.102", "port": 3002 },
    { "nodeId": 3, "host": "192.168.1.103", "port": 3003 },
    { "nodeId": 4, "host": "192.168.1.104", "port": 3004 }
  ]
}
```

**Laptop 2 (Node 2)** - `config.json`:

```json
{
  "nodeId": 2,
  "port": 3002,
  "peers": [
    { "nodeId": 1, "host": "192.168.1.101", "port": 3001 },
    { "nodeId": 3, "host": "192.168.1.103", "port": 3003 },
    { "nodeId": 4, "host": "192.168.1.104", "port": 3004 }
  ]
}
```

_(Repeat for Nodes 3 and 4)_

### Finding Your IP Address

- **Windows**: `ipconfig` (look for IPv4 Address)
- **Mac/Linux**: `ifconfig` or `ip addr`

### Running the App

1. **Start the app** on each laptop:

   ```bash
   npm start
   ```

2. **Access the GUI** by opening a browser:

   ```
   http://localhost:3001
   ```

   (Use the port number configured for that node)

3. **Initialize the token** on Node 1 (only needed once):
   - Click the "Start Token Ring" button on Node 1's interface

## 🎮 How to Use

1. **Watch the token circulate** - The node currently holding the token is highlighted in green
2. **Send a message** (only when you have the token):
   - Type your message in the text box
   - Select the recipient node
   - Click "Send Message"
3. **View messages** - All sent and received messages appear in the message log
4. **Simulate failure** - Close a node's app to see the token skip it

## 📋 Demo Scenario: Event Planning

Use the app to simulate friends coordinating an event:

- **Node 1**: "I'll book the venue."
- **Node 2**: "I'll handle invitations."
- **Node 3**: "I'll arrange food."
- **Node 4**: "I'll manage decorations."

Each node sends task updates when it receives the token, showing how distributed coordination works!

## 🛠️ Technical Details

- **Algorithm**: Token Ring (ensures only one node can send at a time)
- **Transport**: WebSocket (TCP-based) for reliable real-time communication
- **Frontend**: Simple HTML/CSS/JavaScript GUI
- **Backend**: Node.js with Express and WebSocket Server

## 🐛 Troubleshooting

- **Token not circulating**: Ensure all nodes are running and can reach each other
- **Connection refused**: Check firewall settings and IP addresses in config
- **Messages not appearing**: Verify that the sender has the token (highlighted in green)

## 📚 Key Concepts Demonstrated

- **Mutual Exclusion**: Only the token holder can send messages
- **Fairness**: Every node gets equal opportunity to send
- **Fault Tolerance**: System continues when nodes fail
- **Ring Topology**: Nodes form a logical ring structure

---

**Enjoy demonstrating distributed systems concepts with Message Relay!** 🎉
