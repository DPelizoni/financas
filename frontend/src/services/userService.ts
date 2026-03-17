import apiClient from "@/services/apiClient";
import {
  PaginatedResponse,
  User,
  UserCreateInput,
  UserFilters,
  UserRoleUpdateInput,
  UserStatusUpdateInput,
  UserUpdateInput,
} from "@/types/user";

export const userService = {
  async getAll(filters: UserFilters): Promise<PaginatedResponse<User[]>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.role) params.append("role", filters.role);

    const response = await apiClient.get<PaginatedResponse<User[]>>(
      `/api/users?${params}`,
    );

    return response.data;
  },

  async updateStatus(id: number, input: UserStatusUpdateInput): Promise<User> {
    const response = await apiClient.patch<{ success: boolean; data: User }>(
      `/api/users/${id}/status`,
      input,
    );

    return response.data.data;
  },

  async updateRole(id: number, input: UserRoleUpdateInput): Promise<User> {
    const response = await apiClient.patch<{ success: boolean; data: User }>(
      `/api/users/${id}/role`,
      input,
    );

    return response.data.data;
  },

  async create(input: UserCreateInput): Promise<User> {
    const response = await apiClient.post<{ success: boolean; data: User }>(
      "/api/users",
      input,
    );

    return response.data.data;
  },

  async update(id: number, input: UserUpdateInput): Promise<User> {
    const response = await apiClient.put<{ success: boolean; data: User }>(
      `/api/users/${id}`,
      input,
    );

    return response.data.data;
  },
};
