 // TypeScript types matching the database schema EXACTLY
 // DO NOT rename or add fields unless explicitly required
 
 export interface User {
   id: number;
   trevecca_id: string;
   email: string;
   first_name: string;
   last_name: string;
   year: number | null;
   created_at: string; // timestamp as ISO string
   temporary_password: string | null;
   role: string; // "admin" | "student"
 }
 
 export interface Tutor {
   user_id: number; // PK/FK → user.id
   major: string | null;
   subjects: string | null; // comma-separated or JSON string
   hourly_limit: number | null;
   active: boolean;
 }
 
 export interface Course {
   id: number;
   code: string;
   title: string;
   department: string | null;
 }
 
 export interface TutoringRequest {
   id: number;
   user_id: number;
   requested_tutor_id: number | null;
   course_id: number;
   description: string | null;
   status: string | null; // "pending" | "pending_tutor" | "approved" | "denied"
   decline_reason: string | null;
   created_at: string;
 }
 
export interface TutoringSession {
  id: number;
  tutor_id: number;
  user_id: number;
  request_id: number;
  course_id: number;
  start_time: string | null; // timestamp as ISO string
  end_time: string | null; // timestamp as ISO string
  status: string | null; // "scheduled" | "completed" | "cancelled"
  attended: boolean | null;
  notes: string | null;
}

/** Student-initiated meeting request to a tutor (pending until tutor accepts/declines). */
export interface SessionRequest {
  id: number;
  tutor_id: number;
  user_id: number; // student
  course_id: number;
  requested_start_time: string; // ISO string
  requested_end_time: string; // ISO string
  notes: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string; // ISO string
}

export interface SessionMetrics {
   date: string; // date as ISO string (PK)
   total_sessions: number | null;
   total_requests: number | null;
   avg_duration: number | null; // in minutes
   total_spent: number | null;
 }
 
 export interface TutorMetrics {
   tutor_id: number; // PK
   total_sessions: number | null;
   total_hours: number | null;
   utilization: number | null; // numeric(5,2)
 }
 
 export interface CourseMetrics {
   course_id: number; // PK
   total_requests: number | null;
   total_sessions: number | null;
 }
 
 // Extended types for UI convenience
 export interface TutorWithUser extends Tutor {
   user: User;
 }
 
 export interface TutoringRequestWithDetails extends TutoringRequest {
   user: User;
   course: Course;
   requested_tutor?: TutorWithUser | null;
 }
 
 export interface TutoringSessionWithDetails extends TutoringSession {
   tutor: TutorWithUser;
   student: User;
   course: Course;
 }
 
 // Auth context types
 export interface AuthUser {
   user: User;
   tutor: Tutor | null;
   isAdmin: boolean;
   isTutor: boolean;
 }