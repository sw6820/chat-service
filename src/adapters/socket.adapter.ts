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
        'https://api.stahc.uk',
      ],
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: [
        'Origin',
        'DNT',
        'User-Agent',
        'X-Requested-With',
        'If-Modified-Since',
        'Cache-Control',
        'Content-Type',
        'Range',
        'Accept',
        'Authorization',
      ],
      credentials: true,
      exposedHeaders: ['Authorization'],
      maxAge: 86400, // 24 hours in seconds
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };

    options = { ...options, cors };
    return super.createIOServer(port, options);
  }
}
