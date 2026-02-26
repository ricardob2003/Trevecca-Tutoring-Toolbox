 import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
 import type { User, Tutor, AuthUser } from "@/types";
 import {
   getCurrentUserAPI,
   loginAPI,
   logoutAPI,
   type LoginResponse,
 } from "@/lib/api";
 
 interface AuthState {
   isAuthenticated: boolean;
   currentUser: AuthUser | null;
   isLoading: boolean;
   isInitializing: boolean;
   error: string | null;
 }
 
 type AuthAction =
   | { type: "HYDRATE_START" }
   | { type: "HYDRATE_FINISH"; payload: AuthUser | null }
   | { type: "LOGIN_START" }
   | { type: "LOGIN_SUCCESS"; payload: AuthUser }
   | { type: "LOGIN_ERROR"; payload: string }
   | { type: "LOGOUT" };
 
 const initialState: AuthState = {
   isAuthenticated: false,
   currentUser: null,
   isLoading: false,
   isInitializing: true,
   error: null,
 };
 
 function authReducer(state: AuthState, action: AuthAction): AuthState {
   switch (action.type) {
     case "HYDRATE_START":
       return { ...state, isInitializing: true, error: null };
     case "HYDRATE_FINISH":
       return {
         ...state,
         isInitializing: false,
         isAuthenticated: Boolean(action.payload),
         currentUser: action.payload,
       };
     case "LOGIN_START":
       return { ...state, isLoading: true, isInitializing: false, error: null };
     case "LOGIN_SUCCESS":
       return {
         ...state,
         isLoading: false,
         isInitializing: false,
         isAuthenticated: true,
         currentUser: action.payload,
         error: null,
       };
     case "LOGIN_ERROR":
       return {
         ...state,
         isLoading: false,
         isInitializing: false,
         isAuthenticated: false,
         currentUser: null,
         error: action.payload,
       };
     case "LOGOUT":
       return { ...initialState, isInitializing: false };
     default:
       return state;
   }
 }
 
 function mapApiUserToAuthUser(userData: LoginResponse["user"]): AuthUser {
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
 
   return {
     user,
     tutor,
     isAdmin: userData.role === "admin",
     isTutor: Boolean(userData.tutor?.active),
   };
 }
 
 interface AuthContextType extends AuthState {
   login: (email: string, password: string) => Promise<void>;
   loginWithMicrosoft: () => Promise<void>;
   logout: () => Promise<void>;
 }
 
 const AuthContext = createContext<AuthContextType | null>(null);
 
 export function AuthProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(authReducer, initialState);

   useEffect(() => {
     let cancelled = false;

     const hydrateSession = async () => {
       dispatch({ type: "HYDRATE_START" });

       try {
         const { user } = await getCurrentUserAPI();
         if (!cancelled) {
           dispatch({
             type: "HYDRATE_FINISH",
             payload: mapApiUserToAuthUser(user),
           });
         }
       } catch {
         if (!cancelled) {
           dispatch({ type: "HYDRATE_FINISH", payload: null });
         }
       }
     };

     void hydrateSession();

     return () => {
       cancelled = true;
     };
   }, []);
 
   const login = async (email: string, password: string) => {
     try {
       dispatch({ type: "LOGIN_START" });

       const { user } = await loginAPI(email, password);
       dispatch({ type: "LOGIN_SUCCESS", payload: mapApiUserToAuthUser(user) });
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
 
   const logout = async () => {
     try {
       await logoutAPI();
     } finally {
       dispatch({ type: "LOGOUT" });
     }
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
