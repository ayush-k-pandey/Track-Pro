
import { GoogleGenAI, Type } from "@google/genai";
import { ProductivityInsights } from '../types';

// Initialize AI inside the function to ensure the latest API key is used as per guidelines
export const getProductivityInsights = async (statsDescription: string): Promise<ProductivityInsights | null> => {
  // Use the mandatory initialization format with direct process.env.API_KEY access
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these daily productivity statistics: "${statsDescription}", provide a short, motivating 2-sentence summary and 2 actionable tips for better focus tomorrow. Format as JSON: { "summary": "...", "tips": ["...", "..."] }`,
      config: {
        responseMimeType: "application/json",
        // Using responseSchema is the recommended way to ensure structured JSON output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A motivating summary of the performance.",
            },
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Actionable tips for improvement.",
            },
          },
          required: ["summary", "tips"],
          propertyOrdering: ["summary", "tips"],
        },
      },
    });
    // Correctly access text as a property, not a method
    const text = response.text;
    if (!text) return null;
    // Safely parse JSON and cast to ProductivityInsights
    return JSON.parse(text) as ProductivityInsights;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};
