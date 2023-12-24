const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('A new client connected!');

  // Send a welcome message to the client
  ws.send('Welcome to the WebSocket server!');

  // Handle incoming messages from the client
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3050;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
