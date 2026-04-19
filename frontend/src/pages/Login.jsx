import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { loginSchema } from "../lib/schemas";
import AuthShell from "../components/AuthShell";

const getFormErrors = (issues) =>
  issues.reduce((acc, issue) => {
    const key = issue.path[0];

    if (key && !acc[key]) {
      acc[key] = issue.message;
    }

    return acc;
  }, {});

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const inputCls = `h-14 w-full rounded-xl border pl-12 pr-4 text-[1rem] outline-none transition-all placeholder:text-zinc-400 ${
    isDark 
      ? "border-zinc-800 bg-zinc-900/50 text-zinc-100 focus:border-zinc-700 focus:ring-4 focus:ring-zinc-800/20" 
      : "border-zinc-200 bg-white text-zinc-900 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100"
  }`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    if (errors[name]) setErrors((c) => ({ ...c, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);

    if (!result.success) {
      setErrors(getFormErrors(result.error.issues));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { data } = await API.post("/auth/login", form);
      login({ _id: data._id, name: data.name, email: data.email }, data.token);
      toast.success(`Welcome back, ${data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell 
      title="Log In" 
      subtitle="Enter your credentials to access your notes."
      footer={
        <p className="mt-8 text-center text-base font-medium text-zinc-500">
          New here?{" "}
          <Link to="/signup" className="font-bold text-blue-600 hover:underline">Create an account.</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="relative">
            <Mail size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input id="login-email" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>
          {errors.email && <p className="text-xs font-bold text-red-500 px-1">{errors.email}</p>}
          
          <div>
            <div className="relative">
              <Lock size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={handleChange} className={`${inputCls} pr-14`} />
              <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-xs font-bold text-red-500 px-1">{errors.password}</p>}
          </div>
        </div>

        <button 
          id="login-submit" 
          type="submit" 
          disabled={loading} 
          className="h-14 w-full rounded-xl bg-[#0066ff] text-white text-[1.1rem] font-bold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:-translate-y-[1px] disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
