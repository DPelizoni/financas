import { NextFunction, Request, Response } from "express";
import authService from "../services/authService";
import { errorResponse, successResponse } from "../utils/response";

class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res
        .status(201)
        .json(successResponse("Usuário cadastrado com sucesso", result));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json(successResponse("Login realizado com sucesso", result));
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(errorResponse("Usuário não autenticado"));
        return;
      }

      const user = await authService.getMe(userId);
      res.json(successResponse("Usuário autenticado", user));
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    res.json(successResponse("Logout realizado com sucesso"));
  }
}

export default new AuthController();
