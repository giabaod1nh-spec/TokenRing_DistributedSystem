# Message Relay - System Architecture

## Token Ring Topology

```
                    Node 1 🎫
                   (Has Token)
                       /\
                      /  \
                     /    \
                    /      \
                   /        \
                  /          \
                 /            \
                /              \
               /                \
        Node 4                   Node 2
         /\                          /\
        /  \                        /  \
       /    \                      /    \
      /      \                    /      \
     /        \                  /        \
    /          \                /          \
   /            \              /            \
  /              \            /              \
 /________________\__________/_________________\
         |                  |
         |                  |
      Node 3             (Token Flow)
```

**Token Circulation:** 1 → 2 → 3 → 4 → 1 → 2 → ...

## System Components

```
┌─────────────────────────────────────────────────────┐
│                   Laptop 1 (Node 1)                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────┐         ┌──────────────────┐  │
│  │  Web Browser    │◄────────┤  HTTP Server     │  │
│  │  (GUI)          │  HTTP   │  (Port 4001)     │  │
│  │  localhost:4001 │         │  Express + SSE   │  │
│  └─────────────────┘         └────────┬─────────┘  │
│                                        │             │
│                              ┌─────────▼─────────┐  │
│                              │  TokenRingNode    │  │
│                              │  - State Machine  │  │
│                              │  - Token Logic    │  │
│                              │  - Message Queue  │  │
│                              └─────────┬─────────┘  │
│                                        │             │
│                              ┌─────────▼─────────┐  │
│                              │  WebSocket Server │  │
│                              │  (Port 3001)      │  │
│                              └─────────┬─────────┘  │
└────────────────────────────────────────┼───────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    │                    │                    │
┌───────────────────▼─────┐  ┌──────────▼──────┐  ┌─────────▼──────────┐
│  Node 2 (192.168.1.102) │  │  Node 3         │  │  Node 4            │
│  WebSocket Port: 3002   │  │  Port: 3003     │  │  Port: 3004        │
└─────────────────────────┘  └─────────────────┘  └────────────────────┘
```

## Message Flow

### Scenario: Node 1 sends message to Node 3

```
Step 1: Node 1 has token
┌──────────┐
│  Node 1  │ hasToken = true
│    🎫    │
└──────────┘

Step 2: User sends message via GUI
┌──────────┐     HTTP POST      ┌──────────────┐
│ Browser  │ ───────────────────►│ HTTP Server  │
│ (4001)   │  {to: 3, msg: "Hi"}│   (Express)  │
└──────────┘                     └──────┬───────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ TokenRingNode   │
                              │ sendMessage()   │
                              └────────┬────────┘

Step 3: Send via WebSocket
┌──────────┐                     ┌──────────┐
│  Node 1  │  WebSocket (3001►3003)  │  Node 3  │
│   WS     │ ───────────────────────►│   WS     │
│  Client  │  {type: 'message',      │  Server  │
└──────────┘   to: 3, content: "Hi"} └──────────┘

Step 4: Node 3 receives and displays
┌──────────┐                     ┌──────────┐
│  Node 3  │      SSE Update     │ Browser  │
│  HTTP    │ ───────────────────►│  (4003)  │
│  Server  │  {type: 'messages'} │   GUI    │
└──────────┘                     └──────────┘

Step 5: Node 1 passes token
┌──────────┐                     ┌──────────┐
│  Node 1  │  {type: 'token'}    │  Node 2  │
│          │ ───────────────────►│    🎫    │
└──────────┘                     └──────────┘
     hasToken = false              hasToken = true
```

## Token Passing State Machine

```
┌─────────────────────────────────────────────────┐
│                  Node States                    │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌──────────────┐                             │
│   │  WAITING     │                             │
│   │  hasToken=false                           │
│   └──────┬───────┘                             │
│          │                                      │
│          │ Receive TOKEN message                │
│          │                                      │
│          ▼                                      │
│   ┌──────────────┐                             │
│   │  HAS_TOKEN   │                             │
│   │  hasToken=true                            │
│   └──────┬───────┘                             │
│          │                                      │
│          │ After tokenTimeout (5s)              │
│          │ OR message sent                      │
│          │                                      │
│          ▼                                      │
│   ┌──────────────┐                             │
│   │ PASS_TOKEN   │                             │
│   │ Send to next │                             │
│   └──────┬───────┘                             │
│          │                                      │
│          │ Token sent                           │
│          │                                      │
│          └──────► Back to WAITING              │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Fault Tolerance Flow

```
Normal Operation:
┌────┐    ┌────┐    ┌────┐    ┌────┐
│ 1  │───►│ 2  │───►│ 3  │───►│ 4  │───┐
└────┘    └────┘    └────┘    └────┘   │
   ▲                                     │
   └─────────────────────────────────────┘

