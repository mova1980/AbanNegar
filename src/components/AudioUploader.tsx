import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Upload, FileAudio, FileVideo, Trash2, HelpCircle } from "lucide-react";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  onDurationChange?: (duration: number) => void;
}

export default function AudioUploader({
  onFileSelect,
  selectedFile,
  onClearFile,
  onDurationChange,
}: AudioUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewUrl = selectedFile ? URL.createObjectURL(selectedFile) : "";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("audio/") || file.type.startsWith("video/") || hasAudioExtension(file.name)) {
        onFileSelect(file);
      } else {
        alert("لطفاً فایل صوتی یا ویدیویی معتبر انتخاب کنید (مانند mp3, wav, m4a, mp4, flac, aac)");
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const hasAudioExtension = (fileName: string): boolean => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["mp3", "wav", "m4a", "flac", "ogg", "aac", "webm", "amr", "3gp", "mp4"].includes(ext || "");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 بایت";
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full" id="audio-uploader-root">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="audio/*,video/mp4,video/x-m4v,video/*"
        className="hidden"
        id="audio-file-input"
      />

      {!selectedFile ? (
        <motion.div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          whileHover={{ scale: 1.002, borderColor: "#2563eb" }}
          whileTap={{ scale: 0.998 }}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 transition-all duration-200 text-center cursor-pointer group ${
            isDragActive
              ? "border-blue-600 bg-blue-50/20 dark:bg-blue-950/20"
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
          id="uploader-drag-zone"
        >
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-xs flex items-center justify-center mb-4 border border-slate-150 dark:border-slate-700 group-hover:scale-105 transition-transform animate-none">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            فایل صوتی یا ویدیویی خود را اینجا بکشید و رها کنید
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            فرمتهای پشتیبانی شده: MP3, WAV, M4A, FLAC, OGG, AAC, MP4 (ویدیو)
          </p>
          <button 
            type="button"
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            انتخاب فایل از سیستم
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 shadow-xs"
          id="uploader-file-selected-card"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/40 dark:border-blue-900/20">
                {selectedFile.type.startsWith("video/") || selectedFile.name.toLowerCase().endsWith(".mp4") ? (
                  <FileVideo className="w-7 h-7" />
                ) : (
                  <FileAudio className="w-7 h-7" />
                )}
              </div>
              <div className="overflow-hidden flex-1 md:flex-initial">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs md:max-w-md text-right text-sm">
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                  <span>اندازه: {formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>فرمت: {selectedFile.name.split(".").pop()?.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClearFile}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors self-end md:self-center cursor-pointer"
              title="حذف فایل"
              id="clear-file-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>انتخاب فایل دیگر</span>
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850" id="audio-playback-section">
            {(() => {
              const isVideo = selectedFile.type.startsWith("video/") || selectedFile.name.toLowerCase().endsWith(".mp4");
              return (
                <>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 text-right">
                    {isVideo ? "پیش‌نمایش فایل ویدیویی انتخاب‌شده:" : "پیش‌شنوایی فایل صوتی انتخاب‌شده:"}
                  </p>
                  {isVideo ? (
                    <video
                      src={audioPreviewUrl}
                      controls
                      onLoadedMetadata={(e) => {
                        if (onDurationChange) {
                          onDurationChange(e.currentTarget.duration);
                        }
                      }}
                      className="w-full max-h-48 outline-none rounded-lg bg-slate-900/10 dark:bg-slate-900/80 shadow-xs"
                      id="selected-video-player"
                    />
                  ) : (
                    <audio
                      src={audioPreviewUrl}
                      controls
                      onLoadedMetadata={(e) => {
                        if (onDurationChange) {
                          onDurationChange(e.currentTarget.duration);
                        }
                      }}
                      className="w-full h-10 outline-none rounded-lg"
                      id="selected-audio-player"
                    />
                  )}
                </>
              );
            })()}
          </div>
        </motion.div>
      )}
    </div>
  );
}
