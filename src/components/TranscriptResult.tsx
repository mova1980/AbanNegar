import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Edit3,
  BookOpen,
  Share2,
  Calendar,
  Layers,
  FileCode2,
} from "lucide-react";
import { exportToDocx, exportToTxt, triggerPrintPDF } from "../utils/exporters";

interface TranscriptResultProps {
  transcript: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  style: "transcript" | "paragraphs" | "meeting";
  onSaveEdit?: (newText: string) => void;
  duration?: number;
}

export default function TranscriptResult({
  transcript,
  fileName,
  fileSize,
  mimeType,
  style,
  onSaveEdit,
  duration,
}: TranscriptResultProps) {
  const [editableText, setEditableText] = useState(transcript);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Sync state if initial transcript changes
  useEffect(() => {
    setEditableText(transcript);
    setAutoSaveStatus("idle");
  }, [transcript]);

  // Track edits and trigger auto-save status feedback
  useEffect(() => {
    if (editableText === transcript) return;

    setAutoSaveStatus("saving");
    const timer = setTimeout(() => {
      setAutoSaveStatus("saved");
    }, 1000);

    return () => clearTimeout(timer);
  }, [editableText, transcript]);

  // Recalculate statistics
  useEffect(() => {
    const textToAnalyze = editableText || "";
    setCharCount(textToAnalyze.length);
    
    // Persian-specific word splitting (handling spaces, zero-width spaces / نیم‌فاصله)
    const cleanText = textToAnalyze.trim().replace(/\s+/g, " ");
    const words = cleanText ? cleanText.split(" ") : [];
    setWordCount(words.length);
  }, [editableText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const formatStyleName = (styleKey: string): string => {
    switch (styleKey) {
      case "transcript":
        return "ساده کلمه به کلمه";
      case "paragraphs":
        return "پاراگراف‌بندی شده";
      case "meeting":
        return "صورت‌جلسه و خلاصه جلسه";
      default:
        return styleKey;
    }
  };

  const getTodayDateString = (): string => {
    return new Date().toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFriendlySize = (bytes: number): string => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDurationPersian = (seconds?: number): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds === 0) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    
    if (h > 0) {
      return `${h} ساعت${m > 0 ? ` و ${m} دقیقه` : ""}`;
    } else if (m > 0) {
      return `${m} دقیقه${s > 0 ? ` و ${s} ثانیه` : ""}`;
    } else {
      return `${s} ثانیه`;
    }
  };

  const handleDocxExport = () => {
    exportToDocx(editableText, fileName, {
      size: getFriendlySize(fileSize),
      date: getTodayDateString(),
      duration: formatDurationPersian(duration),
    });
  };

  const handlePdfExport = () => {
    triggerPrintPDF(editableText, fileName, {
      size: getFriendlySize(fileSize),
      date: getTodayDateString(),
      duration: formatDurationPersian(duration),
    });
  };

  const handleTxtExport = () => {
    exportToTxt(editableText, fileName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
      dir="rtl"
      id="transcript-result-root"
    >
      {/* Exporter and Control bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">شیوه خروجی هوشمند:</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {formatStyleName(style)}
            </div>
          </div>
        </div>

        {/* Action Buttons for download */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Word export button (Primary Action) */}
          <button
            onClick={handleDocxExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
            id="export-docx-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود فایل ورد (Word)</span>
          </button>

          {/* PDF export button */}
          <button
            onClick={handlePdfExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
            id="export-pdf-btn"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>خروجی PDF / پرینت</span>
          </button>

          {/* TXT export button */}
          <button
            onClick={handleTxtExport}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
            id="export-txt-btn"
            title="دانلود فایل متنی ساده"
          >
            <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
            <span>فایل TXT</span>
          </button>
        </div>
      </div>

      {/* Main transcription area */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
        {/* Editor tabs & actions */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                if (onSaveEdit) onSaveEdit(editableText);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isEditing
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              id="view-mode-tab"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>نمایش نهایی</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isEditing
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              id="edit-mode-tab"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش دستی متن</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {autoSaveStatus === "saving" && (
              <span className="flex items-center gap-1.5 px-2 py-1 border border-amber-200/50 bg-amber-50/80 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-medium animate-pulse">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                <span>در حال ذخیره خودکار...</span>
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1 px-2 py-1 border border-emerald-200/50 bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-medium animate-fade-in">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>تغییرات ذخیره شد</span>
              </span>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="کپی کردن متن"
              id="copy-text-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی متن</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Text viewing or editing workspace */}
        <div className="p-6">
          {isEditing ? (
            <div className="relative">
              <textarea
                value={editableText}
                onChange={(e) => {
                  setEditableText(e.target.value);
                  if (onSaveEdit) onSaveEdit(e.target.value);
                }}
                className="w-full min-h-[300px] max-h-[600px] p-4 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 font-sans text-sm leading-relaxed text-right resize-y bg-slate-50/30 dark:bg-slate-900/20"
                placeholder="متن پیاده‌سازی شده در این بخش قابل ویرایش است..."
                dir="rtl"
                id="manual-text-editor"
              />
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-right">
                تغییرات شما در تمام خروجی‌های دانلودی (ورد و پی‌دی‌اف) بلافاصله اعمال خواهد شد.
              </div>
            </div>
          ) : (
            <div
              className="w-full min-h-[300px] text-right font-sans text-sm leading-relaxed text-slate-850 dark:text-slate-100 whitespace-pre-line overflow-y-auto"
              dir="rtl"
              id="rendered-text-viewer"
            >
              {editableText ? (
                // A beautiful presentation of headers if markdown is outputted in meeting mode
                editableText.split("\n").map((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith("# ")) {
                    return (
                      <h1 key={idx} className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                        {trimmed.replace(/^#\s+/, "")}
                      </h1>
                    );
                  }
                  if (trimmed.startsWith("## ")) {
                    return (
                      <h2 key={idx} className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2">
                        {trimmed.replace(/^##\s+/, "")}
                      </h2>
                    );
                  }
                  if (trimmed.startsWith("### ")) {
                    return (
                      <h3 key={idx} className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2">
                        {trimmed.replace(/^###\s+/, "")}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                    return (
                      <div key={idx} className="flex items-start gap-2 mr-4 my-1">
                        <span className="text-blue-600 font-bold">•</span>
                        <p className="flex-1">{trimmed.replace(/^[-\*]\s+/, "")}</p>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className={trimmed.length === 0 ? "h-4" : "mb-3"}>
                      {trimmed}
                    </p>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <FileText className="w-12 h-12 mb-3 stroke-1" />
                  <span>متن پیاده‌سازی شده خالی است.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info: stats bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span>تعداد واژه‌ها: <strong className="text-slate-700 dark:text-slate-200">{wordCount}</strong></span>
            <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <span>تعداد کاراکترها: <strong className="text-slate-700 dark:text-slate-200">{charCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>امروز: {getTodayDateString().split("،")[0]}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
