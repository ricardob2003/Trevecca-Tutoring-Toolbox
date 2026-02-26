const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function withCredentials(init: RequestInit = {}): RequestInit {
  return {
    ...init,
    credentials: "include",
  };
}

export interface LoginResponse {
  token?: string;
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
  const response = await fetch(
    `${API_URL}/api/v1/auth/login`,
    withCredentials({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Login failed",
    }));
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}

export async function getCurrentUserAPI(): Promise<{ user: LoginResponse["user"] }> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/me`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load current user");
  }

  return response.json();
}

export async function logoutAPI(): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/v1/auth/logout`,
    withCredentials({
      method: "POST",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to log out");
  }
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

function getJsonHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
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
  const response = await fetch(
    `${API_URL}/api/v1/tutors`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load tutors");
  }

  return response.json();
}

export async function createTutorAPI(
  payload: CreateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors`,
    withCredentials({
      method: "POST",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to create tutor");
  }

  return response.json();
}

export async function updateTutorAPI(
  tutorId: number,
  payload: UpdateTutorPayload
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}`,
    withCredentials({
      method: "PUT",
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor");
  }

  return response.json();
}

export async function updateTutorActiveAPI(
  tutorId: number,
  active: boolean
): Promise<TutorApiRecord> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}/active`,
    withCredentials({
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify({ active }),
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to update tutor status");
  }

  return response.json();
}

export async function getTutorAssignedStudentsAPI(
  tutorId: number
): Promise<
  Array<{
    student: {
      id: number;
      firstName: string;
      lastName: string;
      name: string;
      email: string;
    };
    course: {
      id: number;
      code: string;
      title: string;
    };
    currentSessionStatus: string | null;
  }>
> {
  const response = await fetch(
    `${API_URL}/api/v1/tutors/${tutorId}/students`,
    withCredentials({
      method: "GET",
    })
  );

  if (!response.ok) {
    await parseApiError(response, "Failed to load assigned students");
  }

  return response.json();
}
