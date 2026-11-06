export type ItemCategory =
  | 'all'
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'shoes'
  | 'bags'
  | 'accessories';

export interface CategoryInfo {
  id: ItemCategory;
  label: string;
  iconName: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'all', label: 'Alle', iconName: 'LayoutGrid' },
  { id: 'tops', label: 'Oberteile', iconName: 'Shirt' },
  { id: 'bottoms', label: 'Hosen & Röcke', iconName: 'Scissors' },
  { id: 'dresses', label: 'Kleider', iconName: 'Sparkles' },
  { id: 'shoes', label: 'Schuhe', iconName: 'Footprints' },
  { id: 'bags', label: 'Taschen', iconName: 'ShoppingBag' },
  { id: 'accessories', label: 'Accessoires', iconName: 'Glasses' },
];

export interface WardrobeItem {
  id: string;
  uri: string; // local file path or data URI
  name: string;
  category: ItemCategory;
  width: number;
  height: number;
  createdAt: number;
}

export interface CanvasItem {
  id: string;
  wardrobeItemId?: string;
  uri: string;
  originalUri?: string; // stored for recropping if needed
  x: number; // canvas center X
  y: number; // canvas center Y
  width: number;
  height: number;
  scale: number;
  rotation: number; // in radians
  zIndex: number;
  flippedX?: boolean;
  isMannequin?: boolean;
  mannequinType?: 'dressform' | 'female' | 'male' | 'custom';
}

export interface Moodboard {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  items: CanvasItem[];
  backgroundColor?: string;
  thumbnailUri?: string;
}

export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}
