import { NextFunction, Request, Response } from "express";
import { paginatedResponse, successResponse } from "../utils/response";
import userService from "../services/userService";
import { UserFilters } from "../models/User";
import { AppError } from "../middlewares/errorHandler";

class UserController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError(401, "Usuário não autenticado");
      }

      const user = await userService.createUser(req.body, currentUser.role);
      res.status(201).json(successResponse("Usuário criado com sucesso", user));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: UserFilters = {
        search: req.query.search as string,
        status: req.query.status as "ATIVO" | "INATIVO" | undefined,
        role: req.query.role as "USUARIO" | "GESTOR" | "ADMIN" | undefined,
        page,
        limit,
      };

      const { users, total } = await userService.listUsers(filters);

      res.json(
        paginatedResponse(
          "Usuários listados com sucesso",
          users,
          page,
          limit,
          total,
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.updateStatus(id, req.body);
      res.json(
        successResponse("Status do usuário atualizado com sucesso", user),
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        throw new AppError(401, "Usuário não autenticado");
      }

      const id = parseInt(req.params.id);
      const user = await userService.updateUser(id, req.body, {
        id: currentUser.id,
        role: currentUser.role,
      });
      res.json(successResponse("Usuário atualizado com sucesso", user));
    } catch (error) {
      next(error);
    }
  }

  async updateRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        throw new AppError(401, "Usuário não autenticado");
      }

      const id = parseInt(req.params.id);
      const user = await userService.updateRole(id, req.body, currentUserId);
      res.json(
        successResponse("Papel do usuário atualizado com sucesso", user),
      );
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?.id;
      if (!currentUserId) {
        throw new AppError(401, "Usuário não autenticado");
      }

      const id = parseInt(req.params.id);
      await userService.deleteUser(id, currentUserId);
      res.json(successResponse("Usuário excluído com sucesso"));
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
