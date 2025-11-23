# Message Relay - Quick Reference

## Starting the Application

### Single Node

```cmd
npm start
```

### Local Testing (4 nodes on one machine)

```cmd
test-local.bat
```

Then open:

- http://localhost:4001
- http://localhost:4002
- http://localhost:4003
- http://localhost:4004

### Multi-Laptop Setup

1. Configure `config.json` with correct IP addresses
2. Start Node 1 first: `npm start`
3. Start Nodes 2, 3, 4: `npm start`
4. Open browser: `http://localhost:400X`

## Configuration Template

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

**Note:** Only Node 1 should have `isInitialTokenHolder: true`

## Port Numbers

- **WebSocket Ports:** 3001-3004 (Node communication)
- **HTTP Ports:** 4001-4004 (Web GUI)
  - HTTP Port = WebSocket Port + 1000

## Finding Your IP Address

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address"

**Mac/Linux:**

```bash
ifconfig | grep "inet "
# or
ip addr show
```

## GUI Features

### Status Indicators

- 🟢 **Green Node**: Has the token (can send messages)
- 🔵 **Blue Node**: Active and connected
- 🟠 **Orange Node**: This node (you)
- ⚪ **Gray Node**: Disconnected/failed
- 🎫 **Token Icon**: Shows current token holder

### Sending Messages

1. Wait for your node to turn green (has token)
2. Select recipient from dropdown
3. Type your message
4. Click "Send Message"

**Without Token:** Messages are queued and sent automatically when token arrives

### Message Log

- 🟢 **Green Border**: Sent messages
- 🔵 **Blue Border**: Received messages

### Statistics

- **Connected Peers**: Number of active connections (should be 3)
- **Messages Sent**: Total messages sent
- **Messages Received**: Total messages received
- **Queued**: Messages waiting for token

## Common Commands

### Install Dependencies

```cmd
npm install
```

### Run Setup Script (Windows)

```cmd
setup.bat
```

### Check Node Version

```cmd
node --version
```

(Should be v14 or higher)

### Kill Process on Port (if stuck)

**Windows:**

```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Mac/Linux:**

```bash
lsof -ti:3001 | xargs kill -9
```

## Troubleshooting

### Token Not Circulating

- ✅ Start Node 1 first
- ✅ Verify all nodes show "Connected Peers: 3"
- ✅ Check `isInitialTokenHolder: true` only on Node 1

### Can't Connect to Peers

- ✅ All laptops on same network
- ✅ Correct IP addresses in config.json
- ✅ Firewall allows Node.js
- ✅ Test with: `ping <peer-ip>`

### GUI Won't Load

- ✅ Use HTTP port (WebSocket + 1000)
- ✅ Check terminal for "HTTP server listening" message
- ✅ Try: http://localhost:4001 (not 3001)

### Port Already in Use

- ✅ Close other instances
- ✅ Change ports in config.json
- ✅ Kill stuck processes (see above)

## Demo Scenarios

### 1. Event Planning

- Node 1: "I'll book the venue"
- Node 2: "I'll handle invitations"
- Node 3: "I'll arrange food"
- Node 4: "I'll manage decorations"

### 2. Task Updates

- Node 1: "Started database backup"
- Node 2: "Backup verified"
- Node 3: "Logs archived"
- Node 4: "All tasks complete!"

### 3. Fault Tolerance Test

1. Let token circulate normally
2. Close Node 3
3. Observe token skipping Node 3
4. Restart Node 3
5. Watch it rejoin automatically

## Configuration Parameters

| Parameter              | Description                    | Default   |
| ---------------------- | ------------------------------ | --------- |
| `nodeId`               | Unique node identifier (1-4)   | Required  |
| `port`                 | WebSocket port for this node   | 3001-3004 |
| `tokenTimeout`         | Time (ms) before passing token | 5000      |
| `peers`                | Array of other nodes           | Required  |
| `isInitialTokenHolder` | Start with token               | false     |

## File Structure

```
message-relay/
├── src/
│   ├── index.js              # Main server
│   ├── TokenRingNode.js      # Token Ring logic
│   └── public/
│       ├── index.html        # GUI markup
│       ├── styles.css        # GUI styling
│       └── app.js            # GUI logic
├── config-templates/         # Config examples
├── config.json              # Your configuration
├── package.json             # Dependencies
├── README.md                # Main documentation
├── SETUP_GUIDE.md           # Setup instructions
├── DEMO_GUIDE.md            # Demo presentation guide
└── QUICK_REFERENCE.md       # This file
```

## Useful Keyboard Shortcuts

- **Ctrl+C**: Stop the node (in terminal)
- **Ctrl+Enter**: Send message (in GUI)
- **F5**: Refresh browser (reload GUI)

## Support & Resources

- **GitHub**: [Create issues for bugs/features]
- **Documentation**: See README.md for detailed info
- **Setup Help**: See SETUP_GUIDE.md
- **Demo Tips**: See DEMO_GUIDE.md

## Key Concepts

- **Token**: Permission to send messages
- **Ring**: Logical topology, not physical
- **Node**: Individual participant (laptop)
- **Peer**: Other nodes in the ring
- **Mutual Exclusion**: Only one sender at a time
- **Fault Tolerance**: System adapts to failures

---

**Quick Start Checklist:**

- [ ] Run `npm install`
- [ ] Configure `config.json` with IP addresses
- [ ] Allow Node.js through firewall
- [ ] Start Node 1 first
- [ ] Start other nodes
- [ ] Open browser to http://localhost:400X
- [ ] Watch token circulate!

🎯 **You're ready to demonstrate Token Ring!**
