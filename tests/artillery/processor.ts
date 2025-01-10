import { readFileSync } from 'fs';
import axios from 'axios';
import { DoneCallback } from 'passport';
import { io } from 'socket.io-client';
import { randomInt } from 'crypto';
// import { promises as fs } from 'fs';

interface User {
  id: number;
  email: string;
  password: string;
}

interface Friend {
  id: number;
  email: string;
  username: string;
}

// interface RegisterUserDto {
//   email: string;
//   password: string;
//   username: string;
// }

let users: User[];
let userIndex = 0;

const API_URL = 'http://localhost:3000' // 'https://api.stahc.uk'; //process.env.API_URL || 'http://localhost:3000';
const SOCKET_URL = 'ws://localhost:3000' // "wss://api.stahc.uk"
// Add retry configuration
const RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

const connectionPool = {
  maxConnections: 10,
  currentConnections: 0,
  queue: [] as Array<() => void>,

  async acquire(): Promise<void> {
    if (this.currentConnections < this.maxConnections) {
      this.currentConnections++;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  },

  release(): void {
    this.currentConnections--;
    const next = this.queue.shift();
    if (next) {
      this.currentConnections++;
      next();
    }
  }
};

// Use in API calls
// async function makeRequest<T>(fn: () => Promise<T>): Promise<T> {
//   await connectionPool.acquire();
//   try {
//     return await fn();
//   } finally {
//     connectionPool.release();
//   }
// }

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delayMs = RETRY_DELAY,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error.response?.status === 429) {
      await delay(delayMs);
      return retryOperation(operation, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

async function login(email: string, password: string): Promise<string> {
  return retryOperation(async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      // console.log(`res data: ${JSON.stringify(response.data)}`);
      return response.data.access_token;
    } catch (error) {
      console.error(`Login failed for ${email}:`, error.message);
      console.log(`Login failed for ${email}:`, error.message);
      throw error;
    }
  });
}

async function getFriends(token: string): Promise<Friend[]> {
  try {
    const response = await axios.get(`${API_URL}/users/friends`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.friends;
  } catch (error) {
    console.error('Error fetching friends:', error.message);
    console.log('Error fetching friends:', error.message);
    throw error;
  }
}

async function getUserSecure(email: string): Promise<Partial<User>> {
  try {
    const response = await axios.get(`${API_URL}/users/getUserSecure/${email}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${email}:`, error.message);
    console.log(`Error fetching user ${email}:`, error.message);
    throw error;
  }
}

async function getRoom(token: string, friendId: number): Promise<string> {
  try {
    const response = await axios.post(
      `${API_URL}/rooms/find-or-create`,
      { friendId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data.roomId;
  } catch (error) {
    console.error('Error creating/finding room:', error.message);
    console.log('Error creating/finding room:', error.message);
    throw error;
  }
}

// async function registerUser(userData: RegisterUserDto): Promise<void> {
//   try {
//     await axios.post(`${API_URL}/auth/signup`, userData);
//     console.log(`Successfully registered user ${userData.email}`);
//   } catch (error) {
//     if (
//       error.response?.status === 400 &&
//       error.response?.data?.message?.includes('already exists')
//     ) {
//       console.log(`User ${userData.email} already exists`);
//       return;
//     }
//     throw error;
//   }
// }

// Add error tracking
const errorTracker = {
  errors: new Map<string, number>(),
  addError(type: string) {
    const count = this.errors.get(type) || 0;
    this.errors.set(type, count + 1);
    if (count > 50) {
      console.error(`High error rate for ${type}: ${count}`);
    }
  }
};

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: false
});

// Modify loadUserData function
export function loadUserData(
  userContext: any,
  events: any,
  done: DoneCallback,
): void {
  (async () => {
    try {
      // await rateLimiter.acquire();
      
      // Add session tracking
      if (!userContext.vars) {
        userContext.vars = {};
      }
      userContext.vars.sessionStartTime = Date.now();

      // Load data only once and cache it
      if (!users) {
        try {
          const userData = readFileSync('./data/chat-users.json', 'utf-8');
          users = JSON.parse(userData);
          // console.log(`Loaded ${users.length} users from file`);
        } catch (error) {
          console.error('Error loading users:', error);
          return done(new Error('Failed to load users data'));
        }
      }

      // Validate users array
      if (!users || !Array.isArray(users) || users.length === 0) {
        console.error('No valid users found');
        return done(new Error('No valid users available'));
      }

      // Cycle through users in the data file
      const user = users[userIndex % users.length];
      userIndex++;
      // console.log(`user email: ${user.email}`)
      try {
        const token = await login(user.email, user.password);
        const userInfo = await getUserSecure(user.email);
        const friends = await getFriends(token);

        if (!friends || friends.length === 0) {
          console.error(`No friends found for user ${user.email}`);
          return done(new Error('No friends available'));
        }

        const randomFriend = friends[Math.floor(Math.random() * friends.length)];
        const roomId = await getRoom(token, randomFriend.id);

        const currentUser = {
          email: user.email,
          id: userInfo.id,
          friend: {
            id: randomFriend.id,
            email: randomFriend.email
          }
        };

        // Set context variables
        userContext.vars = {
          userId: userInfo.id,
          token: token,
          roomId: roomId,
          email: user.email,
          friends: friends,
          friendId: randomFriend.id,
          // Export the current user data
          currentUser: {
            email: user.email,
            id: userInfo.id,
            friend: {
              id: randomFriend.id,
              email: randomFriend.email
            }
          },
          content: randomInt(10),
        };

        // Validation
        if (!userContext.vars.token) {
          return done(new Error('Authentication failed'));
        }

        if (!userContext.vars.roomId) {
          return done(new Error('Room creation failed'));
        }

        // Log success for debugging
        // console.log(`Successfully loaded user: ${user.email} with ID: ${userInfo.id}`);

        events.currentUser = currentUser;

        // Pass the user data through done callback
        return done(null, userContext.vars.currentUser);

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        errorTracker.addError(error.message);
        return done(error);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      errorTracker.addError(error.message);
      return done(error);
    }
  })();
}

// Add cleanup function
export function cleanupSession(context: any, events: any, done: DoneCallback) {
  if (context.vars.token) {
    delete context.vars.token;
  }
  done(null);
}

export function logResponse(userContext: any, events: any, done: Function) {
  if (events.response) {
    console.log('Response received:', JSON.stringify(events.response, null, 2));
  }
  return done();
}

// You can then access the user data in your test scenarios
export function handleUserData(userContext: any, events: any, done: Function) {
  if (events.currentUser) {
    console.log('Current user from events:', events.currentUser);
  }
  if (userContext.vars.currentUser) {
    console.log('Current user from context:', userContext.vars.currentUser);
  }
  return done();
}

export function handleSocketEvents(userContext: any, events: any, done: Function) {
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
  });

  return done();
}
