import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // ramp up to 5 VUs over 10s
    { duration: '20s', target: 5 },   // stay at 5 VUs for 20s
    { duration: '10s', target: 0 },   // ramp down to 0 VUs over 10s
  ],
};

export default function () {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYSIsImVtYWlsIjoiYUBhLmNvbSIsImlhdCI6MTczNDc4NTg5OCwibmJmIjoxNzM0Nzg1ODk4LCJleHAiOjE3MzUzOTA2OTgsImF1ZCI6WyJjaGF0LXNlcnZpY2UtYXBpIl0sImlzcyI6ImNoYXQtc2VydmljZSJ9.649umFedhZ8DrQ-0PSTv1NLy546a93gJl0vX_Em2Jpc'; // Insert a valid JWT if needed
  
    // Example: hitting a protected endpoint
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  
    // Maybe fetch chat logs
    const res = http.get('https://api.stahc.uk/chat/rooms/123/logs', { headers });
    
    // Validate response
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has messages': (r) => r.json('messages') !== undefined,
    });
  
    // Pause briefly so the requests are spread out
    sleep(1);
  }
