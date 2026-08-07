export interface UserProfile {
  id: string;
  username: string;
  email: string;
  color: string;
  createdAt?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
