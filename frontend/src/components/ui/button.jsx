import { forwardRef } from "react";

const baseClassName =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  default: "bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white",
  ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100",
  destructive: "border border-red-500/10 bg-red-500/10 text-red-500 hover:bg-red-500/20 dark:text-red-400",
  outline: "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-900",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
};

const sizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-8 text-base",
  icon: "h-9 w-9 p-0",
};

const Button = forwardRef(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const resolvedClassName = [
    baseClassName,
    variants[variant] || variants.default,
    sizes[size] || sizes.default,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={resolvedClassName} ref={ref} {...props} />;
});

Button.displayName = "Button";

export { Button };
