import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { signupSchema } from "../lib/schemas";
import AuthShell from "../components/AuthShell";

const getFormErrors = (issues) =>
  issues.reduce((acc, issue) => {
    const key = issue.path[0];

    if (key && !acc[key]) {
      acc[key] = issue.message;
    }

    return acc;
  }, {});

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
    const result = signupSchema.safeParse(form);

    if (!result.success) {
      setErrors(getFormErrors(result.error.issues));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { data } = await API.post("/auth/signup", form);
      login({ _id: data._id, name: data.name, email: data.email }, data.token);
      toast.success(`Welcome to NoteFlow, ${data.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell 
      title="Sign Up" 
      subtitle="Create your account to start capturing better notes."
      footer={
        <p className="mt-8 text-center text-base font-medium text-zinc-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">Log in.</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="relative">
            <User size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input id="signup-name" name="name" type="text" placeholder="Full Name" value={form.name} onChange={handleChange} className={inputCls} />
          </div>
          {errors.name && <p className="text-xs font-bold text-red-500 px-1">{errors.name}</p>}
          
          <div className="relative">
            <Mail size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input id="signup-email" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} className={inputCls} />
          </div>
          {errors.email && <p className="text-xs font-bold text-red-500 px-1">{errors.email}</p>}
          
          <div>
            <div className="relative">
              <Lock size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input id="signup-password" name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={handleChange} className={`${inputCls} pr-14`} />
              <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-2 px-1 text-sm text-zinc-500">Must be at least 8 characters</p>
            {errors.password && <p className="mt-1 text-xs font-bold text-red-500 px-1">{errors.password}</p>}
          </div>
        </div>

        <button 
          id="signup-submit" 
          type="submit" 
          disabled={loading} 
          className="h-14 w-full rounded-xl bg-[#0066ff] text-white text-[1.1rem] font-bold shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:-translate-y-[1px] disabled:opacity-70"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Signup;
