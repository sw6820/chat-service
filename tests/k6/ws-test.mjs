// ws-test.mjs
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  // Optional if you want a small load test scenario
  stages: [
    { duration: '10s', target: 5 },
    { duration: '10s', target: 5 },
    { duration: '5s', target: 0 },
  ],
};

export default function () {
  // Replace with your valid JWT (if using a query param approach)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYSIsImVtYWlsIjoiYUBhLmNvbSIsImlhdCI6MTczNDc4NTg5OCwibmJmIjoxNzM0Nzg1ODk4LCJleHAiOjE3MzUzOTA2OTgsImF1ZCI6WyJjaGF0LXNlcnZpY2UtYXBpIl0sImlzcyI6ImNoYXQtc2VydmljZSJ9.649umFedhZ8DrQ-0PSTv1NLy546a93gJl0vX_Em2Jpc';

  // Socket.IO normally uses "/socket.io/..." with query EIO=4, transport=websocket, etc.
  // But we're trying a direct wss://.../chat?token=... approach.
  const url = `wss://api.stahc.uk/chat?token=${token}`;

  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      console.log('WebSocket connection opened');

      // Attempt to "joinRoom"
      // In pure WebSockets, you'd just send text or JSON frames. 
      // But your Nest code is expecting a Socket.IO event name ("joinRoom") 
      // with @SubscribeMessage('joinRoom').
      // Raw WebSocket won't call that automatically. 
      // We'll attempt to send a JSON that your gateway might parse if you manually handle it.
      const joinPayload = {
        event: 'joinRoom',   // There's no guarantee the gateway sees this as an event
        roomId: 1,
      };
      socket.send(JSON.stringify(joinPayload));

      // Wait a bit, then try sending "sendMessage"
      setTimeout(() => {
        const messagePayload = {
          event: 'sendMessage',
          roomId: 1,
          userId: 999,    // Some dummy user ID
          content: 'Hello from k6 raw WS!',
        };
        socket.send(JSON.stringify(messagePayload));
      }, 1000);
    });

    // Listen for any frames the server sends
    socket.on('message', (msg) => {
      console.log(`Received: ${msg}`);

      // Because it's raw WS, you might get data like "42["newMessage", {...}]" if 
      // the server is truly speaking Socket.IO frames, or JSON if you coded it manually.
      // Attempt a naive check:
      check(msg, { 'received something': (m) => m.length > 0 });
    });

    // If the server or we close the connection
    socket.on('close', () => {
      console.log('WebSocket closed');
    });

    // Keep the connection open for some seconds 
    sleep(5);
    socket.close();
  });
}


