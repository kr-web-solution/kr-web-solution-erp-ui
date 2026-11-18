export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  departmentId?: string;
  avatarUrl?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiError {
  detail: string;
  extra?: Record<string, unknown>;
}

