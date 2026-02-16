 import React, { createContext, useContext, useReducer, ReactNode } from "react";
 import type { User, Tutor, AuthUser } from "@/types";
 import { mockUsers, mockTutors } from "@/data/mockData";
 
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
 
   const login = async (email: string, _password: string) => {
     dispatch({ type: "LOGIN_START" });
 
     // Simulate API delay
     await new Promise((resolve) => setTimeout(resolve, 500));
 
     // Mock authentication - find user by email
     const user = mockUsers.find(
       (u) => u.email.toLowerCase() === email.toLowerCase()
     );
 
     if (!user) {
       dispatch({ type: "LOGIN_ERROR", payload: "Invalid email or password" });
       return;
     }
 
     // Check if user is a tutor
     const tutor = mockTutors.find((t) => t.user_id === user.id) || null;
 
     const authUser: AuthUser = {
       user,
       tutor,
       isAdmin: user.role === "admin",
       isTutor: tutor !== null && tutor.active,
     };
 
     dispatch({ type: "LOGIN_SUCCESS", payload: authUser });
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
