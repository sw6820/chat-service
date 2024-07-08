import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: { [key: string]: any };
  }
}

declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}
