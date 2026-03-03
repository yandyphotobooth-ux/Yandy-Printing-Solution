import { GoogleGenAI } from "@google/genai";

export const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export const MODELS = {
  IMAGE: "gemini-2.5-flash-image",
  TEXT: "gemini-3-flash-preview",
};
