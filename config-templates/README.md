# Configuration Templates for Multi-Laptop Setup

This folder contains configuration templates for setting up the Message Relay app across 4 different laptops.

## Setup Instructions

### 1. Find IP Addresses

On each laptop, find its IP address:

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network adapter (e.g., 192.168.1.101)

**Mac/Linux:**

```bash
ifconfig
# or
ip addr
```

### 2. Configure Each Node

For each laptop, copy the appropriate config template to `config.json` in the root directory and update the IP addresses.

**Example for 4 Laptops:**

Assume the following IP addresses:

- Laptop 1: 192.168.1.101
- Laptop 2: 192.168.1.102
- Laptop 3: 192.168.1.103
- Laptop 4: 192.168.1.104

**Laptop 1 - config.json:**

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

**Laptop 2 - config.json:**

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

**Laptop 3 - config.json:**

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

**Laptop 4 - config.json:**

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

### 3. Testing Locally (Single Machine)

For testing on a single machine, use the provided templates as-is (they use localhost).

Run each node in a separate terminal:

**Terminal 1:**

```cmd
copy config-templates\config-node1.json config.json
npm start
```

**Terminal 2:**

```cmd
copy config-templates\config-node2.json config.json
npm start
```

**Terminal 3:**

```cmd
copy config-templates\config-node3.json config.json
npm start
```

**Terminal 4:**

```cmd
copy config-templates\config-node4.json config.json
npm start
```

Then open browsers:

- http://localhost:4001 (Node 1)
- http://localhost:4002 (Node 2)
- http://localhost:4003 (Node 3)
- http://localhost:4004 (Node 4)

### Important Notes

1. **Firewall:** Ensure Windows Firewall allows Node.js or the specific ports (3001-3004)
2. **Network:** All laptops must be on the same network
3. **Token Holder:** Only set `isInitialTokenHolder: true` for Node 1
4. **Port Numbers:** WebSocket uses ports 3001-3004, HTTP GUI uses ports 4001-4004
