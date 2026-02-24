const API_BASE = "http://localhost:3000/api/v1"

function getToken() {
  return localStorage.getItem("token")
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data?.message || "Request failed")
  }

  return data
}

export function loginApi(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }) as Promise<{
    token: string
    user: {
      id: number
      email: string
      firstName: string
      lastName: string
      role: string
      isTutor: boolean
    }
  }>
}

export function getRequests(params?: {
  status?: string
  user_id?: number
  requested_tutor_id?: number
}) {
  const qs = new URLSearchParams()

  if (params?.status) qs.set("status", params.status)
  if (params?.user_id) qs.set("user_id", String(params.user_id))
  if (params?.requested_tutor_id) {
    qs.set("requested_tutor_id", String(params.requested_tutor_id))
  }

  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  return apiFetch(`/requests${suffix}`)
}

export function getCourses() {
  return apiFetch("/courses")
}

export function getTutors() {
  return apiFetch("/tutors")
}

export function assignTutorToRequest(requestId: number, tutorId: number) {
  return apiFetch(`/requests/${requestId}/assign`, {
    method: "PUT",
    body: JSON.stringify({ tutor_id: tutorId }),
  })
}

export function denyRequest(requestId: number) {
  return apiFetch(`/requests/${requestId}/deny`, {
    method: "PUT",
  })
}

export function tutorRespondToRequest(requestId: number, accepted: boolean) {
  return apiFetch(`/requests/${requestId}/tutor-response`, {
    method: "PATCH",
    body: JSON.stringify({ accepted }),
  })
}