# 🎯 Message Relay - Token Ring Algorithm Demo

## Project Overview

**Message Relay** is a distributed system application that demonstrates the **Token Ring Algorithm** using 4 laptops as nodes in a ring network. It provides a visual, interactive way to understand distributed systems concepts like mutual exclusion, fault tolerance, and fair scheduling.

### Real-Life Analogy

Imagine friends sitting in a circle with a "talking stick" - only the person holding the stick can speak. This app simulates that concept digitally, showing how distributed systems coordinate without a central controller.

---

## ✨ Features Implemented

### Core Features

- ✅ **Token Ring Protocol** - Automatic token circulation among nodes
- ✅ **Message Passing** - Send messages only when holding the token
- ✅ **Message Queueing** - Queue messages when token is unavailable
- ✅ **Visual Ring Display** - Real-time ring topology visualization
- ✅ **Fault Tolerance** - Automatic detection and handling of node failures
- ✅ **Dynamic Recovery** - Failed nodes can rejoin seamlessly
- ✅ **Real-time Updates** - Live status updates via Server-Sent Events (SSE)

### User Interface

- ✅ Interactive web-based GUI
- ✅ Ring topology visualization with animated token
- ✅ Message composition and recipient selection
- ✅ Message log (sent and received)
- ✅ Real-time statistics dashboard
- ✅ Connection status indicators
- ✅ Responsive design

### Technical Implementation

- ✅ WebSocket-based communication (TCP reliable transport)
- ✅ Event-driven architecture
- ✅ Automatic reconnection handling
- ✅ Configurable token timeout
- ✅ Multi-peer connection management
- ✅ State synchronization

---

## 📁 Project Structure

```
message-relay/
├── src/
│   ├── index.js                # Main application server
│   ├── TokenRingNode.js        # Token Ring algorithm implementation
│   └── public/
│       ├── index.html          # GUI markup
│       ├── styles.css          # Styling and animations
│       └── app.js              # Client-side logic
├── config-templates/
│   ├── config-node1.json       # Template for Node 1
│   ├── config-node2.json       # Template for Node 2
│   ├── config-node3.json       # Template for Node 3
│   ├── config-node4.json       # Template for Node 4
│   └── README.md               # Config instructions
├── config.json                 # Active configuration
├── package.json                # Dependencies
├── .gitignore                  # Git ignore rules
├── README.md                   # Main documentation
├── SETUP_GUIDE.md              # Multi-laptop setup instructions
├── DEMO_GUIDE.md               # Presentation and demo guide
├── QUICK_REFERENCE.md          # Quick reference card
├── ARCHITECTURE.md             # System architecture diagrams
├── PROJECT_SUMMARY.md          # This file
├── setup.bat                   # Windows setup script
├── test-local.bat              # Local testing script (4 nodes)
└── start.bat                   # Quick start script
```

---

## 🛠️ Technology Stack

### Backend

- **Node.js** - Runtime environment
- **Express** - HTTP server framework
- **WebSocket (ws)** - Real-time bidirectional communication
- **Server-Sent Events** - Push notifications to browser

### Frontend

- **HTML5** - Structure
- **CSS3** - Styling with gradients, animations
- **Vanilla JavaScript** - Client-side logic (no frameworks)
- **SVG** - Ring visualization graphics

### Protocols

- **WebSocket** - Token and message passing
- **HTTP/REST** - API endpoints
- **SSE** - Real-time UI updates

---

## 🎮 How to Use

### Quick Start (Local Testing)

1. **Install dependencies:**

   ```cmd
   npm install
   ```

2. **Run all 4 nodes locally:**

   ```cmd
   test-local.bat
   ```

3. **Open browsers:**

   - http://localhost:4001 (Node 1)
   - http://localhost:4002 (Node 2)
   - http://localhost:4003 (Node 3)
   - http://localhost:4004 (Node 4)

4. **Watch the token circulate and send messages!**

### Multi-Laptop Setup

1. Install on all 4 laptops
2. Configure `config.json` with correct IP addresses
3. Start Node 1 first
4. Start Nodes 2, 3, 4
5. Open browsers on each laptop

**See SETUP_GUIDE.md for detailed instructions**

---

## 🎓 Demonstrated Concepts

### 1. Token Ring Algorithm

- Logical ring topology
- Token-based mutual exclusion
- Fair scheduling (round-robin)
- Deterministic behavior

### 2. Distributed Systems

- No central server (peer-to-peer)
- Decentralized control
- Eventual consistency
- State replication

### 3. Fault Tolerance

- Failure detection (WebSocket disconnection)
- Automatic recovery (skip failed nodes)
- Graceful degradation
- Self-healing (node rejoin)

### 4. Networking

- TCP-based reliable communication
- WebSocket for bidirectional messages
- Real-time event streaming (SSE)
- Connection management

### 5. Concurrency Control

- Mutual exclusion via token
- Message queuing
- Asynchronous operations
- Event-driven programming

---

## 📊 System Characteristics

### Performance

- **Token Circulation:** ~20 seconds per full round (4 nodes)
- **Token Hold Time:** 5 seconds per node (configurable)
- **Message Latency:** 0-15 seconds (depends on token position)
- **Throughput:** ~0.8 messages/second (system-wide)

### Scalability

- Currently configured for 4 nodes
- Extensible to N nodes (with trade-offs)
- Larger rings = Longer wait times
- Can reduce tokenTimeout to compensate

### Reliability

- Automatic failure detection (< 1 second)
- Immediate adaptation (token skips failed nodes)
- Auto-reconnection every 5 seconds
- No single point of failure

---

