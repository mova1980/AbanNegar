import React, { useState } from "react";
import { motion } from "motion/react";
import { Lock, User, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import Logo from "./Logo";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulated short delay for natural feels
    setTimeout(() => {
      if (username === "admin" && password === "123") {
        localStorage.setItem("avanevis_aban_auth", "true");
        onLoginSuccess();
      } else {
        setError("نام کاربری یا کلمه عبور وارد شده صحیح نمی‌باشد.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center p-4 select-none"
      dir="rtl"
      id="login-landing-container"
    >
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/40 dark:bg-blue-950/10 blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-slate-200/40 dark:bg-slate-900/10 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative z-10"
        id="login-card"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <Logo size={105} />
          <div className="space-y-1.5 mt-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              آوانویس هوشمند آبان
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              سامانه هوشمند تبدیل گفتار صوتی و ویدیویی به متن فارسی
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pr-1">
              نام کاربری
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="نام کاربری سیستم را وارد کنید"
                className="w-full pl-4 pr-11 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 font-sans text-sm transition-all text-right"
                id="login-username-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block pr-1">
              کلمه عبور
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-4 pr-11 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 font-sans text-sm transition-all text-right"
                id="login-password-input"
              />
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 border border-rose-200/50 bg-rose-50/80 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2.5 text-xs font-medium"
              id="login-error-alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/70 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 active:translate-y-0.5"
            id="login-submit-btn"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ورود به پنل مدیریت آوانویس</span>
              </>
            )}
          </button>
        </form>

        {/* Info notice */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-850 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            طراحی و پیاده‌سازی توسط شرکت راهکار پدیده آبان
          </p>
        </div>
      </motion.div>
    </div>
  );
}
