const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('A new client connected!');

  // Send a welcome message to the client
  const welcomeMessage = {
    type: 'welcome',
    content: 'Welcome to the WebSocket server!'
  };
  ws.send(JSON.stringify(welcomeMessage));

  // Handle incoming messages from the client
  ws.on('message', (message) => {

    // Parse the received JSON data
    try {
      const jsonData = JSON.parse(message);

      // Broadcast the JSON data to all connected clients
      wss.clients.forEach((client) => {
        if (client!=ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(jsonData));
        }
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
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