## 🎬 Demo Scenarios

### Scenario 1: Event Planning

Simulate friends coordinating an event:

- Node 1: "I'll book the venue!"
- Node 2: "I'll handle invitations!"
- Node 3: "I'll arrange food!"
- Node 4: "I'll manage decorations!"

### Scenario 2: Fault Tolerance

1. Let token circulate normally
2. Close Node 3 (simulate failure)
3. Observe token skipping Node 3
4. Restart Node 3
5. Watch automatic recovery

### Scenario 3: Message Queueing

1. Try sending from Node 2 without token
2. Message gets queued ("Queued: 1")
3. When token arrives, message auto-sends
4. Queue returns to 0

---

## 📚 Documentation Files

| File                 | Purpose                               |
| -------------------- | ------------------------------------- |
| `README.md`          | Overview, features, installation      |
| `SETUP_GUIDE.md`     | Multi-laptop network setup            |
| `DEMO_GUIDE.md`      | Presentation and demo instructions    |
| `QUICK_REFERENCE.md` | Commands, shortcuts, troubleshooting  |
| `ARCHITECTURE.md`    | System design and diagrams            |
| `PROJECT_SUMMARY.md` | This file - complete project overview |

---

## 🚀 Future Enhancements

### Possible Extensions

1. **Security:**

   - Encrypted communication (WSS)
   - Node authentication
   - Message signing

2. **Features:**

   - Broadcast messages (to all nodes)
   - Message priorities
   - Token regeneration (if lost)
   - Variable token timeout per node
   - Message acknowledgments

3. **UI Improvements:**

   - Message flow animation
   - Performance metrics dashboard
   - Historical statistics
   - Dark mode

4. **Scalability:**

   - Dynamic node addition/removal
   - Multiple rings
   - Leader election
   - Load balancing

5. **Mobile:**
   - React Native app
   - Bluetooth mesh network
   - GPS-based location ring

---

## 🎓 Educational Value

### Learning Outcomes

Students/participants will understand:

- How token-based mutual exclusion works
- Distributed coordination without central control
- Fault tolerance in distributed systems
- Real-time networking with WebSockets
- Event-driven architecture
- State management in distributed systems

### Target Audience

- Computer Science students (distributed systems course)
- Software engineers (learning distributed concepts)
- Tech enthusiasts (exploring networking)
- Conference/workshop demonstrations

### Difficulty Level

- **Implementation:** Intermediate (Node.js, WebSocket, async programming)
- **Concepts:** Beginner to Intermediate (clear real-life analogy)
- **Setup:** Easy (well-documented, helper scripts)

---

## 🐛 Known Limitations

1. **Token Loss:** No token regeneration if all nodes fail simultaneously
2. **Security:** No authentication or encryption (educational demo)
3. **Scalability:** Performance degrades with many nodes (linear wait time)
4. **Network:** Requires same LAN (no NAT traversal)
5. **Browser:** Requires modern browser (ES6+, SSE support)

---

## 🏆 Key Achievements

### Technical

- ✅ Full Token Ring implementation
- ✅ Robust fault tolerance
- ✅ Real-time visualization
- ✅ Clean, modular code
- ✅ Event-driven architecture

### Documentation

- ✅ Comprehensive README
- ✅ Step-by-step setup guide
- ✅ Demo presentation script
- ✅ Quick reference card
- ✅ Architecture diagrams

### User Experience

- ✅ Intuitive GUI
- ✅ Visual feedback (colors, animations)
- ✅ Real-time updates
- ✅ Easy setup scripts
- ✅ Cross-platform support

---

## 🤝 Contributing

### How to Extend

1. **Fork the project**
2. **Add your feature:**
   - Modify `TokenRingNode.js` for protocol changes
   - Update `index.html` and `app.js` for UI changes
3. **Test locally** with `test-local.bat`
4. **Document your changes**
5. **Share your enhancements!**

### Suggested Projects

- **Advanced:** Implement Byzantine Fault Tolerance
- **Medium:** Add message priorities (express vs. normal)
- **Easy:** Add sound notifications for token arrival
- **UI:** Animate message flow between nodes
- **Mobile:** Create a mobile app version

---

## 📞 Support

### Getting Help

- Read `QUICK_REFERENCE.md` for common issues
- Check `SETUP_GUIDE.md` for configuration help
- Review `ARCHITECTURE.md` for technical details
- See `DEMO_GUIDE.md` for troubleshooting during demos

### Common Issues

1. **Token not circulating** → Check Node 1 started first
2. **Can't connect** → Verify IP addresses and firewall
3. **GUI not loading** → Use HTTP port (WebSocket + 1000)
4. **Port in use** → Kill existing processes or change ports

---

## 📝 License

MIT License - Free to use, modify, and distribute for educational purposes.

---

## 🎉 Conclusion

**Message Relay** successfully demonstrates the Token Ring Algorithm in a tangible, visual way. It makes abstract distributed systems concepts concrete and understandable through a real-life analogy (talking stick) and hands-on interaction.

### Success Criteria Met:

✅ Simple and relatable (event planning scenario)  
✅ Visual demonstration (animated ring)  
✅ Real distributed system (4 laptops)  
✅ Fault tolerance (node failures)  
✅ Easy to set up and demo  
✅ Well documented

### Perfect For:

- 🎓 Classroom demonstrations
- 👥 Conference presentations
- 🧪 Learning distributed systems
- 💼 Technical interviews (explaining concepts)
- 🎪 Science fairs / tech exhibitions

---

**Ready to demonstrate Token Ring? Start with `test-local.bat` and explore! 🚀**
