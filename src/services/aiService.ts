import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { cropImageLocally, getImageDimensions } from './imageService';
import { CropRect, ItemCategory, ChatMessage } from '../types';

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
    throw new Error('Kein API-Key hinterlegt. Bitte trage deinen Gemini API-Key in den Einstellungen (Zahnrad oben) ein.');
  }

  const naturalDims = await getImageDimensions(sourceUri);

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
    throw new Error(`KI-Anfrage fehlgeschlagen (${response.status}): ${errorText}`);
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

/**
 * Interactive Multi-turn Fashion Stylist Chatbot
 */
export const aiChatWithStylist = async (
  messages: ChatMessage[],
  context: {
    boardTitle: string;
    boardItems: { name: string; category?: string }[];
    wardrobeItems: { name: string; category?: string }[];
    hasMannequin: boolean;
  }
): Promise<string> => {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Kein API-Key hinterlegt. Bitte trage deinen Gemini API-Key in den Einstellungen (Zahnrad oben) ein.');
  }

  const wardrobeSummary = context.wardrobeItems.length > 0
    ? context.wardrobeItems.map((i) => `- ${i.name} [${i.category || 'Kleidung'}]`).join('\n')
    : '(Kleiderschrank ist noch leer)';

  const boardSummary = context.boardItems.length > 0
    ? context.boardItems.map((i) => `- ${i.name} [${i.category || 'Kleidung'}]`).join('\n')
    : '(Arbeitsfläche ist noch leer)';

  const systemPrompt = `Du bist der persönliche High-Fashion-Stylist und Modeberater in der StyleBoard-App.
Deine Aufgabe ist es, der Nutzerin/dem Nutzer zu helfen, perfekte Outfits für jeden Anlass zu kreieren (z. B. Themenpartys wie 90er, 80er, Y2K, Sommerhochzeit, Business Casual, Festival, Date Night).

KONTEXT DES NUTZERS:
- Aktuelles Board: "${context.boardTitle}"
- Aktuell auf dem Board/Mannequin platzierte Teile:
${boardSummary}
- Alle im Kleiderschrank verfügbaren Teile:
${wardrobeSummary}
- Figur/Mannequin aktiv: ${context.hasMannequin ? 'Ja' : 'Nein'}

DEIN STIL:
- Warmherzig, inspirierend, stilsicher, wie eine persönliche Stylistin bei Vogue oder Net-a-Porter.
- Gib konkrete, umsetzbare Tipps (welche Farben, Schnitte, Texturen harmonieren und wie man die Teile trägt, z. B. French Tuck, Rollärmel).
- Beziehe dich direkt auf die Teile im Kleiderschrank des Nutzers und schlage auch passende Ergänzungen vor.
- Halte deine Antworten lebendig, übersichtlich (mit Aufzählungspunkten oder Emojis) und nicht zu langatmig. Antworte immer auf Deutsch.`;

  // Format messages for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `[SYSTEM-HINWEIS FÜR STYLIST]: ${systemPrompt}\n\n[NUTZER]: ${messages[0]?.text || 'Hallo'}`,
        },
      ],
    },
  ];

  for (let i = 1; i < messages.length; i++) {
    const msg = messages[i];
    contents.push({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stylist-Chat fehlgeschlagen (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error('Keine Antwort vom Stylisten erhalten.');
  }

  return reply;
};
