const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tutor: {
      subjects: string[];
      hourlyLimit: number;
      active: boolean;
    } | null;
    authProvider: string;
  };
}

export async function loginAPI(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Login failed",
    }));
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}
