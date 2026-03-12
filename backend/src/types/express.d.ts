import { UserRole, UserStatus } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nome: string;
        email: string;
        status: UserStatus;
        role: UserRole;
      };
    }
  }
}

export {};
