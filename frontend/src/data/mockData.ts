 import type {
   User,
   Tutor,
   Course,
   TutoringRequest,
   TutoringSession,
   SessionMetrics,
   TutorMetrics,
   CourseMetrics,
 } from "@/types";
 
 // Mock Users
 export const mockUsers: User[] = [
   {
     id: 1,
     trevecca_id: "T00001",
     email: "admin@trevecca.edu",
     first_name: "Sarah",
     last_name: "Johnson",
     year: null,
     created_at: "2024-01-15T08:00:00Z",
     temporary_password: null,
     role: "admin",
   },
   {
     id: 2,
     trevecca_id: "T00002",
     email: "jsmith@trevecca.edu",
     first_name: "John",
     last_name: "Smith",
     year: 3,
     created_at: "2024-01-20T09:00:00Z",
     temporary_password: null,
     role: "student",
   },
   {
     id: 3,
     trevecca_id: "T00003",
     email: "emily.davis@trevecca.edu",
     first_name: "Emily",
     last_name: "Davis",
     year: 4,
     created_at: "2024-01-22T10:00:00Z",
     temporary_password: null,
     role: "student",
   },
   {
     id: 4,
     trevecca_id: "T00004",
     email: "michael.brown@trevecca.edu",
     first_name: "Michael",
     last_name: "Brown",
     year: 2,
     created_at: "2024-02-01T11:00:00Z",
     temporary_password: null,
     role: "student",
   },
   {
     id: 5,
     trevecca_id: "T00005",
     email: "jessica.wilson@trevecca.edu",
     first_name: "Jessica",
     last_name: "Wilson",
     year: 3,
     created_at: "2024-02-05T12:00:00Z",
     temporary_password: null,
     role: "student",
   },
   {
     id: 6,
     trevecca_id: "T00006",
     email: "david.martinez@trevecca.edu",
     first_name: "David",
     last_name: "Martinez",
     year: 1,
     created_at: "2024-02-10T08:30:00Z",
     temporary_password: "temp123",
     role: "student",
   },
 ];
 
 // Mock Tutors
 export const mockTutors: Tutor[] = [
   {
     user_id: 2,
     major: "Computer Science",
     subjects: "CS101,CS201,MATH101",
     hourly_limit: 20,
     active: true,
   },
   {
     user_id: 3,
     major: "Mathematics",
     subjects: "MATH101,MATH201,STAT101",
     hourly_limit: 15,
     active: true,
   },
   {
     user_id: 5,
     major: "Biology",
     subjects: "BIO101,CHEM101",
     hourly_limit: 10,
     active: false,
   },
 ];
 
 // Mock Courses
 export const mockCourses: Course[] = [
   { id: 1, code: "CS101", title: "Introduction to Computer Science", department: "Computer Science" },
   { id: 2, code: "CS201", title: "Data Structures & Algorithms", department: "Computer Science" },
   { id: 3, code: "MATH101", title: "College Algebra", department: "Mathematics" },
   { id: 4, code: "MATH201", title: "Calculus I", department: "Mathematics" },
   { id: 5, code: "STAT101", title: "Introduction to Statistics", department: "Mathematics" },
   { id: 6, code: "BIO101", title: "General Biology", department: "Biology" },
   { id: 7, code: "CHEM101", title: "General Chemistry", department: "Chemistry" },
   { id: 8, code: "ENG101", title: "English Composition", department: "English" },
   { id: 9, code: "PHYS101", title: "Physics I", department: "Physics" },
   { id: 10, code: "PSY101", title: "Introduction to Psychology", department: "Psychology" },
 ];
 
 // Mock Tutoring Requests
 export const mockTutoringRequests: TutoringRequest[] = [
   {
     id: 1,
     user_id: 4,
     requested_tutor_id: 2,
     course_id: 1,
     description: "Need help with basic programming concepts and loops",
     status: "pending",
     created_at: "2024-02-15T14:00:00Z",
   },
   {
     id: 2,
     user_id: 6,
     requested_tutor_id: null,
     course_id: 3,
     description: "Struggling with quadratic equations",
     status: "pending",
     created_at: "2024-02-16T10:30:00Z",
   },
   {
     id: 3,
     user_id: 4,
     requested_tutor_id: 3,
     course_id: 5,
     description: "Need help preparing for statistics midterm",
     status: "approved",
     created_at: "2024-02-10T09:00:00Z",
   },
   {
     id: 4,
     user_id: 6,
     requested_tutor_id: 2,
     course_id: 2,
     description: "Help with binary trees and sorting algorithms",
     status: "denied",
     created_at: "2024-02-08T11:00:00Z",
   },
 ];
 
 // Mock Tutoring Sessions
 export const mockTutoringSessions: TutoringSession[] = [
   {
     id: 1,
     tutor_id: 3,
     user_id: 4,
     request_id: 3,
     course_id: 5,
     start_time: "2024-02-12T14:00:00Z",
     end_time: "2024-02-12T15:00:00Z",
     status: "completed",
     attended: true,
     notes: "Covered hypothesis testing and p-values",
   },
   {
     id: 2,
     tutor_id: 3,
     user_id: 4,
     request_id: 3,
     course_id: 5,
     start_time: "2024-02-14T14:00:00Z",
     end_time: "2024-02-14T15:30:00Z",
     status: "completed",
     attended: true,
     notes: "Reviewed confidence intervals",
   },
   {
     id: 3,
     tutor_id: 2,
     user_id: 6,
     request_id: 1,
     course_id: 1,
     start_time: "2024-02-20T10:00:00Z",
     end_time: null,
     status: "scheduled",
     attended: null,
     notes: null,
   },
 ];
 
 // Mock Session Metrics
 export const mockSessionMetrics: SessionMetrics[] = [
   {
     date: "2024-02-15",
     total_sessions: 12,
     total_requests: 8,
     avg_duration: 55,
     total_spent: 660,
   },
   {
     date: "2024-02-14",
     total_sessions: 10,
     total_requests: 6,
     avg_duration: 50,
     total_spent: 500,
   },
   {
     date: "2024-02-13",
     total_sessions: 8,
     total_requests: 5,
     avg_duration: 45,
     total_spent: 360,
   },
 ];
 
 // Mock Tutor Metrics
 export const mockTutorMetrics: TutorMetrics[] = [
   { tutor_id: 2, total_sessions: 25, total_hours: 30, utilization: 75.0 },
   { tutor_id: 3, total_sessions: 18, total_hours: 22, utilization: 88.0 },
   { tutor_id: 5, total_sessions: 5, total_hours: 6, utilization: 30.0 },
 ];
 
 // Mock Course Metrics
 export const mockCourseMetrics: CourseMetrics[] = [
   { course_id: 1, total_requests: 15, total_sessions: 12 },
   { course_id: 3, total_requests: 12, total_sessions: 10 },
   { course_id: 5, total_requests: 8, total_sessions: 8 },
   { course_id: 2, total_requests: 6, total_sessions: 4 },
 ];
 
 // Helper functions
 export function getUserById(id: number): User | undefined {
   return mockUsers.find((u) => u.id === id);
 }
 
 export function getTutorByUserId(userId: number): Tutor | undefined {
   return mockTutors.find((t) => t.user_id === userId);
 }
 
 export function getCourseById(id: number): Course | undefined {
   return mockCourses.find((c) => c.id === id);
 }
 
 export function getTutorWithUser(userId: number) {
   const tutor = getTutorByUserId(userId);
   const user = getUserById(userId);
   if (tutor && user) {
     return { ...tutor, user };
   }
   return null;
 }
 
 export function getActiveTutors() {
   return mockTutors
     .filter((t) => t.active)
     .map((t) => getTutorWithUser(t.user_id))
     .filter(Boolean);
 }
 
 export function getPendingRequests() {
   return mockTutoringRequests.filter((r) => r.status === "pending");
 }
 
 export function getRequestsWithDetails() {
   return mockTutoringRequests.map((request) => ({
     ...request,
     user: getUserById(request.user_id)!,
     course: getCourseById(request.course_id)!,
     requested_tutor: request.requested_tutor_id
       ? getTutorWithUser(request.requested_tutor_id)
       : null,
   }));
 }
 
 export function getSessionsWithDetails() {
   return mockTutoringSessions.map((session) => ({
     ...session,
     tutor: getTutorWithUser(session.tutor_id)!,
     student: getUserById(session.user_id)!,
     course: getCourseById(session.course_id)!,
   }));
 }
 
 export function getTutorsForCourse(courseCode: string) {
   return mockTutors
     .filter((t) => t.active && t.subjects?.includes(courseCode))
     .map((t) => getTutorWithUser(t.user_id))
     .filter(Boolean);
 }