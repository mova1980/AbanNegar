import express from "express";
import path from "path";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { spawn } from "child_process";

dotenv.config();

// Helper function to extract and convert audio/video streams to clean MP3 format using ffmpeg
function convertToMp3(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", "pipe:0",           // Read from stdin
      "-f", "mp3",              // Force MP3 container
      "-acodec", "libmp3lame",   // Use high quality LAME MP3 encoder
      "-ab", "128k",            // 128kbps is perfect for clear voice transcription
      "-ar", "44100",           // Standard CD sampling rate
      "-ac", "1",               // Mono track is lightweight and optimal for transcription
      "pipe:1"                  // Output to stdout
    ]);

    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    ffmpeg.stdout.on("data", (chunk) => {
      chunks.push(chunk);
    });

    ffmpeg.stderr.on("data", (chunk) => {
      errorChunks.push(chunk);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks));
      } else {
        const errorMsg = Buffer.concat(errorChunks).toString();
        reject(new Error(`FFmpeg failed with code ${code}: ${errorMsg}`));
      }
    });

    ffmpeg.on("error", (err) => {
      console.error("FFmpeg process spawn error:", err);
      reject(err);
    });

    ffmpeg.stdin.on("error", (err) => {
      console.error("FFmpeg stdin error:", err);
    });

    // Write input buffer to FFmpeg stdin and close input channel
    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configure body-parser limit for large payloads (like base64 or files)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Multer configuration for memory storage (safe, fast, doesn't pollute server files)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
  },
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
}

