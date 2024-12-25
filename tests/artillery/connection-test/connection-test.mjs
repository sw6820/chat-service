// connection-test.mjs
import { io } from 'socket.io-client';

// Configuration
const socket = io('wss://api.stahc.uk/chat', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYSIsImVtYWlsIjoiYUBhLmNvbSIsImlhdCI6MTczNDc4NTg5OCwibmJmIjoxNzM0Nzg1ODk4LCJleHAiOjE3MzUzOTA2OTgsImF1ZCI6WyJjaGF0LXNlcnZpY2UtYXBpIl0sImlzcyI6ImNoYXQtc2VydmljZSJ9.649umFedhZ8DrQ-0PSTv1NLy546a93gJl0vX_Em2Jpc'  // Replace with your actual token
  }
});

// Connection event
socket.on('connect', () => {
  console.log('✅ Successfully connected to WebSocket server');
  console.log('Socket ID:', socket.id);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

// Disconnection event
socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// General error handler
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Cleanup after 5 seconds
setTimeout(() => {
  console.log('Closing connection...');
  socket.disconnect();
  process.exit(0);
}, 5000);