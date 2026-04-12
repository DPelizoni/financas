import apiClient from "@/services/apiClient";
import {
  User,
  UserCreateInput,
  UserFilters,
  UserRoleUpdateInput,
  UserStatusUpdateInput,
  UserUpdateInput,
} from "@/types/user";
import { ApiResponse, PaginatedResponse } from "@/types/api";

export const userService = {
  /**
   * Lista todos os usuários com filtros e paginação
   */
  async getAll(filters: UserFilters): Promise<PaginatedResponse<User[]>> {
    const response = await apiClient.get<PaginatedResponse<User[]>>("/api/users", {
      params: filters,
    });

    return response.data;
  },

  /**
   * Atualiza o status de um usuário
   */
  async updateStatus(id: number, input: UserStatusUpdateInput): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/api/users/${id}/status`,
      input,
    );

    return response.data.data;
  },

  /**
   * Atualiza o papel (role) de um usuário
   */
  async updateRole(id: number, input: UserRoleUpdateInput): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      `/api/users/${id}/role`,
      input,
    );

    return response.data.data;
  },

  /**
   * Cria um novo usuário
   */
  async create(input: UserCreateInput): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      "/api/users",
      input,
    );

    return response.data.data;
  },

  /**
   * Atualiza os dados de um usuário
   */
  async update(id: number, input: UserUpdateInput): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `/api/users/${id}`,
      input,
    );

    return response.data.data;
  },

  /**
   * Exclui um usuário
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/users/${id}`);
  },
};
