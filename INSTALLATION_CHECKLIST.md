# ✅ Installation Verification Checklist

Use this checklist to verify your Message Relay installation is complete and working correctly.

## Pre-Installation Verification

### System Requirements

- [ ] Node.js installed (v14.0.0 or higher)

  ```cmd
  node --version
  ```

  Expected output: `v14.x.x` or higher

- [ ] npm installed (comes with Node.js)

  ```cmd
  npm --version
  ```

  Expected output: `6.x.x` or higher

- [ ] All laptops on same Wi-Fi network (for multi-laptop setup)

---

## Installation Verification

### Step 1: Dependencies

- [ ] Run `npm install` successfully

  ```cmd
  npm install
  ```

  Expected: "added X packages" with no errors

- [ ] Check installed packages
  ```cmd
  npm list --depth=0
  ```
  Expected to see:
  - `express@4.18.2`
  - `ws@8.14.2`
  - `nodemon@3.0.1` (devDependencies)

### Step 2: File Structure

- [ ] All source files present

  ```
  src/
    ├── index.js ✓
    ├── TokenRingNode.js ✓
    └── public/
        ├── index.html ✓
        ├── styles.css ✓
        └── app.js ✓
  ```

- [ ] All configuration templates present

  ```
  config-templates/
    ├── config-node1.json ✓
    ├── config-node2.json ✓
    ├── config-node3.json ✓
    ├── config-node4.json ✓
    └── README.md ✓
  ```

- [ ] All documentation present

  - [ ] README.md
  - [ ] GETTING_STARTED.md
  - [ ] SETUP_GUIDE.md
  - [ ] DEMO_GUIDE.md
  - [ ] QUICK_REFERENCE.md
  - [ ] ARCHITECTURE.md
  - [ ] VISUAL_GUIDE.md
  - [ ] PROJECT_SUMMARY.md
  - [ ] LICENSE

- [ ] Helper scripts present (Windows)
  - [ ] setup.bat
  - [ ] test-local.bat
  - [ ] start.bat

### Step 3: Configuration

- [ ] `config.json` exists in root directory

  - If not, copy from `config-templates/config-node1.json`

- [ ] Configuration is valid JSON

  ```cmd
  node -e "JSON.parse(require('fs').readFileSync('config.json'))"
  ```

  Expected: No output (success) or syntax error details

- [ ] Required fields present in config.json:
  - [ ] `nodeId` (number: 1-4)
  - [ ] `port` (number: 3001-3004)
  - [ ] `tokenTimeout` (number: recommended 5000)
  - [ ] `peers` (array of peer objects)
  - [ ] `isInitialTokenHolder` (boolean: true for Node 1 only)

---

## Local Test Verification

### Step 1: Single Node Test

- [ ] Start one node

  ```cmd
  npm start
  ```

  Expected console output:

  ```
  [Node X] Initialized with ring order: [1, 2, 3, 4]
  [Node X] Starting on port 300X...
  [Node X] Server listening on port 300X
  [Server] HTTP server listening on http://localhost:400X
  ```

- [ ] No error messages in console

- [ ] Open browser to `http://localhost:400X`

  - [ ] Page loads successfully
  - [ ] Shows "Node X" badge
  - [ ] Shows "Waiting for token..." (or "You have the token!" if Node 1)

- [ ] Stop the node (Ctrl+C)
  - [ ] Graceful shutdown message appears

### Step 2: Multi-Node Local Test

- [ ] Run test script

  ```cmd
  test-local.bat
  ```

- [ ] 4 terminal windows open (Node 1, 2, 3, 4)

- [ ] All nodes show "Server listening" messages

- [ ] Open 4 browser tabs:

  - [ ] http://localhost:4001 (Node 1)
  - [ ] http://localhost:4002 (Node 2)
  - [ ] http://localhost:4003 (Node 3)
  - [ ] http://localhost:4004 (Node 4)

