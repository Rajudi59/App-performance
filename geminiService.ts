
import { GoogleGenAI, Type } from "@google/genai";
import { Exercise } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseWorkoutText(text: string): Promise<Partial<Exercise>[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transform this text into a JSON array of exercises: "${text}". 
                 Rules: 
                 - name: string
                 - sets: number (default 3)
                 - reps: string (like "12" or "10-12")
                 - restTime: number (in seconds, default 60)
                 - observation: string (extract any notes like 'slow' or 'drop set')`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.NUMBER },
              reps: { type: Type.STRING },
              restTime: { type: Type.NUMBER },
              observation: { type: Type.STRING },
            },
            required: ["name", "sets", "reps", "restTime"]
          }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error parsing workout text:", error);
    return [];
  }
}
