export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const paginatedResponse = <T>(
  message: string,
  data: T,
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> => ({
  success: true,
  message,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});

export const errorResponse = (
  message: string,
  errors?: any[],
): ApiResponse => ({
  success: false,
  message,
  errors,
});
