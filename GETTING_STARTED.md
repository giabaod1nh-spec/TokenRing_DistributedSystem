# 🚀 Getting Started - First Time Setup

Welcome to **Message Relay**! This guide will get you up and running in 5 minutes.

## What You'll Need

- ✅ Node.js installed (v14 or higher)
- ✅ A text editor (for configuration)
- ✅ A web browser

## Option 1: Quick Local Test (Recommended First)

**Test all 4 nodes on your computer before setting up multiple laptops**

### Step 1: Install Dependencies

Open a terminal/command prompt in the project folder and run:

```cmd
npm install
```

Wait for installation to complete (~30 seconds).

### Step 2: Run Local Test

**Windows:**

```cmd
test-local.bat
```

**Mac/Linux:**

```bash
chmod +x test-local.sh
./test-local.sh
```

This will open 4 terminal windows, one for each node.

### Step 3: Open Browsers

Open 4 browser tabs:

1. http://localhost:4001 (Node 1)
2. http://localhost:4002 (Node 2)
3. http://localhost:4003 (Node 3)
4. http://localhost:4004 (Node 4)

### Step 4: Watch It Work! 🎉

- **Observe:** The green node has the token and moves in a circle
- **Try Sending:** When a node turns green, select a recipient and send a message
- **See Messages:** Watch messages appear on both sender and receiver screens

### Step 5: Test Failure Handling

- Close one of the terminal windows (simulating a node failure)
- Watch the token skip that node
- Restart the window to see it rejoin

**✅ Congratulations! You've successfully tested Token Ring locally!**

---

## Option 2: Multi-Laptop Setup

**After testing locally, try the real distributed setup with 4 laptops**

### Step 1: Find IP Addresses

On **each laptop**, open terminal/command prompt:

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address" (e.g., 192.168.1.101)

**Mac/Linux:**

```bash
ifconfig | grep inet
```

Write them down:

```
Laptop 1: ________________
Laptop 2: ________________
Laptop 3: ________________
Laptop 4: ________________
```

### Step 2: Install on Each Laptop

1. Copy the project folder to each laptop
2. On each laptop, run:
   ```cmd
   npm install
   ```

### Step 3: Configure Each Laptop

On **each laptop**, create/edit `config.json`:

**Laptop 1:**

```json
{
  "nodeId": 1,
  "port": 3001,
  "tokenTimeout": 5000,
  "peers": [
    { "nodeId": 2, "host": "PUT_LAPTOP_2_IP_HERE", "port": 3002 },
    { "nodeId": 3, "host": "PUT_LAPTOP_3_IP_HERE", "port": 3003 },
    { "nodeId": 4, "host": "PUT_LAPTOP_4_IP_HERE", "port": 3004 }
  ],
  "isInitialTokenHolder": true
}
```

**Laptop 2-4:** Similar, but change `nodeId` and `isInitialTokenHolder: false`

**💡 Tip:** Use the templates in `config-templates/` folder as starting points!

### Step 4: Check Firewall

Make sure Windows Firewall allows Node.js:

- When you first run, Windows will ask → Click "Allow"
- Or manually: Windows Defender Firewall → Allow an app → Node.js

### Step 5: Start Nodes IN ORDER

**Important:** Start Node 1 first!

**On Laptop 1:**

```cmd
npm start
```

Wait until you see: "HTTP server listening on http://localhost:4001"

**On Laptops 2, 3, 4:**

```cmd
npm start
```

### Step 6: Open Browsers

On each laptop, open browser:

- Laptop 1: http://localhost:4001
- Laptop 2: http://localhost:4002
- Laptop 3: http://localhost:4003
- Laptop 4: http://localhost:4004

### Step 7: Verify Connection

Check each screen:

- ✅ "Connected Peers: 3" (should show 3 on each)
- ✅ All nodes appear blue in the ring (not gray)
- ✅ Token is circulating (green node moving)

**✅ Success! You have a distributed Token Ring system!**

---

## Troubleshooting Quick Fixes

### Problem: "npm install" fails

**Solution:**

```cmd
# Check Node.js version (should be 14+)
node --version

# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Problem: Token not circulating

**Solution:**

1. Stop all nodes (Ctrl+C)
2. Start Node 1 FIRST
3. Wait 5 seconds
4. Start Nodes 2, 3, 4

### Problem: Can't connect between laptops

**Solution:**

1. **Test network:** Ping from Laptop 1 to 2:

   ```cmd
   ping 192.168.1.102
   ```

   Should get replies. If not, check Wi-Fi.

2. **Check firewall:** Temporarily disable to test
3. **Verify IPs:** Make sure config.json has correct addresses

### Problem: "Port already in use"

**Solution:**

```cmd
# Find what's using the port
netstat -ano | findstr :3001

# Kill the process (use PID from above)
taskkill /PID <number> /F

# Or: Change port in config.json
```

### Problem: GUI won't load

**Solution:**

- Use HTTP port: `localhost:4001` (NOT 3001)
- WebSocket port: 3001
- HTTP port: 4001 (WebSocket + 1000)

---

## Next Steps

### Learn More

- 📖 Read `README.md` for detailed features
- 🏗️ Check `ARCHITECTURE.md` to understand how it works
- 🎬 See `DEMO_GUIDE.md` for presentation tips

### Try This

1. **Event Planning Demo:**

   - Node 1: "I'll book the venue"
   - Node 2: "I'll send invitations"
   - Node 3: "I'll arrange food"
   - Node 4: "I'll handle decorations"

2. **Simulate Failure:**

   - Close Node 3
   - Watch token skip it
   - Restart Node 3
   - See it rejoin

3. **Queue Messages:**
   - Try sending when you DON'T have token
   - See "Queued: 1"
   - Watch it auto-send when token arrives

### Customize

- Change `tokenTimeout` in config.json (default: 5000ms)
- Modify colors in `src/public/styles.css`
- Add more nodes (update config for all nodes)

---

## Help & Support

### Still Having Issues?

1. **Check logs:** Look at terminal output for error messages
2. **Read troubleshooting:** See `QUICK_REFERENCE.md`
3. **Review setup:** Double-check `SETUP_GUIDE.md`

### Common Mistakes

❌ **Starting nodes in wrong order** → Always start Node 1 first  
❌ **Wrong IP addresses** → Double-check with `ipconfig`  
❌ **Wrong port in browser** → Use 4001-4004, not 3001-3004  
❌ **Firewall blocking** → Allow Node.js through firewall  
❌ **Not same network** → All laptops must be on same Wi-Fi

---

## You're Ready! 🎉

**Local Test:** `test-local.bat` → Open 4 browser tabs → Send messages!

**Multi-Laptop:** Configure IPs → Start Node 1 → Start others → Browse!

**Enjoy demonstrating the Token Ring Algorithm!**

---

_Need help? Check `QUICK_REFERENCE.md` for commands and solutions._
