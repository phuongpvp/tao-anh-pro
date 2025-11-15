
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    // In a real app, you might want to handle this more gracefully.
    // For this context, we assume it's set.
    console.warn("API_KEY environment variable is not set. The app will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return { mimeType: match[1], data: match[2] };
};

export const generateBrandedImage = async (
    base64ImageDataUrl: string,
    userPrompt: string
): Promise<string> => {
    try {
        const { mimeType, data } = parseDataUrl(base64ImageDataUrl);
        
        const enhancedPrompt = `
        **Objective**: Transform the provided image into a professional branding photograph based on the user's request.
        **CRITICAL INSTRUCTION**: You MUST preserve the person's face from the original image with 100% accuracy. The facial features, expression, and identity must remain completely unchanged. Do not alter the face.
        **Style**: The final image must be ultra-realistic, photorealistic, 8K resolution, with professional studio lighting, and extremely high detail, suitable for a corporate website or LinkedIn profile.
        **User's Request**: "${userPrompt}"
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data, mimeType } },
                    { text: enhancedPrompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        throw new Error("No image was generated in the response.");

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        // Provide a more user-friendly error message
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("Invalid API Key. Please check your configuration.");
        }
        throw new Error("Failed to generate the image. The model may be unable to process this request. Please try a different image or prompt.");
    }
};
