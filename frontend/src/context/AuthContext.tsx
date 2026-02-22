 import React, { createContext, useContext, useReducer, ReactNode } from "react";
 import type { User, Tutor, AuthUser } from "@/types";
 import { loginAPI } from "@/lib/api";
 
 interface AuthState {
   isAuthenticated: boolean;
   currentUser: AuthUser | null;
   isLoading: boolean;
   error: string | null;
 }
 
 type AuthAction =
   | { type: "LOGIN_START" }
   | { type: "LOGIN_SUCCESS"; payload: AuthUser }
   | { type: "LOGIN_ERROR"; payload: string }
   | { type: "LOGOUT" };
 
 const initialState: AuthState = {
   isAuthenticated: false,
   currentUser: null,
   isLoading: false,
   error: null,
 };
 
 function authReducer(state: AuthState, action: AuthAction): AuthState {
   switch (action.type) {
     case "LOGIN_START":
       return { ...state, isLoading: true, error: null };
     case "LOGIN_SUCCESS":
       return {
         ...state,
         isLoading: false,
         isAuthenticated: true,
         currentUser: action.payload,
         error: null,
       };
     case "LOGIN_ERROR":
       return {
         ...state,
         isLoading: false,
         isAuthenticated: false,
         currentUser: null,
         error: action.payload,
       };
     case "LOGOUT":
       return initialState;
     default:
       return state;
   }
 }
 
 interface AuthContextType extends AuthState {
   login: (email: string, password: string) => Promise<void>;
   loginWithMicrosoft: () => Promise<void>;
   logout: () => void;
 }
 
 const AuthContext = createContext<AuthContextType | null>(null);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(authReducer, initialState);
 
   const login = async (email: string, password: string) => {
     try {
       dispatch({ type: "LOGIN_START" });

       // Call real backend API
       const { token, user: userData } = await loginAPI(email, password);

       // Store JWT token
       localStorage.setItem("authToken", token);

       // Map API response to AuthUser format
       const user: User = {
         id: userData.id,
         trevecca_id: String(userData.id),
         email: userData.email,
         first_name: userData.firstName,
         last_name: userData.lastName,
         role: userData.role as "admin" | "student",
         major: null,
         year: null,
         created_at: new Date().toISOString(),
       };

       const tutor: Tutor | null = userData.tutor
         ? {
             user_id: userData.id,
             subjects: userData.tutor.subjects.join(", "),
             hourly_limit: userData.tutor.hourlyLimit,
             active: userData.tutor.active,
           }
         : null;

       const authUser: AuthUser = {
         user,
         tutor,
         isAdmin: userData.role === "admin",
         isTutor: Boolean(userData.tutor?.active),
       };

       dispatch({ type: "LOGIN_SUCCESS", payload: authUser });
     } catch (error) {
       dispatch({
         type: "LOGIN_ERROR",
         payload: error instanceof Error ? error.message : "Login failed",
       });
     }
   };
 
  const loginWithMicrosoft = async () => {
    // Placeholder for future Microsoft Entra ID integration.
    dispatch({ type: "LOGIN_START" });
    await new Promise((resolve) => setTimeout(resolve, 300));
    dispatch({
      type: "LOGIN_ERROR",
      payload: "Microsoft sign-in is coming soon. Please use email/password for now.",
    });
  };
 
   const logout = () => {
     localStorage.removeItem("authToken");
     dispatch({ type: "LOGOUT" });
   };
 
   return (
     <AuthContext.Provider
       value={{
         ...state,
         login,
         loginWithMicrosoft,
         logout,
       }}
     >
       {children}
     </AuthContext.Provider>
   );
 }
 
 export function useAuth() {
   const context = useContext(AuthContext);
   if (!context) {
     throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
 }
