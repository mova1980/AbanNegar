import React, { useState } from "react";
import { motion } from "motion/react";
import { History, FileAudio, Trash2, Calendar, ChevronLeft, Search, X } from "lucide-react";
import { TranscriptionRecord } from "../types";

interface HistoryListProps {
  records: TranscriptionRecord[];
  onSelectRecord: (record: TranscriptionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  activeId?: string;
}

export default function HistoryList({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  activeId,
}: HistoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const getFriendlySize = (bytes: number): string => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStyleBadge = (style: string) => {
    switch (style) {
      case "transcript":
        return (
          <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
            کلمه به کلمه
          </span>
        );
      case "paragraphs":
        return (
          <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40">
            پاراگراف‌بندی
          </span>
        );
      case "meeting":
        return (
          <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
            خلاصه و صورت‌جلسه
          </span>
        );
      default:
        return null;
    }
  };

  const filteredRecords = records.filter((record) =>
    record.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-4" dir="rtl" id="history-list-root">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            تاریخچه تبدیل‌های اخیر
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-medium">
            {records.length}
          </span>
        </div>

        {records.length > 0 && (
          <button
            onClick={() => {
              if (confirm("آیا از پاک کردن کامل تاریخچه اطمینان دارید؟")) {
                onClearAll();
              }
            }}
            className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            id="clear-all-history-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>پاکسازی همه</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {records.length > 0 && (
        <div className="relative" id="history-search-container">
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در بین فایل‌های صوتی..."
            className="w-full pl-9 pr-9 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100 font-sans text-xs transition-all text-right"
            id="history-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5 text-center">
          <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            هنوز هیچ صوتی تبدیل به متن نشده است.
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/10 dark:bg-slate-900/5 text-center">
          <Search className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2 stroke-1" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            فایلی با کلمه مورد نظر در تاریخچه یافت نشد.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2" id="history-grid">
          {filteredRecords.map((record) => {
            const isActive = record.id === activeId;
            return (
              <motion.div
                key={record.id}
                whileHover={{ scale: 1.002 }}
                onClick={() => onSelectRecord(record)}
                className={`flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer text-right group ${
                  isActive
                    ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
                    : "border-slate-200/60 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50/30"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 overflow-hidden">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    isActive 
                      ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate pr-0.5">
                      {record.fileName}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        <span>{record.date.split("،")[0]}</span>
                      </div>
                      <span>•</span>
                      <span>{getFriendlySize(record.fileSize)}</span>
                      {record.duration && (
                        <>
                          <span>•</span>
                          <span>{(() => {
                            const h = Math.floor(record.duration / 3600);
                            const m = Math.floor((record.duration % 3600) / 60);
                            const s = Math.round(record.duration % 60);
                            if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                            return `${m}:${s.toString().padStart(2, '0')}`;
                          })()}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{record.wordCount} واژه</span>
                      <span>•</span>
                      {getStyleBadge(record.style)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mr-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(record.id);
                    }}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                    title="حذف از تاریخچه"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
