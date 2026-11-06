import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { cropImageLocally, getImageDimensions } from './imageService';
import { CropRect, ItemCategory } from '../types';

const STORAGE_KEY_GEMINI = '@styleboard_gemini_api_key_v1';

export const getGeminiApiKey = async (): Promise<string> => {
  try {
    const custom = await AsyncStorage.getItem(STORAGE_KEY_GEMINI);
    if (custom && custom.trim().length > 0) return custom.trim();

    if (
      process.env.EXPO_PUBLIC_GEMINI_API_KEY &&
      process.env.EXPO_PUBLIC_GEMINI_API_KEY.trim().length > 0
    ) {
      return process.env.EXPO_PUBLIC_GEMINI_API_KEY.trim();
    }

    return '';
  } catch {
    return '';
  }
};

export const setGeminiApiKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
  } catch (err) {
    console.error('Failed to save API key:', err);
  }
};

interface AICutoutResult {
  uri: string;
  width: number;
  height: number;
  detectedName?: string;
  detectedCategory?: ItemCategory;
  dominantColor?: string;
  stylingTip?: string;
}

/**
 * Uses Gemini Vision AI to detect and tightly isolate the clothing item,
 * removing webshop borders, price tags, text, and surrounding models.
 */
export const aiIsolateClothingItem = async (
  sourceUri: string
): Promise<AICutoutResult> => {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Kein API-Key gefunden. Bitte trage deinen Gemini API-Key in den Einstellungen ein.');
  }

  const naturalDims = await getImageDimensions(sourceUri);

  // Read image as base64 safely across all protocols (file://, http://, data:)
  let base64Data = '';
  if (sourceUri.startsWith('data:')) {
    base64Data = sourceUri.split(',')[1];
  } else if (sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    const res = await fetch(sourceUri);
    const blob = await res.blob();
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else {
    base64Data = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const prompt = `Analyze this fashion/clothing image. Detect the main piece of clothing.
Return ONLY valid JSON in this exact structure without markdown or backticks:
{
  "itemName": "Short descriptive name in German (e.g. Schwarzer Wollblazer)",
  "category": "tops" or "bottoms" or "dresses" or "shoes" or "bags" or "accessories",
  "box_2d": [ymin, xmin, ymax, xmax],
  "dominantColor": "e.g. Beige, Schwarz, etc.",
  "stylingTip": "Short styling tip in German"
}
Note: Coordinates in box_2d must be normalized from 0 to 1000 tightly around the clothing item itself, excluding backgrounds, prices, and borders.`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/png',
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KI-Anfrage fehlgeschlagen: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (err) {
    console.warn('Failed to parse Gemini JSON output:', rawText);
  }

  if (parsed && Array.isArray(parsed.box_2d) && parsed.box_2d.length === 4) {
    const [ymin, xmin, ymax, xmax] = parsed.box_2d;

    // Convert normalized 0-1000 to pixels
    const originX = Math.max(0, Math.round((xmin / 1000) * naturalDims.width));
    const originY = Math.max(0, Math.round((ymin / 1000) * naturalDims.height));
    const cropW = Math.max(20, Math.round(((xmax - xmin) / 1000) * naturalDims.width));
    const cropH = Math.max(20, Math.round(((ymax - ymin) / 1000) * naturalDims.height));

    const cropRect: CropRect = {
      originX,
      originY,
      width: Math.min(naturalDims.width - originX, cropW),
      height: Math.min(naturalDims.height - originY, cropH),
    };

    const cropped = await cropImageLocally(sourceUri, cropRect);

    return {
      uri: cropped.uri,
      width: cropped.width,
      height: cropped.height,
      detectedName: parsed.itemName,
      detectedCategory: parsed.category as ItemCategory,
      dominantColor: parsed.dominantColor,
      stylingTip: parsed.stylingTip,
    };
  }

  return {
    uri: sourceUri,
    width: naturalDims.width,
    height: naturalDims.height,
    detectedName: parsed?.itemName,
    detectedCategory: parsed?.category as ItemCategory,
    dominantColor: parsed?.dominantColor,
    stylingTip: parsed?.stylingTip,
  };
};

export interface AIStylistReview {
  vibe: string;
  score: number;
  review: string;
  strengths: string[];
  recommendations: string[];
}

/**
 * Uses Gemini AI to review an outfit composition on a mannequin / canvas
 */
export const aiReviewOutfitComposition = async (
  boardTitle: string,
  items: { name: string; category?: string }[],
  hasMannequin: boolean
): Promise<AIStylistReview> => {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Kein API-Key gefunden. Bitte trage deinen Gemini API-Key in den Einstellungen ein.');
  }

  const itemsList = items.map((i) => `- ${i.name} (${i.category || 'Kleidung'})`).join('\n');

  const prompt = `Du bist ein weltbekannter High-Fashion-Stylist und Mode-Redakteur (wie Vogue/ssense).
Analysiere folgendes Outfit auf dem Moodboard "${boardTitle}":
${itemsList}
Figur/Mannequin vorhanden: ${hasMannequin ? 'Ja (angekleidet)' : 'Nein'}

Antworte NUR mit einem validen JSON-Objekt ohne Markdown:
{
  "vibe": "Prägnanter Style-Titel (z.B. Effortless Parisian Chic, Modern Tailored Minimalism)",
  "score": 9,
  "review": "2-3 inspirierende, stilvolle Sätze zur Outfit-Komposition auf Deutsch.",
  "strengths": ["Stärke 1", "Stärke 2"],
  "recommendations": ["Konkrete Empfehlung 1 (z. B. Welche Schuhe/Tasche/Accessoire perfekt passen würde)", "Empfehlung 2"]
}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stylist-Anfrage fehlgeschlagen: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    return {
      vibe: 'Modern Minimalist Look',
      score: 9,
      review: 'Ein harmonisch zusammengestelltes Outfit mit zeitloser Eleganz.',
      strengths: ['Harmonische Farbpalette', 'Vielseitig kombinierbar'],
      recommendations: ['Ergänze zarten Goldschmuck für ein edles Finish'],
    };
  }
};
