
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiAI = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const searchBookInfo = async (query: string) => {
  const ai = getGeminiAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find detailed information for the book: "${query}". Provide title, author, category, a short summary, and an estimated page count.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          author: { type: Type.STRING },
          category: { type: Type.STRING },
          summary: { type: Type.STRING },
          totalPage: { type: Type.NUMBER }
        },
        required: ["title", "author", "category", "summary"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getBookRecommendation = async (favoriteGenres: string[], recentBooks: string[]) => {
  const ai = getGeminiAI();
  const prompt = `Based on my favorite genres [${favoriteGenres.join(', ')}] and recently read books [${recentBooks.join(', ')}], recommend 3 unique books I might enjoy. Include the title, author, and a reason why I'd like it.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const analyzeReadingNote = async (note: string, bookTitle: string) => {
  const ai = getGeminiAI();
  const prompt = `I wrote this note while reading "${bookTitle}": "${note}". Give me a thoughtful perspective or a question to think about based on this note. Keep it brief.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });
  return response.text;
};
