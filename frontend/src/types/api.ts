export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: any[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination: PaginationInfo;
}

export interface BaseFilters {
  page?: number;
  limit?: number;
  search?: string;
}