- [ ] All pages load successfully

### Step 3: Connection Verification

On each browser tab, check:

- [ ] **Status Bar shows:**

  - Connected Peers: 3 ✓
  - Connection: Connected (green) ✓

- [ ] **Ring Visualization shows:**
  - All 4 nodes visible
  - All nodes colored (blue or green, not gray)
  - Token icon (🎫) visible above one node

### Step 4: Token Circulation Test

- [ ] Token is circulating

  - Watch for 30 seconds
  - Token should visit: 1 → 2 → 3 → 4 → 1
  - Green node changes every ~5 seconds

- [ ] Token status updates correctly

  - "You have the token!" when node is green
  - "Waiting for token..." when node is blue

- [ ] Statistics update:
  - "Tokens Received" increments when your node turns green
  - "Tokens Passed" increments when your node turns blue

### Step 5: Message Sending Test

- [ ] Wait for Node 1 to have token (green)

- [ ] On Node 1, send message to Node 3:

  - [ ] Select "Node 3" from recipient dropdown
  - [ ] Type: "Test message"
  - [ ] Click "Send Message"

- [ ] Verify on Node 1:

  - [ ] Success message appears
  - [ ] Message appears in log (green border)
  - [ ] "Messages Sent: 1"

- [ ] Verify on Node 3:

  - [ ] Message appears in log (blue border)
  - [ ] Shows "From Node 1: Test message"
  - [ ] "Messages Received: 1"

- [ ] Try sending from Node 2 (when it does NOT have token):
  - [ ] Status shows "Message queued"
  - [ ] "Queued: 1" appears in status bar
  - [ ] When Node 2 receives token:
    - [ ] Message auto-sends
    - [ ] "Queued: 0"

### Step 6: Fault Tolerance Test

- [ ] All 4 nodes running and connected

- [ ] Close Node 3's terminal window

- [ ] On other nodes, verify:

  - [ ] "Connected Peers: 2" (reduced from 3)
  - [ ] Node 3 turns gray in ring visualization
  - [ ] Token circulation continues: 1 → 2 → 4 → 1 (skipping 3)

- [ ] Restart Node 3:

  ```cmd
  copy config-templates\config-node3.json config.json
  npm start
  ```

- [ ] Verify recovery:
  - [ ] "Connected Peers: 3" restored
  - [ ] Node 3 turns blue in ring
  - [ ] Token includes Node 3 again: 1 → 2 → 3 → 4 → 1

---

## Multi-Laptop Setup Verification

### Step 1: Network Configuration

On each laptop:

- [ ] Find IP address

  ```cmd
  ipconfig
  ```

- [ ] Write down IP addresses:

  ```
  Laptop 1: ______________
  Laptop 2: ______________
  Laptop 3: ______________
  Laptop 4: ______________
  ```

- [ ] Ping test from Laptop 1 to others:
  ```cmd
  ping <Laptop2-IP>
  ping <Laptop3-IP>
  ping <Laptop4-IP>
  ```
  Expected: Replies received (not "Request timed out")

### Step 2: Installation on Each Laptop

On EACH laptop:

- [ ] Project folder copied
- [ ] `npm install` completed successfully
- [ ] `config.json` created with correct IP addresses
- [ ] Node ID is unique (1, 2, 3, or 4)
- [ ] Only Node 1 has `isInitialTokenHolder: true`

### Step 3: Firewall Configuration

On EACH laptop:

- [ ] Windows Firewall allows Node.js

  - Method 1: Click "Allow" when prompted on first run
  - Method 2: Manually add Node.js to allowed apps

- [ ] Test: Can other laptops connect?
  - From Laptop 2, try: `telnet <Laptop1-IP> 3001`
  - If connection refused, check firewall

### Step 4: Startup Sequence

- [ ] Start Node 1 FIRST on Laptop 1

  ```cmd
  npm start
  ```

  Wait for: "HTTP server listening" message

