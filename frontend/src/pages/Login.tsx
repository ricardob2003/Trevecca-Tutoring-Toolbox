import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import trevLogo from "@/Images/TrevLogo.webp";
import cornerLeft from "@/Images/Login_Corner.png";
import cornerRight from "@/Images/Login_Corner_Right.png";
import loginHero from "@/Images/Trevecca-Login-Picture.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithMicrosoft, isLoading, isInitializing, error, isAuthenticated, currentUser } =
    useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleMicrosoftLogin = async () => {
    await loginWithMicrosoft();
  };

  useEffect(() => {
    if (isInitializing || !isAuthenticated || !currentUser) {
      return;
    }

    const redirectPath = currentUser.isAdmin ? "/admin/dashboard" : "/student/home";
    navigate(redirectPath, { replace: true });
  }, [currentUser, isAuthenticated, isInitializing, navigate]);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-white lg:block">
        <img
          src={cornerLeft}
          alt=""
          className="pointer-events-none absolute left-0 top-0 h-32 w-32 object-cover xl:h-44 xl:w-44"
          aria-hidden
        />
        <img
          src={cornerRight}
          alt=""
          className="pointer-events-none absolute bottom-0 right-0 h-32 w-36 object-cover xl:h-44 xl:w-48"
          aria-hidden
        />

        <div className="absolute left-10 top-10 xl:left-14 xl:top-12">
          <img
            src={trevLogo}
            alt="Trevecca Tutoring logo"
            className="h-auto w-[260px] xl:w-[340px]"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center px-8 pb-10 xl:pb-14">
          <img
            src={loginHero}
            alt="Students studying on campus"
            className="h-auto w-full max-w-[520px] object-contain"
          />
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <img src={trevLogo} alt="Trevecca Tutoring logo" className="mx-auto h-auto w-52 sm:w-60" />
            <h1 className="mt-4 text-xl font-semibold text-foreground sm:text-2xl">
              Trevecca Tutoring Center
            </h1>
          </div>

          <div className="rounded-2xl border border-[#EEEEEE] bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.08)] sm:p-6">
            <div className="mb-5">
              <h2 className="w-fit border-b-2 border-foreground/90 pb-1.5 text-xl font-bold text-foreground">
                Tutoring Toolbox
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Log in to schedule or manage tutoring sessions
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@trevecca.edu"
                  className="w-full rounded-lg border-0 bg-[#F0F0F0] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4A7DC]/50"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border-0 bg-[#F0F0F0] px-3 py-2 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#C4A7DC]/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="hidden sm:inline">{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <a
                  href="#"
                  className="mt-1 block text-right text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Forgot Password?
                </a>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C4A7DC] bg-[#E6D3F2] py-2 text-sm font-bold text-foreground transition-colors hover:bg-[#DDC6EB] disabled:cursor-not-allowed disabled:opacity-70"
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

            <div className="my-4 border-t border-[#E0E0E0]" />

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#333] bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 25 25" fill="none" stroke="currentColor" strokeWidth="0">
                <rect x="3" y="3" width="9" height="9" fill="#F25022" />
                <rect x="14" y="3" width="9" height="9" fill="#7FBA00" />
                <rect x="3" y="14" width="9" height="9" fill="#00A4EF" />
                <rect x="14" y="14" width="9" height="9" fill="#FFB900" />
              </svg>
              <span>Sign In With Microsoft</span>
            </button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-bold underline hover:text-foreground">
                Sign up
              </a>
            </p>

            <div className="mt-3 border-t border-[#EEEEEE] pt-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Demo accounts:</p>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <p><strong>Admin:</strong> admin@trevecca.edu</p>
                <p><strong>Student/Tutor:</strong> jsmith@trevecca.edu</p>
                <p><strong>Student:</strong> michael.brown@trevecca.edu</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
