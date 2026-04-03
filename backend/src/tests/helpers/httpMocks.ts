import { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "../../models/User";

interface MockUser {
  id: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
}

interface MockRequestOptions {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  headers?: Record<string, string | undefined>;
  user?: MockUser;
}

export const createMockRequest = (options: MockRequestOptions = {}): Request =>
  ({
    body: options.body ?? {},
    query: options.query ?? {},
    params: options.params ?? {},
    headers: options.headers ?? {},
    user: options.user,
  }) as unknown as Request;

export const createMockResponse = (): {
  res: Response;
  getStatusCode: () => number;
  getJsonBody: () => unknown;
} => {
  let statusCode = 200;
  let jsonBody: unknown;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
  } as unknown as Response;

  return {
    res,
    getStatusCode: () => statusCode,
    getJsonBody: () => jsonBody,
  };
};

export const createNextSpy = (): {
  next: NextFunction;
  calls: unknown[];
} => {
  const calls: unknown[] = [];
  const next: NextFunction = (error?: unknown) => {
    calls.push(error);
  };

  return { next, calls };
};
