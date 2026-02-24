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

export interface TutorApiUser {
  treveccaId: number;
  email: string;
  firstName: string;
  lastName: string;
  major: string | null;
  year: number | null;
  role: string;
}

export interface TutorApiRecord {
  userId: number;
  subjects: string[];
  hourlyLimit: number;
  active: boolean;
  user: TutorApiUser;
}

export interface CreateTutorPayload {
  userId: number;
  subjects: string[];
  hourlyLimit: number;
  active?: boolean;
}

export interface UpdateTutorPayload {
  major: string | null;
  subjects: string[];
  hourlyLimit: number;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseApiError(response: Response, fallbackMessage: string) {
  const error = await response.json().catch(() => null);
  const message =
    (error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message) ||
    fallbackMessage;

  throw new Error(message);
}

export async function getTutorsAPI(): Promise<TutorApiRecord[]> {
  const response = await fetch(`${API_URL}/api/v1/tutors`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await parseApiError(response, "Failed to load tutors");
  }

  return response.json();
}

export async function createTutorAPI(
  payload: CreateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(`${API_URL}/api/v1/tutors`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseApiError(response, "Failed to create tutor");
  }

  return response.json();
}

export async function updateTutorAPI(
  tutorId: number,
  payload: UpdateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(`${API_URL}/api/v1/tutors/${tutorId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor");
  }

  return response.json();
}

export async function updateTutorActiveAPI(
  tutorId: number,
  active: boolean
): Promise<TutorApiRecord> {
  const response = await fetch(`${API_URL}/api/v1/tutors/${tutorId}/active`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor status");
  }

  return response.json();
}
