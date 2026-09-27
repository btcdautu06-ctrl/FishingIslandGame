const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// ========================================================
// ZERO-DEPENDENCY RFC 6455 WEBSOCKET MULTIPLAYER SERVER
// ========================================================
const clients = new Set();

function encodeWsFrame(data) {
  const payload = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
  const length = payload.length;

  if (length <= 125) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  } else if (length < 65536) {
    return Buffer.concat([
      Buffer.from([0x81, 126, (length >> 8) & 0xff, length & 0xff]),
      payload
    ]);
  } else {
    const lenBuffer = Buffer.alloc(8);
    lenBuffer.writeBigUInt64BE(BigInt(length));
    return Buffer.concat([Buffer.from([0x81, 127]), lenBuffer, payload]);
  }
}

function broadcastToOthers(senderSocket, message) {
  const frame = encodeWsFrame(message);
  for (const client of clients) {
    if (client !== senderSocket && client.readyState === 'open') {
      try {
        client.socket.write(frame);
      } catch (err) {}
    }
  }
}

function broadcastToAll(message) {
  const frame = encodeWsFrame(message);
  for (const client of clients) {
    if (client.readyState === 'open') {
      try {
        client.socket.write(frame);
      } catch (err) {}
    }
  }
}

server.on('upgrade', (req, socket, head) => {
  const upgradeHeader = (req.headers['upgrade'] || '').toLowerCase();
  if (upgradeHeader !== 'websocket') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const responseHeaders = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`
  ];

  socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');

  const clientInfo = {
    socket,
    id: 'p_' + Math.random().toString(36).substr(2, 9),
    readyState: 'open',
    buffer: Buffer.alloc(0)
  };
  clients.add(clientInfo);

  // Send welcome packet with their assigned ID and current player count
  socket.write(encodeWsFrame({
    type: 'welcome',
    id: clientInfo.id,
    onlineCount: clients.size
  }));

  // Announce player count to everyone
  broadcastToAll({
    type: 'player_count',
    count: clients.size
  });

  socket.on('data', chunk => {
    clientInfo.buffer = Buffer.concat([clientInfo.buffer, chunk]);

    while (clientInfo.buffer.length >= 2) {
      const firstByte = clientInfo.buffer[0];
      const secondByte = clientInfo.buffer[1];
      const isFinal = (firstByte & 0x80) !== 0;
      const opcode = firstByte & 0x0f;
      const isMasked = (secondByte & 0x80) !== 0;
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (clientInfo.buffer.length < 4) break;
        payloadLength = clientInfo.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLength === 127) {
        if (clientInfo.buffer.length < 10) break;
        payloadLength = Number(clientInfo.buffer.readBigUInt64BE(2));
        offset = 10;
      }

      const maskLength = isMasked ? 4 : 0;
      if (clientInfo.buffer.length < offset + maskLength + payloadLength) {
        break; // Wait for complete frame
      }

      let maskKey = null;
      if (isMasked) {
        maskKey = clientInfo.buffer.slice(offset, offset + 4);
        offset += 4;
      }

      const payload = clientInfo.buffer.slice(offset, offset + payloadLength);
      clientInfo.buffer = clientInfo.buffer.slice(offset + payloadLength);

      if (isMasked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      if (opcode === 0x8) {
        // Connection Close
        socket.end();
        break;
      } else if (opcode === 0x9) {
        // Ping -> Reply Pong
        socket.write(Buffer.concat([Buffer.from([0x8a, 0x00])]));
      } else if (opcode === 0x1) {
        // Text message
        try {
          const text = payload.toString('utf8');
          const data = JSON.parse(text);
          data.senderId = clientInfo.id;
          broadcastToOthers(clientInfo, data);
        } catch (e) {}
      }
    }
  });

  const cleanup = () => {
    if (clientInfo.readyState === 'closed') return;
    clientInfo.readyState = 'closed';
    clients.delete(clientInfo);
    broadcastToAll({
      type: 'leave',
      id: clientInfo.id,
      onlineCount: clients.size
    });
  };

  socket.on('close', cleanup);
  socket.on('end', cleanup);
  socket.on('error', cleanup);
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`===============================================`);
  console.log(`🏝️  FISHING ISLAND GAME IS RUNNING!           `);
  console.log(`📍  Open your browser at: ${url}             `);
  console.log(`🌐  Multiplayer WebSocket Server Ready!       `);
  console.log(`===============================================`);
});
