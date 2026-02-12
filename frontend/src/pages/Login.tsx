import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    loginWithMicrosoft,
    isLoading,
    error
  } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };
  const handleMicrosoftLogin = async () => {
    await loginWithMicrosoft();
  };

  // Redirect after successful login is handled in App.tsx
  const {
    isAuthenticated,
    currentUser
  } = useAuth();
  if (isAuthenticated && currentUser) {
    const redirectPath = currentUser.isAdmin ? "/admin/dashboard" : "/student/home";
    navigate(redirectPath, {
      replace: true
    });
  }
  return <div className="min-h-screen bg-background flex">
       {/* Left side - Branding */}
       <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#532c6d]">
         <div>
           <div className="flex items-center gap-3">
             <img src="images/TrevLogo.webp" alt="Trevecca Transparent Logo"></img> 
            {/* <span className="text-2xl font-bold text-primary-foreground">
               Trevecca Nazarene University
             </span> */}
           </div>
         </div>
 
         <div>
           <h1 className="text-4xl font-bold text-primary-foreground mb-4">
             Tutoring Center
           </h1>
           <p className="text-lg text-primary-foreground/80 max-w-md">
             Connect with peer tutors, schedule sessions, and get the academic support 
             you need to succeed at Trevecca.
           </p>
         </div>
 
         <div className="text-primary-foreground/60 text-sm">
           © 2024 Trevecca Nazarene University. All rights reserved.
         </div>
       </div>
 
       {/* Right side - Login Form */}
       <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
         <div className="w-full max-w-md">
           {/* Mobile branding */}
           <div className="lg:hidden mb-8 text-center">
             <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
               <span className="text-primary-foreground font-bold text-2xl">T</span>
             </div>
             <h1 className="text-2xl font-bold text-foreground">TNU Tutoring Center</h1>
           </div>
 
           <div className="card-base p-8">
             <div className="mb-8">
               <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h2>
               <p className="text-muted-foreground">
                 Sign in to access the tutoring platform
               </p>
             </div>
 
             {/* Microsoft SSO Button */}
             <button type="button" onClick={handleMicrosoftLogin} disabled={isLoading} className="w-full flex items-center justify-center gap-3 px-4 py-3 
                        border border-border rounded-md bg-card hover:bg-muted 
                        transition-colors mb-6">
               <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                 <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                 <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                 <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                 <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
               </svg>
               <span className="font-medium text-foreground">Sign in with Microsoft</span>
             </button>
 
             <div className="relative mb-6">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-border"></div>
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-2 bg-card text-muted-foreground">or continue with email</span>
               </div>
             </div>
 
             {/* Email/Password Form */}
             <form onSubmit={handleSubmit} className="space-y-4">
               {error && <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                   <p className="text-sm text-destructive">{error}</p>
                 </div>}
 
               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                   Email
                 </label>
                 <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@trevecca.edu" className="input-field" required />
               </div>
 
               <div>
                 <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                   Password
                 </label>
                 <div className="relative">
                   <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="input-field pr-10" required />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>
 
               <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                 {isLoading ? <>
                     <Loader2 size={18} className="animate-spin" />
                     Signing in...
                   </> : "Sign in"}
               </button>
             </form>
 
             {/* Demo credentials */}
             <div className="mt-6 p-4 rounded-md bg-muted">
               <p className="text-xs font-medium text-muted-foreground mb-2">Demo accounts:</p>
               <div className="space-y-1 text-xs text-muted-foreground">
                 <p><strong>Admin:</strong> admin@trevecca.edu</p>
                 <p><strong>Student/Tutor:</strong> jsmith@trevecca.edu</p>
                 <p><strong>Student:</strong> michael.brown@trevecca.edu</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>;
}