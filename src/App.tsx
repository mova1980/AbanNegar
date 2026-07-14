import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Mic,
  Activity,
  CheckCircle2,
  FileAudio,
  AlertTriangle,
  History,
  Settings,
  HelpCircle,
  Clock,
  ChevronDown,
  Info,
  BarChart2,
} from "lucide-react";

import AudioUploader from "./components/AudioUploader";
import TranscriptResult from "./components/TranscriptResult";
import HistoryList from "./components/HistoryList";
import { TranscriptionRecord, TranscribeStyle } from "./types";
import Logo from "./components/Logo";
import Login from "./components/Login";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [style, setStyle] = useState<TranscribeStyle>("transcript");
  const [transcribing, setTranscribing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: upload, 1: gemini audio check, 2: transcribe, 3: formatting
  const [result, setResult] = useState<TranscriptionRecord | null>(null);
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Stats and usage calculations
  const totalProcessedFiles = history.length;
  const totalProcessedSizeBytes = history.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  const totalProcessedSeconds = history.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const totalProcessedMinutes = Math.floor(totalProcessedSeconds / 60);
  const remainingCreditMinutes = Math.max(0, 120 - totalProcessedMinutes);
  const creditPercentage = Math.round((remainingCreditMinutes / 120) * 100);

  const getDisplayPercent = () => {
    if (loadingStep === 0) {
      return Math.round(uploadProgress * 0.4);
    }
    if (loadingStep === 1) return 55;
    if (loadingStep === 2) return 75;
    if (loadingStep === 3) return 92;
    return 100;
  };

  const getFriendlySize = (bytes: number): string => {
    if (bytes === 0) return "0 مگابایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Check authentication on mount
  useEffect(() => {
    if (localStorage.getItem("avanevis_aban_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Load history and restore last active result from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("persian_s2t_history");
      if (stored) {
        const parsedHistory = JSON.parse(stored);
        setHistory(parsedHistory);
        
        const activeId = localStorage.getItem("avanevis_aban_active_id");
        if (activeId) {
          const activeRecord = parsedHistory.find((r: TranscriptionRecord) => r.id === activeId);
          if (activeRecord) {
            setResult(activeRecord);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
    }
  }, []);

  // Save active result ID to restore on refresh
  useEffect(() => {
    if (result) {
      localStorage.setItem("avanevis_aban_active_id", result.id);
    } else {
      localStorage.removeItem("avanevis_aban_active_id");
    }
  }, [result]);

  // Sequential loading step simulator for a smooth user experience
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transcribing) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 7000); // Shift simulated step messages every 7 seconds
    }
    return () => clearInterval(interval);
  }, [transcribing]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setDuration(undefined);
    setErrorMessage(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setDuration(undefined);
    setErrorMessage(null);
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;

    setTranscribing(true);
    setResult(null);
    setErrorMessage(null);
    setLoadingStep(0);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("style", style);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/transcribe");

        // Real upload progress handler
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        xhr.onload = () => {
          const status = xhr.status;
          
          if (status >= 200 && status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              resolve(parsed);
            } catch (e) {
              reject(new Error("پاسخ دریافتی از سرور در قالب مجاز (JSON) نیست. لطفاً دوباره تلاش کنید."));
            }
          } else {
            // Handle error status codes
            let errorMessage = "";
            try {
              const parsed = JSON.parse(xhr.responseText);
              errorMessage = parsed.error || `خطایی در سرور رخ داده است (کد ${status}).`;
            } catch (e) {
              if (status === 413) {
                errorMessage = "حجم فایل ارسال شده بیش از حد مجاز است. لطفاً فایلی با حجم کمتر از ۵۰ مگابایت آپلود کنید.";
              } else if (status === 502 || status === 504) {
                errorMessage = "خطای ارتباط با سرور (پاسخگو نبودن سرور یا Gateway). لطفاً چند لحظه دیگر تلاش کنید.";
              } else if (status === 500) {
                errorMessage = "خطای داخلی سرور رخ داده است. لطفاً وضعیت کلید API جمینای و اتصال را بررسی کنید.";
              } else {
                errorMessage = `خطای سرور با کد ${status}. ${xhr.statusText || ""}`;
              }
            }
            reject(new Error(errorMessage));
          }
        };

        xhr.onerror = () => {
          reject(new Error("خطای شبکه در حین بارگذاری رخ داد. لطفاً اتصال اینترنت خود را بررسی کنید."));
        };

        xhr.send(formData);
      });

      // Success processing
      const dateString = new Date().toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Calculate simple stats
      const cleanText = data.transcript.trim().replace(/\s+/g, " ");
      const words = cleanText ? cleanText.split(" ") : [];

      const newRecord: TranscriptionRecord = {
        id: Date.now().toString(),
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        date: dateString,
        transcript: data.transcript,
        style: style,
        wordCount: words.length,
        charCount: data.transcript.length,
        duration: duration,
      };

      setResult(newRecord);
      
      // Update history in state and localStorage
      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem("persian_s2t_history", JSON.stringify(updatedHistory));

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "خطایی در اتصال به سرور رخ داد. لطفاً حجم فایل و اینترنت خود را بررسی کنید.");
    } finally {
      setTranscribing(false);
    }
  };

  const handleSelectHistoryRecord = (record: TranscriptionRecord) => {
    setResult(record);
    // Smooth scroll down to the result viewer if on mobile
    const el = document.getElementById("transcript-result-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    localStorage.setItem("persian_s2t_history", JSON.stringify(updated));
    if (result && result.id === id) {
      setResult(null);
    }
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem("persian_s2t_history");
    setResult(null);
  };

  const handleSaveEditedTranscript = (newText: string) => {
    if (!result) return;
    
    // Update local state
    const updatedRecord = { ...result, transcript: newText };
    setResult(updatedRecord);

    // Update in history list
    const updatedHistory = history.map((r) => (r.id === result.id ? updatedRecord : r));
    setHistory(updatedHistory);
    localStorage.setItem("persian_s2t_history", JSON.stringify(updatedHistory));
  };

  // Human-readable loading steps in Persian
  const getLoadingMessage = () => {
    const isVid = selectedFile?.type.startsWith("video/") || selectedFile?.name.toLowerCase().endsWith(".mp4");
    const fileTypeStr = isVid ? "ویدیویی" : "صوتی";
    switch (loadingStep) {
      case 0:
        return `در حال بارگذاری فایل ${fileTypeStr} به سرور...`;
      case 1:
        return "در حال آماده‌سازی مدل هوش مصنوعی جمینای (Gemini 3.5)...";
      case 2:
        return `هوش مصنوعی در حال تحلیل دقیق امواج ${isVid ? "ویدیویی و صوتی" : "صوتی"} و واژگان فارسی...`;
      case 3:
        return "در حال ویرایش نگارشی و ساختارسازی متن نهایی...";
      default:
        return `در حال پردازش فایل ${fileTypeStr}...`;
    }
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 font-sans selection:bg-blue-500 selection:text-white" dir="rtl" id="app-container">
      
      {/* Clean Minimalism Professional Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-10 animate-fade-in" id="app-navbar">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={42} className="rounded-lg shadow-xs" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>آوانویس آبان</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-semibold px-2 py-0.5 rounded">نسخه مدیریت</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold border border-green-100 dark:border-green-900/30">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              <span>سرویس فعال است</span>
            </span>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 hidden md:block">اعتبار باقیمانده: {remainingCreditMinutes} دقیقه</div>
            <button
              onClick={() => {
                localStorage.removeItem("avanevis_aban_auth");
                setIsAuthenticated(false);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              id="logout-btn"
            >
              خروج از حساب
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with 12 cols layout */}
      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Workspace (Left Column on large screens - occupies 8 cols) */}
        <div className="lg:col-span-8 space-y-6" id="main-panel">
          
          {/* Welcome and feature description Card */}
          <div className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs space-y-3">
            <h2 className="text-md font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>تبدیل انواع فایل‌های صوتی و ویدیویی به متن دقیق با هوش مصنوعی</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-justify">
              این سیستم با بهره‌گیری از جدیدترین مدل‌های هوش مصنوعی گوگل (Gemini 3.5) فایل‌های صوتی و ویدیویی (از جمله MP4) شما را تحلیل کرده و بدون هیچ کم و کاستی گفتار صوتی را شناسایی و به صورت متن روان، پاراگراف‌بندی شده یا صورت‌جلسه مدون ارائه می‌دهد. از این متن ویرایش‌پذیر می‌توانید خروجی‌های معتبر <strong className="text-slate-700 dark:text-slate-300">Word</strong> یا <strong className="text-slate-700 dark:text-slate-300">PDF</strong> دانلود کنید.
            </p>
          </div>

          {/* Audio Uploader Box */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">۱. بارگذاری فایل صوتی یا ویدیویی جدید</h3>
            <AudioUploader
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClearFile={handleClearFile}
              onDurationChange={(d) => setDuration(d)}
            />

            {/* Submit Actions */}
            {selectedFile && !transcribing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-2"
              >
                <button
                  onClick={handleTranscribe}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-xs cursor-pointer transition-all hover:shadow-md active:translate-y-0"
                  id="start-transcription-btn"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>شروع فرآیند تبدیل به متن فارسی</span>
                </button>
              </motion.div>
            )}
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-3"
              id="error-banner"
            >
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-rose-500" />
              <div>
                <h4 className="font-semibold text-sm">خطا در فرآیند</h4>
                <p className="text-xs mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {/* Loading View */}
          {transcribing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-xs text-center space-y-6"
              id="processing-loader-view"
            >
              {/* Custom Bouncing Soundwave Animation */}
              <div className="flex items-center justify-center gap-1.5 h-16">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <motion.span
                    key={i}
                    animate={{
                      height: ["15px", i % 2 === 0 ? "50px" : "35px", "15px"],
                    }}
                    transition={{
                      duration: 0.8 + (i * 0.1),
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-2 bg-blue-600 rounded-full"
                  />
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></span>
                  <span>در حال تبدیل گفتار به متن...</span>
                </h3>
                
                {/* Beautiful Progress Bar */}
                <div className="w-full max-w-md mx-auto p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl" id="upload-progress-container">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5 font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">پیشرفت فرآیند</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-sm font-bold">
                      {getDisplayPercent()}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200/60 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${getDisplayPercent()}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full relative"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-3">
                    {getLoadingMessage()}
                  </p>
                  {loadingStep === 0 && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                      حجم آپلود شده: {uploadProgress}% تکمیل شده
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto pt-2 leading-relaxed">
                  تحلیل و پردازش فایل‌های صوتی و ویدیویی بزرگتر ممکن است ۲ الی ۳ دقیقه طول بکشد. لطفاً این صفحه را نبندید.
                </p>
              </div>
            </motion.div>
          )}

          {/* Transcription Result Area */}
          {result && !transcribing && (
            <div id="transcript-result-section">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-bold">تکمیل شده</span>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">پیش‌نمایش متن استخراج شده</h3>
              </div>
              <TranscriptResult
                transcript={result.transcript}
                fileName={result.fileName}
                fileSize={result.fileSize}
                mimeType={result.mimeType}
                style={result.style}
                onSaveEdit={handleSaveEditedTranscript}
                duration={result.duration}
              />
            </div>
          )}

        </div>

        {/* Sidebar Panel (Right Column on large screens - occupies 4 cols) */}
        <div className="lg:col-span-4 space-y-6" id="sidebar-panel">
          
          {/* Settings / Configuration Card */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Settings className="w-4 h-4 text-slate-500" />
              <span>تنظیمات قالب خروجی</span>
            </h3>

            <div className="space-y-3">
              {/* Verbatim Choice */}
              <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl cursor-pointer transition-all">
                <input
                  type="radio"
                  name="style"
                  checked={style === "transcript"}
                  onChange={() => setStyle("transcript")}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">کلمه به کلمه (ساده)</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    پیاده‌سازی دقیق تمامی گفتارهای داخل فایل صوتی پشت سر هم بدون کوچک‌ترین دستکاری.
                  </div>
                </div>
              </label>

              {/* Segmented paragraphs choice */}
              <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl cursor-pointer transition-all">
                <input
                  type="radio"
                  name="style"
                  checked={style === "paragraphs"}
                  onChange={() => setStyle("paragraphs")}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">پاراگراف‌بندی ساختاریافته</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    تفکیک و تقسیم متن بر اساس جملات، مکث‌ها و تغییرات منطقی گوینده به پاراگراف‌های خوانا.
                  </div>
                </div>
              </label>

              {/* Meeting Summary choice */}
              <label className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl cursor-pointer transition-all">
                <input
                  type="radio"
                  name="style"
                  checked={style === "meeting"}
                  onChange={() => setStyle("meeting")}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">خلاصه جلسه و صورت‌جلسه</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    ایجاد یک هدر مشخص، بخش نکات کلیدی و تصمیمات جلسه، به همراه متن کامل پیاده‌سازی شده در انتها.
                  </div>
                </div>
              </label>
            </div>

            {/* Usage and Credit Statistics Table */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3" id="usage-stats-dashboard">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>گزارش مصرف و وضعیت اعتبار</span>
              </div>
              
              {/* Dynamic credit bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                  <span>میزان اعتبار باقی‌مانده</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{remainingCreditMinutes} دقیقه (از ۱۲۰ دقیقه)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${creditPercentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      creditPercentage > 40
                        ? "bg-emerald-500"
                        : creditPercentage > 15
                        ? "bg-amber-500"
                        : "bg-rose-500 animate-pulse"
                    }`}
                  />
                </div>
              </div>

              {/* Polished Grid Table */}
              <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-150 dark:border-slate-800 p-3 text-[11px] space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500">تعداد فایل‌های تبدیل شده</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{totalProcessedFiles} فایل</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-500">مجموع زمان مصرف شده</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {totalProcessedMinutes} دقیقه{totalProcessedSeconds % 60 > 0 ? ` و ${Math.round(totalProcessedSeconds % 60)} ثانیه` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">مجموع حجم پردازش شده</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {getFriendlySize(totalProcessedSizeBytes)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History tracker list */}
          <div className="w-full">
            <HistoryList
              records={history}
              onSelectRecord={handleSelectHistoryRecord}
              onDeleteRecord={handleDeleteHistoryRecord}
              onClearAll={handleClearAllHistory}
              activeId={result?.id}
            />
          </div>

          {/* FAQ Card */}
          <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>پاسخ به سوالات متداول</span>
            </h4>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2.5 leading-relaxed text-justify">
              <div>
                <strong>آیا لهجه‌های فارسی پشتیبانی می‌شود؟</strong>
                <p className="mt-0.5">بله، موتور هوش مصنوعی به زبان فارسی، لهجه‌های محلی ایرانی و اصطلاحات روزمره تسلط کامل دارد.</p>
              </div>
              <div>
                <strong>محدودیت حجم فایل چقدر است؟</strong>
                <p className="mt-0.5">شما می‌توانید فایل‌های صوتی و ویدیویی تا حجم ۵۰ مگابایت را بارگذاری کنید. برای بازدهی سریع‌تر و مصرف پهنای باند کمتر، پیشنهاد می‌شود از فایل‌های کم‌حجم‌تر استفاده کنید.</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
