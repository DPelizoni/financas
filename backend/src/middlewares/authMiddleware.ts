import { NextFunction, Request, Response } from "express";
import { authService } from "../services";
import { AppError } from "./errorHandler";
import userRepository from "../repositories/userRepository";
import { UserRole } from "../models/User";

export const authenticateToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const xAccessTokenHeader = req.headers["x-access-token"];
  const cookieToken = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("auth_token="))
    ?.split("=")[1];
  const queryToken =
    typeof req.query.token === "string" ? req.query.token : undefined;

  const normalizeToken = (value?: string): string | undefined => {
    if (!value) return undefined;

    let parsed = value.trim();
    if (!parsed) return undefined;

    if (
      (parsed.startsWith('"') && parsed.endsWith('"')) ||
      (parsed.startsWith("'") && parsed.endsWith("'"))
    ) {
      parsed = parsed.slice(1, -1).trim();
    }

    const bearerMatch = parsed.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) {
      parsed = bearerMatch[1].trim();
    }

    return parsed || undefined;
  };

  const token =
    normalizeToken(authHeader) ||
    normalizeToken(
      typeof xAccessTokenHeader === "string" ? xAccessTokenHeader : undefined,
    ) ||
    normalizeToken(cookieToken) ||
    normalizeToken(queryToken);

  if (!token) {
    return next(new AppError(401, "Token de autenticação não informado"));
  }

  const processAuth = async () => {
    const payload = authService.verifyToken(token);

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      return next(new AppError(401, "Usuário não encontrado para este token"));
    }

    if (user.status === "INATIVO") {
      return next(new AppError(403, "Usuário inativo"));
    }

    req.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      role: user.role,
    };

    next();

    return;
  };

  processAuth().catch((error) => {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "Token inválido ou expirado"));
  });
};

export const authorizeRoles =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "Usuário não autenticado"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "Acesso negado: perfil sem permissão"));
      return;
    }

    next();
  };
