import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

const handleGeminiError = (error: any, defaultMessage: string): never => {
  console.error("Gemini API Error:", error);
  
  let errorString = "";
  if (error instanceof Error) {
    errorString = error.message;
  } else if (typeof error === 'object' && error !== null) {
    try {
      errorString = JSON.stringify(error);
    } catch (e) {
      errorString = String(error);
    }
  } else {
    errorString = String(error);
  }
  
  if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("exceeded your current quota")) {
    throw new Error("API Quota Exceeded: You have reached your Gemini API rate limit. Please check your Google Cloud billing details or try again later.");
  }
  
  if (errorString.includes("400") || errorString.includes("INVALID_ARGUMENT")) {
    throw new Error("Invalid Request: The file format might be unsupported or the prompt was rejected.");
  }

  throw new Error(defaultMessage);
};

export const generateAppLogo = async (): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: "A minimalist vector logo of a futuristic cyber robot named 'CyCo' surfing on a globe. The style is sci-fi, sleek. Colors: Rust Orange, Sand Gold, and Deep Black. White background for easy keying or transparency."
        }]
      }
    });
    return extractImageFromResponse(response);
  } catch (e) {
    console.error("Logo gen failed", e);
    return "";
  }
}

const getSafeMimeType = (mimeType: string): string => {
  const supported = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gp',
    'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    'application/pdf', 'text/plain', 'text/html', 'text/markdown', 'text/csv', 'text/xml', 'text/rtf'
  ];
  
  if (supported.includes(mimeType)) return mimeType;
  
  // Coercion logic for common types that might be passed with non-standard MIME strings
  if (mimeType.startsWith('image/')) return 'image/jpeg';
  if (mimeType.startsWith('video/')) return 'video/mp4';
  if (mimeType.startsWith('audio/')) return 'audio/mp3';
  if (mimeType.startsWith('text/')) return 'text/plain';
  
  return 'application/octet-stream';
};

export const generateTransformation = async (
  base64Data: string,
  mimeType: string,
  referenceImageBase64: string | null,
  stylePrompt: string,
  backgroundPrompt: string,
  userCustomPrompt: string
): Promise<string> => {
  const ai = getClient();
  
  const parts: any[] = [
    {
      inlineData: {
        data: base64Data,
        mimeType: getSafeMimeType(mimeType),
      },
    }
  ];

  let referenceInstruction = "";
  
  if (referenceImageBase64) {
    const cleanRef = referenceImageBase64.includes("base64,") 
      ? referenceImageBase64.split("base64,")[1] 
      : referenceImageBase64;
    parts.push({
      inlineData: {
        data: cleanRef,
        mimeType: 'image/jpeg', // We assume reference is an image for style transfer
      },
    });
    referenceInstruction = " REFERENCE IMAGE: The second image provided is a STYLE REFERENCE (Inspo). Blend the visual style, lighting, and composition of the second image with the subject of the first image.";
  }

  // Updated prompt to be generic for ANY subject (Person, Object, Pet, etc.)
  const fullPrompt = `Transform the first image into a high-quality professional image.
  SUBJECT PRESERVATION: Keep the core subject's (whether person, object, animal, or product) visual identity, key features, and geometry exactly the same. Only change the style, lighting, environment, and texture.
  ${referenceInstruction}
  STYLE PROTOCOL: ${stylePrompt}.
  ENVIRONMENT DATA: ${backgroundPrompt}.
  USER OVERRIDE: ${userCustomPrompt}.
  OUTPUT QUALITY: Ensure 4k resolution, sharp focus, cinematic lighting, and professional photography aesthetics.`;

  parts.push({ text: fullPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    handleGeminiError(error, "Failed to generate image. Please try again.");
  }
};

export const editImageWithPrompt = async (
  imageBase64: string,
  userPrompt: string
): Promise<string> => {
  const ai = getClient();
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Edit this image. Instruction: ${userPrompt}. Keep the core subject identity and composition unless specified otherwise. High quality output.`,
          },
        ],
      },
    });

    return extractImageFromResponse(response);
  } catch (error) {
    handleGeminiError(error, "Failed to edit image. Please try again.");
  }
};

// New Function: LLM Vision Analysis
export const analyzeImageContent = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getClient();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Multimodal Text model
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: getSafeMimeType(mimeType),
            },
          },
          {
            text: `Analyze this file. ${prompt}`,
          },
        ],
      },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    handleGeminiError(error, "Failed to analyze file.");
  }
};

const extractImageFromResponse = (response: any): string => {
  if (response.candidates && response.candidates.length > 0) {
    const content = response.candidates[0].content;
    if (content.parts) {
      for (const part of content.parts) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          return `data:image/png;base64,${base64String}`;
        }
      }
    }
  }
  throw new Error("No image generated in response");
};
