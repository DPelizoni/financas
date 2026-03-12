import { AppError } from "../middlewares/errorHandler";
import {
  User,
  UserFilters,
  UserPublic,
  UserRoleUpdateInput,
  UserStatusUpdateInput,
} from "../models/User";
import userRepository from "../repositories/userRepository";

class UserService {
  private toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      status: user.status,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async listUsers(
    filters: UserFilters,
  ): Promise<{ users: UserPublic[]; total: number }> {
    try {
      const { users, total } = await userRepository.findAll(filters);
      return {
        users: users.map((item) => this.toPublicUser(item)),
        total,
      };
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      throw new AppError(500, "Erro ao listar usuários");
    }
  }

  async updateStatus(
    id: number,
    input: UserStatusUpdateInput,
  ): Promise<UserPublic> {
    try {
      const exists = await userRepository.exists(id);
      if (!exists) {
        throw new AppError(404, "Usuário não encontrado");
      }

      const updated = await userRepository.updateStatus(id, input);
      if (!updated) {
        throw new AppError(500, "Erro ao atualizar status do usuário");
      }

      return this.toPublicUser(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar status do usuário:", error);
      throw new AppError(500, "Erro ao atualizar status do usuário");
    }
  }

  async updateRole(
    id: number,
    input: UserRoleUpdateInput,
    currentUserId: number,
  ): Promise<UserPublic> {
    try {
      const target = await userRepository.findById(id);
      if (!target) {
        throw new AppError(404, "Usuário não encontrado");
      }

      if (currentUserId === id && input.role !== "ADMIN") {
        throw new AppError(
          400,
          "Você não pode remover seu próprio papel de ADMIN",
        );
      }

      if (target.role === "ADMIN" && input.role !== "ADMIN") {
        const adminsCount = await userRepository.countByRole("ADMIN");
        if (adminsCount <= 1) {
          throw new AppError(
            400,
            "Não é permitido remover o último ADMIN do sistema",
          );
        }
      }

      const updated = await userRepository.updateRole(id, input);
      if (!updated) {
        throw new AppError(500, "Erro ao atualizar papel do usuário");
      }

      return this.toPublicUser(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar papel do usuário:", error);
      throw new AppError(500, "Erro ao atualizar papel do usuário");
    }
  }
}

export default new UserService();
