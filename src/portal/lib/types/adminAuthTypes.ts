export interface LoginData {
  email: string;
  password: string;
}

export interface AdminResponse {
  id: string;
  email: string;
  name?: string;
  token?: string; // Optional, for compatibility if needed
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  error: string | null;
  data: T;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
}