- [ ] Start Node 2 on Laptop 2

  ```cmd
  npm start
  ```

  Wait for: "Connected to Node 1" message

- [ ] Start Node 3 on Laptop 3

- [ ] Start Node 4 on Laptop 4

### Step 5: Cross-Laptop Verification

On EACH laptop:

- [ ] Open browser to `http://localhost:400X`
- [ ] "Connected Peers: 3" shown
- [ ] All 4 nodes visible in ring (all blue/green, none gray)
- [ ] Token circulating across all laptops

### Step 6: Cross-Laptop Message Test

- [ ] Send message from Laptop 1 to Laptop 3

  - [ ] Visible on Laptop 1 (sent)
  - [ ] Visible on Laptop 3 (received)

- [ ] Send message from Laptop 4 to Laptop 2

  - [ ] Visible on Laptop 4 (sent)
  - [ ] Visible on Laptop 2 (received)

- [ ] All laptops can see their messages in the log

---

## Performance Verification

### Timing Tests

- [ ] Token circulation time: ~20 seconds per full round (4 nodes × 5 seconds)
- [ ] Token hold time: ~5 seconds per node
- [ ] Message delivery: < 1 second when sender has token
- [ ] Message delivery: < 20 seconds when queued (worst case)

### Resource Usage

- [ ] CPU usage: < 5% per node (idle)
- [ ] Memory usage: < 100MB per node
- [ ] Network traffic: Minimal (only token + messages)

### Browser Compatibility

Test in multiple browsers:

- [ ] Chrome / Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac only)

---

## Documentation Verification

### Quick Tests

- [ ] Can follow GETTING_STARTED.md and successfully start local test
- [ ] QUICK_REFERENCE.md commands work as documented
- [ ] SETUP_GUIDE.md multi-laptop instructions are clear
- [ ] VISUAL_GUIDE.md diagrams match actual behavior

---

## Common Issues Checklist

If something doesn't work, check:

### Token Not Circulating

- [ ] Node 1 started first?
- [ ] Node 1 has `isInitialTokenHolder: true`?
- [ ] All nodes show "Connected Peers: 3"?

### Connection Issues

- [ ] All laptops on same Wi-Fi network?
- [ ] IP addresses correct in config.json?
- [ ] Firewall allows Node.js?
- [ ] Ports 3001-3004 not already in use?

### GUI Issues

- [ ] Using HTTP port (4001-4004), not WebSocket port (3001-3004)?
- [ ] Browser console shows no errors? (F12 → Console)
- [ ] Server shows "HTTP server listening" message?

### Message Issues

- [ ] Sender has token (green)?
- [ ] Recipient is connected (not gray)?
- [ ] No errors in server console?

---

## Final Verification

### System Check

- [ ] ✅ All nodes start without errors
- [ ] ✅ Token circulates continuously
- [ ] ✅ Messages send and receive correctly
- [ ] ✅ Fault tolerance works (node failure & recovery)
- [ ] ✅ GUI displays correctly
- [ ] ✅ Statistics update in real-time
- [ ] ✅ Documentation is accurate

### Demo Readiness

- [ ] ✅ Can explain Token Ring concept clearly
- [ ] ✅ Can demonstrate message passing
- [ ] ✅ Can show fault tolerance
- [ ] ✅ Can answer common questions
- [ ] ✅ Backup plan if issues occur

---

## ✅ Verification Complete!

If all items are checked, your Message Relay installation is:

- ✅ **Properly installed**
- ✅ **Fully functional**
- ✅ **Demo ready**

**You're ready to demonstrate the Token Ring Algorithm!** 🎉

---

## Support

If any items are unchecked:

1. See QUICK_REFERENCE.md for troubleshooting
2. Review SETUP_GUIDE.md for detailed steps
3. Check GETTING_STARTED.md for basic instructions
4. Review error messages in terminal console

**Need help?** Double-check configuration files and network connectivity first!
