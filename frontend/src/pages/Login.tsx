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
  return <div className="h-screen overflow-hidden bg-background flex">
       {/* Left side - Branding */}
       <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#FFFFFF]"> { /* #532c6d */}
         <div>
           <div className="flex items-center gap-3">
             <img src="src\Images\TrevLogo.webp" alt="Trevecca Transparent Logo" 
             style={{width: "350px", height: "90px", position: "absolute", top: "110px", left: "175px", zIndex: 5}}></img> 
            {/* <span className="text-2xl font-bold text-primary-foreground">
               Trevecca Nazarene University
             </span> */}
           </div>
         </div>
         <div>
              <img src="src\Images\Login_Corner.png" alt="Trevecca Top left Corner Design"
              style= {{width: "200px", height: "200px", position: "absolute", top: "0px" , left: "0px"}}>
              </img>
         </div>
         <div>
              <img src="src\Images\Login_Corner_Right.png" alt="Trevecca Bottom Right Corner Design"
                style= {{width: "230px", height: "200px", position: "absolute", bottom: "0px" , right: "0px"}}>
              </img>
              {/* White rectangle to cover stray line below shield in corner image */}
              <div
                className="bg-white"
                style={{
                  position: "absolute",
                  top: "190px",
                  left: "75px",
                  width: "100px",
                  height: "14px",
                  zIndex: 10,
                }}
                aria-hidden
              />
         </div>
         <div>
           <img src="src\Images\Trevecca-Login-Picture.png" alt="Trevecca Login Picture"
           style={{width: "480px", height: "420px", position: "absolute", top: "200px", left: "85px"}}>
           </img>
         </div>
       </div>
 
       {/* Right side - Login Form (full white; card narrow to leave room for bottom-right decorations) */}
       <div className="w-full lg:w-1/2 flex items-start justify-start p-6 bg-white h-full overflow-hidden">
         <div className="w-full max-w-[360px] mt-10 lg:mt-14 ml-2 lg:ml-4">
           {/* Mobile branding */}
           <div className="lg:hidden mb-4 text-center">
             <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
               <span className="text-primary-foreground font-bold text-2xl">T</span>
             </div>
             <h1 className="text-2xl font-bold text-foreground">TNU Tutoring Center</h1>
           </div>

           <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 border border-[#EEEEEE]">
             {/* Header */}
             <div className="mb-4">
               <h2 className="text-xl font-bold text-foreground pb-1.5 border-b-2 border-foreground/90 w-fit">
                 Tutoring Toolbox
               </h2>
               <p className="text-muted-foreground mt-1.5 text-sm">
                 Log in to schedule or manage tutoring sessions
               </p>
             </div>

             {/* Email/Password Form */}
             <form onSubmit={handleSubmit} className="space-y-3">
               {error && (
                 <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                   <p className="text-sm text-destructive">{error}</p>
                 </div>
               )}

               <div>
                 <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                   Email
                 </label>
                 <input
                   id="email"
                   type="email"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   placeholder="your.email@trevecca.edu"
                   className="w-full px-3 py-2 rounded-lg bg-[#F0F0F0] border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4A7DC]/50 text-sm"
                   required
                 />
               </div>

               <div>
                 <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                   Password
                 </label>
                 <div className="relative flex items-center">
                   <input
                     id="password"
                     type={showPassword ? "text" : "password"}
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     placeholder="Enter your password"
                     className="w-full px-3 py-2 pr-20 rounded-lg bg-[#F0F0F0] border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4A7DC]/50 text-sm"
                     required
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     <span>{showPassword ? "Hide" : "Show"}</span>
                   </button>
                 </div>
                 <a href="#" className="block text-right text-xs text-muted-foreground underline hover:text-foreground mt-1">
                   Forgot Password?
                 </a>
               </div>

               <div className="pt-1 pb-3">
                 <button
                   type="submit"
                   disabled={isLoading}
                   className="w-full py-2 rounded-lg font-bold text-foreground bg-[#E6D3F2] border border-[#C4A7DC] hover:bg-[#DDC6EB] transition-colors flex items-center justify-center gap-2 text-sm"
                 >
                   {isLoading ? (
                     <>
                       <Loader2 size={18} className="animate-spin" />
                       Signing in...
                     </>
                   ) : (
                     "Sign In"
                   )}
                 </button>
               </div>
             </form>

             {/* Separator */}
             <div className="border-t border-[#E0E0E0] my-3" />

             {/* SSO */}
             <div className="flex justify-center">
               <button
                 type="button"
                 onClick={handleMicrosoftLogin}
                 disabled={isLoading}
                 className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] bg-white text-foreground font-medium hover:bg-[#F5F5F5] transition-colors text-sm"
               >
                 <svg className="w-5 h-5 shrink-0" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth="0">
                   <rect x="3" y="3" width="9" height="9" fill="#F25022" />
                   <rect x="14" y="3" width="9" height="9" fill="#7FBA00" />
                   <rect x="3" y="14" width="9" height="9" fill="#00A4EF"/>
                   <rect x="14" y="14" width="9" height="9" fill="#FFB900"/>
                 </svg>
                 <span>
                   Sign In With Microsoft
                 </span>
               </button>
             </div>

             {/* Sign up */}
             <p className="text-center text-muted-foreground text-xs mt-3">
               Don&apos;t have an account?{" "}
               <a href="#" className="font-bold underline hover:text-foreground">
                 Sign up
               </a>
             </p>

             {/* Demo credentials - subtle */}
             <div className="mt-3 pt-3 border-t border-[#EEEEEE]">
               <p className="text-xs font-medium text-muted-foreground mb-1">Demo accounts:</p>
               <div className="space-y-0.5 text-xs text-muted-foreground">
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