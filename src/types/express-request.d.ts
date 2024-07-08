declare global {
  namespace Express {
    interface User extends User {}
    interface Request {
      isAuthenticated(): boolean;
      user?: User;
    }
  }
}
