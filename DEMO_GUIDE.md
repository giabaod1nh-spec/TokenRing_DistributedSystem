# Message Relay - Demo Presentation Guide

This guide will help you present and demonstrate the Token Ring Algorithm using the Message Relay app.

## Pre-Demo Setup (15 minutes before)

### Equipment Checklist

- [ ] 4 laptops with app installed and configured
- [ ] All laptops connected to same Wi-Fi network
- [ ] Tested connectivity between all nodes
- [ ] Projection screen or TV (optional, for audience)
- [ ] Printed handouts of ring topology diagram (optional)

### Software Checklist

- [ ] Node.js installed on all laptops
- [ ] Dependencies installed (`npm install` on each)
- [ ] config.json properly configured with correct IP addresses
- [ ] Firewall configured to allow connections
- [ ] Browsers ready at http://localhost:400X

### Test Run

1. Start all 4 nodes (Node 1 first, then others)
2. Verify all nodes show "Connected Peers: 3"
3. Watch token circulate at least 2 full rounds
4. Send a test message from each node
5. Simulate a failure and recovery
6. Close all nodes (ready for live demo)

## Demo Structure (20-30 minutes)

### Part 1: Introduction (5 minutes)

**What is Token Ring?**

- A distributed system algorithm from the 1980s
- Used in early computer networks (Token Ring LAN)
- Ensures fair access to shared resources
- Only one entity can "speak" at a time

**Real-Life Analogy:**

> "Imagine sitting in a circle with friends, passing around a talking stick. Only the person holding the stick can speak. This ensures everyone gets a fair turn and no one talks over each other."

**Today's Demo:**

- 4 laptops representing 4 friends/coworkers
- Passing messages in an orderly fashion
- Demonstrating key distributed systems concepts

### Part 2: Live Demo - Basic Operation (10 minutes)

#### 2.1 Starting the Ring (2 minutes)

**Action:**

1. Show all 4 laptops (arrange them in a circle if possible)
2. Start Node 1: `npm start`
   - Show terminal output: "Initializing token circulation"
3. Start Nodes 2, 3, 4
   - Show them connecting to the ring

**Key Points to Explain:**

- Node 1 is the initial token holder
- Each node establishes connections with all other nodes
- Ring topology forms: 1 → 2 → 3 → 4 → 1

**What to Show:**

- Point to "Connected Peers: 3" on each laptop
- Show the ring visualization with all nodes active (blue)

#### 2.2 Token Circulation (3 minutes)

**Action:**

1. Open browser on Node 1: http://localhost:4001
2. Project this screen for the audience
3. Watch the token circulate

**Key Points to Explain:**

- Green node = has the token
- Token moves: 1 → 2 → 3 → 4 → 1 → ...
- Each node holds token for 5 seconds
- The token provides **mutual exclusion**

**What to Show:**

- Point to the token (🎫) icon above the green node
- Show the status changing: "You have the token!" / "Waiting for token..."
- Count the token circulation: "1, 2, 3, 4, 1, 2..."

#### 2.3 Message Passing (5 minutes)

**Scenario:** Event Planning Coordination

**Action:**

1. **Node 1** (when green):

   - Select "Node 2" as recipient
   - Type: "I'll book the venue!"
   - Click "Send Message"
   - Show message appearing on both Node 1 and Node 2 screens

2. **Node 2** (when green):

   - Select "Node 3"
   - Type: "I'll handle invitations!"
   - Send

3. **Node 3** (when green):

   - Select "Node 4"
   - Type: "I'll arrange food!"
   - Send

4. **Node 4** (when green):
   - Select "Node 1"
   - Type: "I'll manage decorations!"
   - Send

**Key Points to Explain:**

- Can only send when you have the token (green)
- Messages are point-to-point (sender → receiver)
- The message log shows sent (green) and received (blue) messages
- This ensures **orderly communication**

**What to Show:**

- The send button is disabled when you don't have the token
- Message appears in both sender's and receiver's logs
- Statistics update: "Messages Sent" and "Messages Received"

### Part 3: Advanced Features (10 minutes)

#### 3.1 Message Queueing (3 minutes)

**Action:**

1. Go to Node 2 (while it does NOT have the token)
2. Try to send a message:

   - Select "Node 4"
   - Type: "This message is queued!"
   - Click "Send"
   - Show status: "Message queued (will send when token is received)"

3. Watch the "Queued: 1" counter
4. Wait for Node 2 to receive the token
5. Message automatically sends!
6. "Queued: 0"

**Key Points to Explain:**

- If you don't have the token, messages are queued
- When token arrives, queued messages send automatically
- This provides **asynchronous communication** with guaranteed delivery

#### 3.2 Fault Tolerance (4 minutes)

**Action:**

1. Show all 4 nodes running smoothly
2. **Simulate Node 3 Failure:**

   - Close/terminate Node 3's application
   - Or: Disconnect Node 3's network

