
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Feedback } from "../types";

export const evaluateSubmission = async (question: Question, studentAnswer: string): Promise<Feedback> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY in .env.local");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || "" });
  
  const systemPrompt = `
    You are an AI teaching assistant for a Linguistics course. 
    Your task is to evaluate a student's short answer based on specific guidance.
    
    Question: ${question.text}
    Points Available: ${question.points}
    Grading Guidance: ${question.guidance}
    
    In addition to grading, you MUST provide a "Socratic Question". 
    - If the student is correct (reinforcement), provide a deep-thinking question to extend their understanding.
    - If the student is missing points (clarification), provide a question that prompts them to think about the missing concept without giving the answer directly.
    
    Categorize status as 'reinforcement' if they hit the core requirements, or 'clarification' if they need more work.
    Assign a score out of ${question.points}.
    
    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Evaluate this student answer: "${studentAnswer}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.NUMBER,
              description: "Numeric score for the answer based on points available."
            },
            status: { 
              type: Type.STRING,
              description: "Either 'reinforcement' for good answers or 'clarification' for answers needing help."
            },
            aiNotes: { 
              type: Type.STRING,
              description: "A very short one-sentence observation of the student's specific answer."
            },
            socraticQuestion: {
              type: Type.STRING,
              description: "A question to prompt further thinking or guide them to the right answer."
            }
          },
          required: ["score", "status", "aiNotes", "socraticQuestion"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      score: result.score || 0,
      status: result.status === 'reinforcement' ? 'reinforcement' : 'clarification',
      aiNotes: result.aiNotes || "",
      socraticQuestion: result.socraticQuestion || ""
    };
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    return {
      score: 0,
      status: 'clarification',
      aiNotes: "Unable to evaluate at this moment.",
      socraticQuestion: "What do you think is the core connection between the language structure and the behavior mentioned in the reading?"
    };
  }
};
