import { Moon, Sun, NotebookPen } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import authLight from "../assets/auth-light.png";
import authDark from "../assets/auth-dark.jpg";

const AuthShell = ({ title, subtitle, children, footer }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen transition-all duration-500 flex ${
        isDark ? "bg-[#0f0f11] text-zinc-100" : "bg-white text-zinc-900"
      }`}
    >
      {isDark && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-sky-900/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-900/15 blur-[120px]" />
        </div>
      )}

      <div className="flex h-screen w-full overflow-hidden">
        <section className="relative hidden w-[50%] flex-col lg:flex overflow-hidden">
          <motion.img
            key={isDark ? "dark" : "light"}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={isDark ? authDark : authLight}
            alt="Welcome Background"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />

          <div className="relative z-20 flex items-center gap-2.5 p-10 mt-2">
            <div
              className={`flex h-[36px] w-[36px] items-center justify-center rounded-lg transition-all duration-300 ${
                isDark
                  ? "bg-zinc-800 text-zinc-100"
                  : "bg-white/80 backdrop-blur-md text-[#1f1f22] shadow-sm border border-zinc-200/50"
              }`}
            >
              <NotebookPen size={18} strokeWidth={2.5} />
            </div>
            <span
              className={`text-[1.35rem] font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#1f1f22]"
              }`}
            >
              NoteFlow
            </span>
          </div>
        </section>

        <section
          className={`relative flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 transition-all duration-500 overflow-y-auto ${
            isDark ? "bg-[#0f0f11]" : "bg-white"
          }`}
        >
          <button
            type="button"
            onClick={toggleTheme}
            className={`absolute right-8 top-8 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark
                ? "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
                : "border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="w-full max-w-[420px]">
            <div className="mb-10 flex items-center gap-2.5 lg:hidden">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isDark ? "bg-zinc-800 text-zinc-100" : "bg-[#1f1f22] text-white"
                }`}
              >
                <NotebookPen size={22} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight">Notes</span>
            </div>

            <div className="mb-10">
              <h1
                className={`text-[2.25rem] sm:text-[2.5rem] font-bold leading-tight tracking-tight ${
                  isDark ? "text-white" : "text-[#1f1f22]"
                }`}
              >
                {title}
              </h1>
              <p
                className={`mt-2.5 text-[0.95rem] sm:text-[1rem] font-medium leading-relaxed ${
                  isDark ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {subtitle}
              </p>
            </div>

            {children}

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
