import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class CustomSocketAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const cors = {
      origin: [
        'https://chat-service-frontend.pages.dev',
        'https://*.chat-service-frontend.pages.dev',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    };

    options = { ...options, cors };
    return super.createIOServer(port, options);
  }
}