3. **Observe the Adaptation:**

   - On other nodes, watch Node 3 turn gray (disconnected)
   - Token now skips Node 3: 1 → 2 → 4 → 1 → 2 → 4...
   - "Connected Peers: 2" on remaining nodes

4. **System Continues:**

   - Send messages between remaining nodes
   - Everything works normally, just without Node 3

5. **Recovery:**
   - Restart Node 3
   - Watch it reconnect (turns blue)
   - Token circulation resumes: 1 → 2 → 3 → 4 → 1
   - "Connected Peers: 3" restored

**Key Points to Explain:**

- System is **fault tolerant**
- Failed nodes are automatically detected and skipped
- Remaining nodes continue operating
- Failed nodes can rejoin seamlessly
- This is critical for real-world distributed systems

**What to Show:**

- Visual change in ring (gray = failed)
- Changed token path
- Automatic recovery when node restarts

#### 3.3 Dynamic Scalability (3 minutes)

**Optional:** If you have a 5th laptop, demonstrate adding a node

**Key Points to Explain:**

- In theory, the ring can grow or shrink dynamically
- New nodes can be added by updating the configuration
- This shows **scalability** of distributed systems

### Part 4: Technical Deep Dive (5 minutes)

**Explain the Implementation:**

1. **Architecture:**

   - Node.js backend with WebSocket communication
   - Real-time web interface
   - Event-driven programming

2. **Token Ring Algorithm:**

   - Logical ring topology (not physical)
   - Token passing: `node.passToken(nextNode)`
   - Token timeout: 5 seconds per node
   - Skip failed nodes automatically

3. **Communication:**

   - WebSocket for real-time bidirectional communication
   - Server-Sent Events (SSE) for GUI updates
   - Reliable TCP-based transport

4. **Fault Detection:**
   - Connection monitoring
   - Automatic reconnection attempts
   - Active node tracking

**Show the Code:** (if technical audience)

- Open `src/TokenRingNode.js`
- Point to key methods:
  - `_passToken()` - Token passing logic
  - `_getNextNode()` - Skip failed nodes
  - `sendMessage()` - Message queuing

## Key Takeaways (Summary)

**Token Ring Algorithm Demonstrates:**

1. ✅ **Mutual Exclusion**

   - Only one node can send at a time
   - Prevents conflicts and collisions

2. ✅ **Fair Scheduling**

   - Every node gets equal opportunity
   - Round-robin fashion

3. ✅ **Fault Tolerance**

   - System adapts to node failures
   - Automatic recovery

4. ✅ **Distributed Coordination**

   - Multiple independent machines working together
   - No central controller needed

5. ✅ **Predictable Behavior**
   - Deterministic token circulation
   - Guaranteed message delivery (eventually)

**Real-World Applications:**

- Network protocols (historical Token Ring LANs)
- Resource scheduling in distributed systems
- Database transaction management
- IoT device coordination
- Blockchain consensus mechanisms (modern variants)

## Q&A Preparation

**Common Questions:**

**Q: Why not use a central server?**
A: Token Ring is decentralized - no single point of failure. Each node is equal.

**Q: What if the token gets lost?**
A: In production systems, token regeneration mechanisms exist (not implemented in this demo).

**Q: Is this still used today?**
A: Token Ring LANs are obsolete, but the algorithm inspires modern distributed systems (e.g., leader election).

**Q: How does it compare to Ethernet?**
A: Ethernet uses collision detection (CSMA/CD), Token Ring uses collision avoidance. Token Ring is deterministic.

**Q: Can messages be sent to multiple recipients?**
A: Currently point-to-point. Broadcast could be added as an extension.

**Q: What happens with network delays?**
A: Token timeout handles this. If token isn't passed in time, the next node can regenerate it.

## Demo Troubleshooting

**Issue: Token not circulating**

- Check Node 1 started first
- Verify all nodes show 3 connected peers
- Restart all nodes in order: 1, 2, 3, 4

**Issue: Nodes can't connect**

- Check IP addresses in config.json
- Ping test between laptops
- Check firewall settings

**Issue: GUI not loading**

- Verify HTTP port (add 1000 to WebSocket port)
- Check browser console for errors
- Ensure `npm start` completed successfully

**Issue: Messages not appearing**

- Check token status (must be green to send)
- Verify recipient is connected (not gray)
- Look at queued messages counter

## Post-Demo Activities

**For Participants to Try:**

1. Modify token timeout (make it faster/slower)
2. Add a 5th node to the ring
3. Implement broadcast messages
4. Add message priorities
5. Visualize message flow (not just token)

**Code Extensions:**

- Token regeneration on timeout
- Encrypted messages
- Message acknowledgments
- Performance statistics dashboard
- Mobile app version

---

**Good luck with your demo! 🎉**

Remember: The goal is to make distributed systems concepts tangible and understandable through this hands-on demonstration.
