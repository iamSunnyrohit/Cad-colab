import { RegisterRequest, LoginRequest, AuthResponse, UserProfile } from "@cad-collab/shared";

const API_BASE = "http://localhost:4000/api/auth";
const TOKEN_KEY = "cad_collab_auth_token";

export function getSavedToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSavedToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to register account");
  }
  saveToken(json.token);
  return json;
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to log in");
  }
  saveToken(json.token);
  return json;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getSavedToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      clearSavedToken();
      return null;
    }
    const json = await res.json();
    return json.user;
  } catch (err) {
    clearSavedToken();
    return null;
  }
}
