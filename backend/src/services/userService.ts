import { AppError } from "../middlewares/errorHandler";
import bcrypt from "bcryptjs";
import {
  User,
  UserFilters,
  UserManagementInput,
  UserPublic,
  UserRoleUpdateInput,
  UserStatusUpdateInput,
} from "../models/User";
import userRepository from "../repositories/userRepository";

class UserService {
  private sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

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

  async createUser(
    input: UserManagementInput,
    currentUserRole: "USUARIO" | "GESTOR" | "ADMIN",
  ): Promise<UserPublic> {
    try {
      const normalizedEmail = this.sanitizeEmail(input.email);
      const existing = await userRepository.findByEmail(normalizedEmail);
      if (existing) {
        throw new AppError(409, "Já existe um usuário com este email");
      }

      const requestedRole =
        currentUserRole === "ADMIN" ? input.role : "USUARIO";

      if (!input.senha) {
        throw new AppError(400, "Senha e obrigatoria para cadastro");
      }

      const senhaHash = await bcrypt.hash(input.senha, 10);

      const created = await userRepository.create({
        nome: input.nome.trim(),
        email: normalizedEmail,
        senha: senhaHash,
        status: input.status,
        role: requestedRole,
      });

      return this.toPublicUser(created);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao criar usuário:", error);
      throw new AppError(500, "Erro ao criar usuário");
    }
  }

  async updateUser(
    id: number,
    input: UserManagementInput,
    currentUser: { id: number; role: "USUARIO" | "GESTOR" | "ADMIN" },
  ): Promise<UserPublic> {
    try {
      const target = await userRepository.findById(id);
      if (!target) {
        throw new AppError(404, "Usuário não encontrado");
      }

      const normalizedEmail = this.sanitizeEmail(input.email);
      if (normalizedEmail !== target.email) {
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing && existing.id !== id) {
          throw new AppError(409, "Já existe um usuário com este email");
        }
      }

      if (currentUser.role !== "ADMIN" && input.role !== target.role) {
        throw new AppError(403, "Somente ADMIN pode alterar papel do usuário");
      }

      if (
        currentUser.id === id &&
        currentUser.role === "ADMIN" &&
        input.role !== "ADMIN"
      ) {
        throw new AppError(400, "Você não pode remover seu próprio papel de ADMIN");
      }

      if (currentUser.id === id && input.status === "INATIVO") {
        throw new AppError(400, "Você não pode inativar o próprio usuário");
      }

      const willLoseAdminRole = target.role === "ADMIN" && input.role !== "ADMIN";
      const willBeInactivated = target.role === "ADMIN" && input.status === "INATIVO";
      if ((willLoseAdminRole || willBeInactivated) && target.status === "ATIVO") {
        const activeAdmins = await userRepository.countActiveByRole("ADMIN");
        if (activeAdmins <= 1) {
          throw new AppError(
            400,
            "Não é permitido remover ou inativar o último ADMIN ativo do sistema",
          );
        }
      }

      const requestedRole =
        currentUser.role === "ADMIN" ? input.role : target.role;
      const senhaHash = input.senha
        ? await bcrypt.hash(input.senha, 10)
        : undefined;

      const updated = await userRepository.updateUser(id, {
        nome: input.nome.trim(),
        email: normalizedEmail,
        senha: senhaHash,
        status: input.status,
        role: requestedRole,
      });

      if (!updated) {
        throw new AppError(500, "Erro ao atualizar usuário");
      }

      return this.toPublicUser(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error("Erro ao atualizar usuário:", error);
      throw new AppError(500, "Erro ao atualizar usuário");
    }
  }
}

export default new UserService();
