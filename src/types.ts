export interface TranscriptionRecord {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  date: string;
  transcript: string;
  style: "transcript" | "paragraphs" | "meeting";
  wordCount: number;
  charCount: number;
  duration?: number;
}

export type TranscribeStyle = "transcript" | "paragraphs" | "meeting";

export interface TranscribeResponse {
  success: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  transcript: string;
}
