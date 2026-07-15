import { api } from "@/lib/axios";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterAccount = {
  email: string;
  password: string;
  name: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
}

export async function registerAccount(account: RegisterAccount): Promise<AuthUser> {
  const response = await api.post<AuthUser>("/auth/register", account);
  return response.data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthUser>("/auth/me");
  return response.data;
}
