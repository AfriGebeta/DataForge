export type AdminRole =
  | "ADMIN"
  | "DATA_EDITOR"
  | "DATA_REVIEWER"
  | "DATA_VALIDATOR"
  | "VIEWER"
  | "SERVICE_ACCOUNT";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserRequest = {
  email: string;
  fullName: string;
  role: AdminRole;
  password: string;
  isActive: boolean;
};

export type UpdateUserRequest = {
  fullName: string;
  role: AdminRole;
  password: string;
  isActive: boolean;
};

export type UsersParams = {
  page?: number;
  pageSize?: number;
  role?: AdminRole;
};

export type UsersResponse = {
  data: AdminUser[];
  total: number;
  limit: number;
  offset: number;
};
