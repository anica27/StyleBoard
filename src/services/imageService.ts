import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';
import { CropRect } from '../types';

const WARDROBE_DIR = `${FileSystem.documentDirectory ?? ''}wardrobe/`;

/**
 * Ensures the local wardrobe directory exists on device.
 */
export const ensureDirectoryExists = async () => {
  if (!FileSystem.documentDirectory) return;
  const dirInfo = await FileSystem.getInfoAsync(WARDROBE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(WARDROBE_DIR, { intermediates: true });
  }
};

/**
 * Gets intrinsic dimensions of an image URI
 */
export const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve({ width: 300, height: 300 }) // fallback
    );
  });
};

/**
 * Persists an image to the local filesystem for 100% offline access.
 */
export const persistImageLocally = async (sourceUri: string): Promise<string> => {
  try {
    if (!FileSystem.documentDirectory) return sourceUri;
    await ensureDirectoryExists();

    const extension = sourceUri.split('.').pop()?.split('?')[0] || 'png';
    const filename = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const destinationUri = `${WARDROBE_DIR}${filename}`;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });

    return destinationUri;
  } catch (error) {
    console.warn('Failed to copy image to local file system, using source URI directly:', error);
    return sourceUri;
  }
};

/**
 * Pick an image from the user's photo gallery
 */
export const pickFromGallery = async (): Promise<{ uri: string; width: number; height: number } | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Berechtigung für Fotogalerie wurde nicht erteilt.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const localUri = await persistImageLocally(asset.uri);
  const dims = asset.width && asset.height
    ? { width: asset.width, height: asset.height }
    : await getImageDimensions(localUri);

  return {
    uri: localUri,
    width: dims.width,
    height: dims.height,
  };
};

/**
 * Take a photo with the device camera
 */
export const takePhoto = async (): Promise<{ uri: string; width: number; height: number } | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Berechtigung für Kamera wurde nicht erteilt.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const localUri = await persistImageLocally(asset.uri);
  const dims = asset.width && asset.height
    ? { width: asset.width, height: asset.height }
    : await getImageDimensions(localUri);

  return {
    uri: localUri,
    width: dims.width,
    height: dims.height,
  };
};

/**
 * Import directly from clipboard (e.g., copied screenshot from Safari/Pinterest/Instagram)
 */
export const importFromClipboard = async (): Promise<{ uri: string; width: number; height: number } | null> => {
  const hasImage = await Clipboard.hasImageAsync();
  if (!hasImage) {
    throw new Error('Kein Bild in der Zwischenablage gefunden. Kopiere zuerst einen Screenshot oder ein Bild.');
  }

  const clipboardImage = await Clipboard.getImageAsync({ format: 'png' });
  if (!clipboardImage || !clipboardImage.data) {
    throw new Error('Bild aus der Zwischenablage konnte nicht geladen werden.');
  }

  if (!FileSystem.documentDirectory) {
    const dataUri = `data:image/png;base64,${clipboardImage.data}`;
    const dims = await getImageDimensions(dataUri);
    return { uri: dataUri, width: dims.width, height: dims.height };
  }

  await ensureDirectoryExists();
  const filename = `clip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
  const fileUri = `${WARDROBE_DIR}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, clipboardImage.data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const dims = await getImageDimensions(fileUri);

  return {
    uri: fileUri,
    width: dims.width,
    height: dims.height,
  };
};

/**
 * Crops an image locally using expo-image-manipulator
 */
export const cropImageLocally = async (
  sourceUri: string,
  cropRect: CropRect
): Promise<{ uri: string; width: number; height: number }> => {
  // Ensure valid non-negative integer dimensions
  const sanitizedCrop: CropRect = {
    originX: Math.max(0, Math.round(cropRect.originX)),
    originY: Math.max(0, Math.round(cropRect.originY)),
    width: Math.max(10, Math.round(cropRect.width)),
    height: Math.max(10, Math.round(cropRect.height)),
  };

  const manipResult = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ crop: sanitizedCrop }],
    { compress: 0.95, format: ImageManipulator.SaveFormat.PNG }
  );

  const localUri = await persistImageLocally(manipResult.uri);

  return {
    uri: localUri,
    width: manipResult.width,
    height: manipResult.height,
  };
};
