// chat-logs.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 5 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  // Example: read logs from room 123
  const res = http.get('https://api.stahc.uk/chat/rooms/1/logs');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has messages': (r) => r.json('messages') !== undefined,
  });

  sleep(1);
}
