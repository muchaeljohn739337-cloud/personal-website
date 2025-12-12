declare global {
  namespace Express {
    interface User {
      id?: string;
      email?: string;
      role?: string;
      [key: string]: any;
    }

    interface Request {
      user?: User;
    }
  }
}

import type { JWTPayload } from "../middleware/auth";

declare global {
  namespace Express {
    interface User extends JWTPayload {
      id?: string;
      email?: string;
      role?: string;
      [key: string]: any;
    }
  }
}

export {};
