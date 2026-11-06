import { Image } from 'react-native';
import { WardrobeItem, Moodboard } from '../types';

export interface StarterAssetDef {
  id: string;
  name: string;
  category: WardrobeItem['category'];
  asset: any;
  width: number;
  height: number;
}

export interface MannequinDef {
  id: 'dressform' | 'female' | 'male';
  name: string;
  description: string;
  asset: any;
  width: number;
  height: number;
}

export const MANNEQUIN_DEFS: MannequinDef[] = [
  {
    id: 'female',
    name: 'Damen-Silhouette',
    description: 'Elegante Ganzkörper-Modell-Silhouette',
    asset: require('../../assets/starter/female_mannequin.png'),
    width: 300,
    height: 600,
  },
  {
    id: 'dressform',
    name: 'Schneiderpuppe',
    description: 'Klassische Pariser Dressform auf Holzfuß',
    asset: require('../../assets/starter/dressform.png'),
    width: 300,
    height: 520,
  },
  {
    id: 'male',
    name: 'Herren-Silhouette',
    description: 'Minimalistische maskuline Modell-Silhouette',
    asset: require('../../assets/starter/male_mannequin.png'),
    width: 320,
    height: 620,
  },
];

export const STARTER_ASSET_DEFS: StarterAssetDef[] = [
  {
    id: 'starter_trenchcoat',
    name: 'Klassischer Trenchcoat',
    category: 'tops',
    asset: require('../../assets/starter/trenchcoat.png'),
    width: 320,
    height: 420,
  },
  {
    id: 'starter_blouse',
    name: 'Seidenbluse Off-White',
    category: 'tops',
    asset: require('../../assets/starter/silk_blouse.png'),
    width: 300,
    height: 360,
  },
  {
    id: 'starter_trousers',
    name: 'Wide-Leg Stoffhose',
    category: 'bottoms',
    asset: require('../../assets/starter/tailored_trousers.png'),
    width: 260,
    height: 420,
  },
  {
    id: 'starter_dress',
    name: 'Minimalistisches Slip-Dress',
    category: 'dresses',
    asset: require('../../assets/starter/slip_dress.png'),
    width: 260,
    height: 420,
  },
  {
    id: 'starter_loafers',
    name: 'Leder Loafer mit Spange',
    category: 'shoes',
    asset: require('../../assets/starter/leather_loafers.png'),
    width: 320,
    height: 220,
  },
  {
    id: 'starter_tote',
    name: 'Caramel Leder-Shopper',
    category: 'bags',
    asset: require('../../assets/starter/leather_tote.png'),
    width: 280,
    height: 340,
  },
  {
    id: 'starter_hoops',
    name: 'Grobe Gold-Creolen',
    category: 'accessories',
    asset: require('../../assets/starter/gold_hoops.png'),
    width: 240,
    height: 240,
  },
  {
    id: 'starter_sunglasses',
    name: 'Retro Acetat-Sonnenbrille',
    category: 'accessories',
    asset: require('../../assets/starter/sunglasses.png'),
    width: 320,
    height: 180,
  },
];

export const getInitialWardrobe = (): WardrobeItem[] => {
  return STARTER_ASSET_DEFS.map((def) => {
    const resolved = Image.resolveAssetSource(def.asset);
    return {
      id: def.id,
      name: def.name,
      category: def.category,
      uri: resolved?.uri || '',
      width: def.width,
      height: def.height,
      createdAt: Date.now(),
    };
  });
};

export const getInitialBoards = (wardrobe: WardrobeItem[]): Moodboard[] => {
  const trench = wardrobe.find((w) => w.id === 'starter_trenchcoat') || wardrobe[0];
  const blouse = wardrobe.find((w) => w.id === 'starter_blouse') || wardrobe[1];
  const trousers = wardrobe.find((w) => w.id === 'starter_trousers') || wardrobe[2];
  const loafers = wardrobe.find((w) => w.id === 'starter_loafers') || wardrobe[4];
  const tote = wardrobe.find((w) => w.id === 'starter_tote') || wardrobe[5];
  const sunglasses = wardrobe.find((w) => w.id === 'starter_sunglasses') || wardrobe[7];

  const autumnCapsule: Moodboard = {
    id: 'board_autumn_capsule',
    title: 'Herbst Capsule Chic',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now(),
    items: [
      {
        id: 'item_1',
        wardrobeItemId: trench.id,
        uri: trench.uri,
        x: 180,
        y: 280,
        width: trench.width * 0.72,
        height: trench.height * 0.72,
        scale: 1,
        rotation: -0.05,
        zIndex: 1,
      },
      {
        id: 'item_2',
        wardrobeItemId: blouse.id,
        uri: blouse.uri,
        x: 230,
        y: 260,
        width: blouse.width * 0.65,
        height: blouse.height * 0.65,
        scale: 1,
        rotation: 0.04,
        zIndex: 2,
      },
      {
        id: 'item_3',
        wardrobeItemId: trousers.id,
        uri: trousers.uri,
        x: 235,
        y: 470,
        width: trousers.width * 0.7,
        height: trousers.height * 0.7,
        scale: 1,
        rotation: 0.02,
        zIndex: 3,
      },
      {
        id: 'item_4',
        wardrobeItemId: loafers.id,
        uri: loafers.uri,
        x: 180,
        y: 630,
        width: loafers.width * 0.55,
        height: loafers.height * 0.55,
        scale: 1,
        rotation: -0.08,
        zIndex: 4,
      },
      {
        id: 'item_5',
        wardrobeItemId: tote.id,
        uri: tote.uri,
        x: 310,
        y: 380,
        width: tote.width * 0.62,
        height: tote.height * 0.62,
        scale: 1,
        rotation: 0.12,
        zIndex: 5,
      },
      {
        id: 'item_6',
        wardrobeItemId: sunglasses.id,
        uri: sunglasses.uri,
        x: 120,
        y: 160,
        width: sunglasses.width * 0.45,
        height: sunglasses.height * 0.45,
        scale: 1,
        rotation: -0.15,
        zIndex: 6,
      },
    ],
  };

  const weddingOutfit: Moodboard = {
    id: 'board_sommerhochzeit',
    title: 'Sommerhochzeit Elegant',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 12,
    items: [],
  };

  const casualBrunch: Moodboard = {
    id: 'board_casual_brunch',
    title: 'Casual Sunday',
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 36,
    items: [],
  };

  return [autumnCapsule, weddingOutfit, casualBrunch];
};