// API endpoint for Audio Transcription
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "کلید API مربوط به جمینای تنظیم نشده است. لطفاً آن را در بخش Secrets تنظیم کنید.",
      });
    }

    if (!ai) {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "هیچ فایل صوتی ارسال نشده است." });
    }

    const style = req.body.style || "transcript"; // transcript, paragraphs, meeting
    
    // Determine the MIME type of the upload and standardize audio formats
    const ext = path.extname(file.originalname).toLowerCase();
    let mimeType = file.mimetype;
    
    // Normalize MIME types based on file extension
    if (ext === ".mp3") {
      mimeType = "audio/mp3";
    } else if (ext === ".wav") {
      mimeType = "audio/wav";
    } else if (ext === ".m4a") {
      mimeType = "audio/x-m4a"; // Direct routing to audio pipeline instead of audio/mp4 (video)
    } else if (ext === ".aac") {
      mimeType = "audio/aac";
    } else if (ext === ".flac") {
      mimeType = "audio/flac";
    } else if (ext === ".ogg") {
      mimeType = "audio/ogg";
    } else if (ext === ".webm") {
      mimeType = "audio/webm";
    } else if (ext === ".amr") {
      mimeType = "audio/amr";
    } else if (ext === ".mp4") {
      mimeType = "video/mp4";
    } else if (mimeType === "video/mp4" || mimeType === "video/quicktime" || mimeType === "video/x-m4v") {
      mimeType = "video/mp4";
    } else if (mimeType === "audio/mp4") {
      mimeType = "audio/x-m4a"; // Audio-only MP4
    } else if (mimeType === "application/octet-stream" || !mimeType) {
      mimeType = "audio/mp3"; // Default audio fallback
    }

    let audioBuffer = file.buffer;
    let finalMimeType = mimeType;
    let isVideoOrMp4 = false;

    // Detect if we should proactively extract audio track to MP3 to prevent frame/container errors
    if (
      ext === ".mp4" || 
      ext === ".m4v" || 
      ext === ".mov" || 
      ext === ".webm" || 
      ext === ".3gp" || 
      ext === ".avi" ||
      mimeType.startsWith("video/") || 
      mimeType === "audio/mp4" ||
      mimeType === "audio/x-m4a" ||
      ext === ".m4a"
    ) {
      isVideoOrMp4 = true;
    }

    if (isVideoOrMp4) {
      console.log(`Proactively extracting and converting audio track of "${file.originalname}" to clean MP3 format using FFmpeg...`);
      try {
        const mp3Buffer = await convertToMp3(file.buffer);
        audioBuffer = mp3Buffer;
        finalMimeType = "audio/mp3";
        console.log(`Successfully extracted and converted audio track to MP3 (${mp3Buffer.length} bytes).`);
      } catch (err: any) {
        console.warn("FFmpeg proactive extraction failed, attempting to proceed with original stream:", err.message || err);
      }
    }

    const base64Data = audioBuffer.toString("base64");

    // Build the system and prompt instructions based on selected style
    let promptText = "";
    if (style === "transcript") {
      promptText = `تو یک متخصص حرفه‌ای و دقیق پیاده‌سازی صوت به متن زبان فارسی هستی. 
لطفاً این فایل صوتی را به صورت بسیار دقیق، کلمه به کلمه و کامل به زبان فارسی بنویس (Transcribe).
قوانین بسیار مهم:
۱. تمام جملات و کلماتی که گفته می‌شود را دقیقاً همان‌طور که تلفظ شده و شنیده می‌شود بنویس.
۲. از ترجمه خودداری کن. زبان خروجی باید کاملاً فارسی باشد.
۳. اصول نگارشی و علائم سجاوندی (نقطه، ویرگول و...) را رعایت کن تا متن نهایی بسیار خوانا باشد.
۴. هیچ توضیح حاشیه‌ای، سلام، احوالپرسی یا پیام شروع و پایانی در ابتدا یا انتهای خروجی اضافه نکن. فقط و فقط متن پیاده‌سازی شده صوت را برگردان.
۵. اگر بخش‌هایی از صوت ناواضح یا نامفهوم است، آن را نادیده نگیر بلکه به صورت منطقی بنویس یا در صورت عدم امکان تشخیص کلمه، از علامت [نامفهوم] استفاده کن.`;
    } else if (style === "paragraphs") {
      promptText = `تو یک متخصص حرفه‌ای و دقیق پیاده‌سازی صوت به متن زبان فارسی هستی. 
لطفاً این فایل صوتی را به زبان فارسی پیاده‌سازی (Transcribe) کرده و آن را بر اساس موضوع یا جریان صحبت به پاراگراف‌های منطقی، خوانا و منظم تقسیم‌بندی کنی.
قوانین بسیار مهم:
۱. با تغییر موضوع، تغییر گوینده یا مکث‌های طولانی، حتماً پاراگراف جدیدی را شروع کن تا متن ساختاریافته و شیک باشد.
۲. تمام جزئیات گفتار را حفظ کن و از خلاصه‌سازی یا حذف متن خودداری کن. خروجی باید کامل باشد.
۳. اصول نگارشی و علائم سجاوندی را کاملاً رعایت کن.
۴. هیچ توضیح حاشیه‌ای، پیام سلام یا تبریک یا جمع‌بندی از خودت در ابتدا یا انتهای خروجی اضافه نکن. فقط متن پیاده‌سازی شده تقسیم‌شده به پاراگراف‌ها را برگردان.`;
    } else if (style === "meeting") {
      promptText = `تو یک منشی جلسه و متخصص حرفه‌ای پیاده‌سازی و خلاصه کردن صوت به زبان فارسی هستی.
لطفاً این فایل صوتی را به صورت بسیار دقیق پیاده‌سازی (Transcribe) کرده و ساختار زیر را برای خروجی نهایی ایجاد کنی:

# صورت‌جلسه و پیاده‌سازی هوشمند صوت

## ۱. اطلاعات کلی و موضوع اصلی
[یک خلاصه کوتاه تک‌خطی از موضوع کلی این گفتگو یا جلسه صوتی]

## ۲. خلاصه نکات کلیدی و تصمیمات گرفته شده
[نکات کلیدی و تصمیمات مهم مطرح شده در فایل صوتی را به صورت بالت‌پوینت‌های منظم و خوانا لیست کن]

## ۳. متن کامل پیاده‌سازی شده (کلمه به کلمه)
[پاراگراف‌بندی دقیق و کلمه به کلمه کل فایل صوتی]

قوانین بسیار مهم:
۱. خروجی نهایی باید کاملاً به زبان فارسی باشد.
۲. هیچ مقدمه یا موخره‌ای از زبان خودت (مانند "بله، در ادامه قرار می‌دهم" یا "امیدوارم مفید باشد") ننویس. فقط بخش‌های ساختار یافته بالا را به ترتیب ارائه بده.
۳. اصول نگارشی، علائم سجاوندی و فاصله نیم‌فاصله‌ها را رعایت کن.`;
    }

    let transcript = "";
    
    try {
      console.log(`Sending audio file "${file.originalname}" (${audioBuffer.length} bytes, type ${finalMimeType}) to Gemini API with style "${style}"...`);
      const audioPart = {
        inlineData: {
          mimeType: finalMimeType,
          data: base64Data,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [audioPart, promptText],
      });
      
      transcript = response.text || "";
    } catch (apiError: any) {
      console.warn("First transcription attempt failed, checking for fallbacks...", apiError);
      
      // If the error seems related to format, decoding, or video frames
      const errorMessage = apiError.message || String(apiError);
      const isFormatOrFrameError = errorMessage.includes("0 Frames found") || 
                                   errorMessage.includes("video") || 
                                   errorMessage.includes("corrupted") || 
                                   errorMessage.includes("metadata") ||
                                   errorMessage.includes("INVALID_ARGUMENT") ||
                                   errorMessage.includes("format");
                                   
      if (isFormatOrFrameError) {
        console.log("Format or frame error detected. Attempting emergency conversion of the original file to a clean MP3 stream using FFmpeg...");
        let success = false;
        
        // Strategy 1: Emergency transcode to clean MP3 (highly reliable)
        try {
          const fallbackMp3Buffer = await convertToMp3(file.buffer);
          const fallbackBase64 = fallbackMp3Buffer.toString("base64");
          
          console.log("Retrying transcription with emergency transcoded MP3 stream...");
          const fallbackAudioPart = {
            inlineData: {
              mimeType: "audio/mp3",
              data: fallbackBase64,
            },
          };
          
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [fallbackAudioPart, promptText],
          });
          
          if (response.text) {
            transcript = response.text;
            finalMimeType = "audio/mp3";
            success = true;
            console.log("Successfully transcribed using emergency transcoded MP3 stream!");
          }
        } catch (fallbackError: any) {
          console.error("Emergency fallback MP3 conversion or transcription failed:", fallbackError);
        }
        
        // Strategy 2: If FFmpeg transcoder failed, try standard MIME-type fallbacks as a secondary backup
        if (!success) {
          const fallbacks = ["video/mp4", "audio/x-m4a", "audio/m4a", "audio/aac", "audio/mp3", "audio/wav", "audio/mp4"];
          // Filter out the one we already tried to avoid repeating
          const activeFallbacks = fallbacks.filter(f => f !== mimeType);
          
          for (const fallbackMime of activeFallbacks) {
            try {
              console.log(`Retrying transcription with fallback MIME type: ${fallbackMime}...`);
              const fallbackAudioPart = {
                inlineData: {
                  mimeType: fallbackMime,
                  data: base64Data,
                },
              };
              
              const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: [fallbackAudioPart, promptText],
              });
              
              if (response.text) {
                transcript = response.text;
                finalMimeType = fallbackMime;
                success = true;
                console.log(`Successfully transcribed using fallback MIME type: ${fallbackMime}`);
                break;
              }
            } catch (retryError) {
              console.warn(`Retry with ${fallbackMime} failed:`, retryError);
            }
          }
        }
        
        if (!success) {
          throw apiError; // If all emergency options failed, throw the original error
        }
      } else {
        throw apiError; // Throw original error if not format/frame related
      }
    }

    if (!transcript) {
      throw new Error("پاسخی از مدل جمینای دریافت نشد.");
    }

    return res.json({
      success: true,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: finalMimeType,
      transcript: transcript,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return res.status(500).json({
      error: "خطا در فرآیند تبدیل صوت به متن: " + (error.message || error),
    });
  }
});

// Add a simple health check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Global error handling middleware (e.g., for Multer size limits or routing crashes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Express Error Handler caught:", err);
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "حجم فایل ارسال شده بیش از حد مجاز (۵۰ مگابایت) است. لطفاً فایلی با حجم کمتر آپلود کنید.",
      });
    }
    return res.status(400).json({
      error: `خطای بارگذاری فایل: ${err.message}`,
    });
  }
  return res.status(err.status || 500).json({
    error: err.message || "خطای نامشخص در سرور رخ داده است.",
  });
});

// Configure Vite or production static server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Dev Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});
