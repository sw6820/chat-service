export interface Config {
  http?: {
    host: string;
    port: number;
  };
  db?: {
    postgres?: {
      url: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    mysql?: {
      url: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    redis?: {
      host: string;
      port: number;
    };
    sqlite?: {
      database: string;
    };
  };
  github?: {
    clientId: string;
    clientSecret: string;
  };
  jwt?: {
    secret: string;
  };
  secretKey?: string;
  dbInfo?: string;
  logLevel?: string;
}