Node 3 Fails:
┌────┐    ┌────┐    ┌────┐    ┌────┐
│ 1  │───►│ 2  │───►│ X  │    │ 4  │
└────┘    └────┘    └────┘    └────┘
   ▲         │                    ▲
   │         └────────────────────┘
   │         (Token skips Node 3)  │
   └────────────────────────────────┘

Detection Process:
1. WebSocket connection closes
2. Node removed from activeNodes Set
3. Next token pass calls _getNextNode()
4. _getNextNode() skips inactive nodes
5. Token continues to next active node

Recovery Process:
1. Failed node restarts
2. Reconnects to peers via WebSocket
3. Handshake establishes connection
4. Added back to activeNodes Set
5. Token includes it in next pass
```

## Communication Protocols

### WebSocket Messages

```javascript
// Token message
{
  type: 'token',
  from: 1,
  timestamp: 1234567890
}

// Application message
{
  type: 'message',
  from: 1,
  to: 3,
  content: 'Hello, Node 3!',
  timestamp: 1234567890
}

// Handshake
{
  type: 'handshake',
  from: 2,
  timestamp: 1234567890
}

// Heartbeat (optional future enhancement)
{
  type: 'heartbeat',
  from: 1,
  timestamp: 1234567890
}
```

### HTTP REST API

```
GET  /api/status         → Node status (token, peers, stats)
GET  /api/messages       → Message history
POST /api/send-message   → Queue/send message
GET  /api/config         → Node configuration
GET  /api/events         → SSE stream (real-time updates)
```

### Server-Sent Events (SSE)

```javascript
// Status update
{
  type: 'status',
  data: {
    nodeId: 1,
    hasToken: true,
    activeNodes: [1, 2, 3, 4],
    stats: {...}
  }
}

// Messages update
{
  type: 'messages',
  data: [
    {from: 1, to: 2, content: 'Hello', direction: 'sent'},
    ...
  ]
}
```

## Network Ports Reference

```
┌────────────────────────────────────────────────────┐
│ Node 1                                             │
├────────────────────────────────────────────────────┤
│ WebSocket Server: 3001  (Token Ring protocol)     │
│ HTTP Server:      4001  (Web GUI)                 │
│ WebSocket Clients: → 3002, 3003, 3004             │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Node 2                                             │
├────────────────────────────────────────────────────┤
│ WebSocket Server: 3002                             │
│ HTTP Server:      4002                             │
│ WebSocket Clients: → 3001, 3003, 3004             │
└────────────────────────────────────────────────────┘

(Similarly for Nodes 3 and 4)
```

## Data Structures

### TokenRingNode Class

```javascript
class TokenRingNode {
  // Configuration
  nodeId: number
  port: number
  peers: Array<{nodeId, host, port}>
  tokenTimeout: number

  // State
  hasToken: boolean
  tokenTimeoutId: Timeout

  // Network
  server: WebSocket.Server
  connections: Map<nodeId, WebSocket>
  activeNodes: Set<nodeId>

  // Messages
  messageQueue: Array<Message>

  // Statistics
  stats: {
    messagesSent: number
    messagesReceived: number
    tokensPassed: number
    tokensReceived: number
  }
}
```

## Performance Characteristics

```
Token Circulation Time:
- With 4 nodes: ~20 seconds per full round
- Per node: 5 seconds (configurable via tokenTimeout)

Message Latency:
- Best case: Immediate (if sender has token)
- Worst case: ~15 seconds (wait for full round)
- Average: ~10 seconds

Throughput:
- Max messages/second: 0.2 per node (1 msg per 5s)
- Total system: 0.8 messages/second (4 nodes)

Fault Recovery:
- Detection: < 1 second (WebSocket close event)
- Adaptation: Immediate (next token pass)
- Rejoin: 2-5 seconds (reconnection + handshake)
```

## Scalability Analysis

```
Number of Nodes | Ring Circumference | Average Wait Time
----------------|--------------------|-----------------
2 nodes         | 10 seconds         | 5 seconds
4 nodes         | 20 seconds         | 10 seconds
6 nodes         | 30 seconds         | 15 seconds
8 nodes         | 40 seconds         | 20 seconds
10 nodes        | 50 seconds         | 25 seconds

Trade-off: More nodes = Longer wait times for token
Solution: Reduce tokenTimeout (but increases network traffic)
```

## Security Considerations

**Current Implementation:**

- ❌ No authentication
- ❌ No encryption (plain WebSocket)
- ❌ No message integrity checks
- ❌ No access control

**Production Enhancements:**

- ✅ Use WSS (WebSocket Secure) with TLS
- ✅ Add node authentication (shared secret or PKI)
- ✅ Sign messages with HMAC or digital signatures
- ✅ Encrypt message content (AES)
- ✅ Validate node IDs and message formats

---

**This architecture demonstrates key distributed systems concepts in a simple, educational way!**
