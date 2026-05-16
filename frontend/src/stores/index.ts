export interface BodyTemplate {
  id: string; name: string; gender: string; bodyType: string; displayName: string; thumbnailUrl: string;
}
export interface MotionPreset { id: string; name: string; displayName: string; category: string; durationSec: number; spriteKey: string; isLoop: boolean; }
export interface BackgroundTemplate { id: string; name: string; category: string; style: string; prompt: string; imageUrl: string; }
export interface SceneLayer {
  id: string; type: 'character' | 'background'; refId: string; x: number; y: number; scale: number; zIndex: number;
  motionPresetId?: string; dialogText?: string;
  pathData?: string;
  visible?: boolean;
}
export interface Camera {
  panX: number; panY: number; zoom: number; rotation: number;
}
export interface Scene {
  id: string; projectId: string; sceneNumber: number; setting: string; description: string | null;
  mood: string; durationSec: number; backgroundUrl: string | null; layers: SceneLayer[];
  voiceUrl: string | null; dialogText: string | null; voiceStyle: string | null;
  camera?: Camera | null;
}
export interface Character {
  id: string; projectId: string | null; name: string; description: string | null;
  faceImageUrl: string | null; fullBodyUrl: string | null;
  bodyTemplateId: string; customColors: Record<string, string>;
  spriteSet: Record<string, string> | null;
}
export interface Project {
  id: string; title: string; description: string | null; scriptText: string | null;
  genre: string; status: string; totalScenes: number; durationSec: number;
  characters: Character[]; scenes: Scene[]; exportUrl: string | null; watermark: boolean;
  createdAt: string;
}

export const bodyTemplates: BodyTemplate[] = [
  { id: 't1', name: 'slim_male', gender: 'male', bodyType: 'slim', displayName: 'Slim Male', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=slim-male&clothing=blazerAndShirt' },
  { id: 't2', name: 'average_male', gender: 'male', bodyType: 'average', displayName: 'Average Male', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avg-male&clothing=shirtCrewNeck' },
  { id: 't3', name: 'fat_male', gender: 'male', bodyType: 'fat', displayName: 'Heavyset Male', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fat-male' },
  { id: 't4', name: 'slim_female', gender: 'female', bodyType: 'slim', displayName: 'Slim Female', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=slim-female&top=longHair' },
  { id: 't5', name: 'average_female', gender: 'female', bodyType: 'average', displayName: 'Average Female', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avg-female&top=longHair' },
  { id: 't6', name: 'child', gender: 'neutral', bodyType: 'child', displayName: 'Child', thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=child' },
];

export const motionPresets: MotionPreset[] = [
  { id: 'm_idle', name: 'idle', displayName: 'Idle Standing', category: 'body', durationSec: 2, spriteKey: 'idle', isLoop: false },
  { id: 'm_walk', name: 'walk', displayName: 'Walking', category: 'body', durationSec: 2, spriteKey: 'walk_1', isLoop: true },
  { id: 'm_sit', name: 'sit', displayName: 'Sitting', category: 'body', durationSec: 2, spriteKey: 'sit', isLoop: false },
  { id: 'm_talk', name: 'talk', displayName: 'Talking', category: 'face', durationSec: 3, spriteKey: 'talk', isLoop: true },
  { id: 'm_angry', name: 'angry_point', displayName: 'Angry Pointing', category: 'combined', durationSec: 3, spriteKey: 'angry', isLoop: false },
  { id: 'm_cry', name: 'cry', displayName: 'Crying', category: 'face', durationSec: 3, spriteKey: 'sad', isLoop: true },
  { id: 'm_laugh', name: 'laugh', displayName: 'Laughing', category: 'face', durationSec: 3, spriteKey: 'happy', isLoop: true },
  { id: 'm_shocked', name: 'shocked', displayName: 'Shocked', category: 'face', durationSec: 2, spriteKey: 'idle', isLoop: false },
  { id: 'm_happy', name: 'happy', displayName: 'Happy', category: 'face', durationSec: 2, spriteKey: 'happy', isLoop: false },
  { id: 'm_sad', name: 'sad', displayName: 'Sad', category: 'face', durationSec: 2, spriteKey: 'sad', isLoop: false },
  { id: 'm_sleep', name: 'sleeping', displayName: 'Sleeping', category: 'body', durationSec: 3, spriteKey: 'sit', isLoop: false },
  { id: 'm_eating', name: 'eating', displayName: 'Eating', category: 'combined', durationSec: 3, spriteKey: 'idle', isLoop: false },
  { id: 'm_waving', name: 'waving', displayName: 'Waving', category: 'body', durationSec: 2, spriteKey: 'happy', isLoop: true },
  { id: 'm_running', name: 'running', displayName: 'Running', category: 'body', durationSec: 2, spriteKey: 'walk_1', isLoop: true },
];

export const backgrounds: BackgroundTemplate[] = [
  { id: 'bg_bedroom_d', name: 'bedroom_day', category: 'indoor', style: 'cartoon', prompt: 'bright bedroom', imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80' },
  { id: 'bg_kitchen_d', name: 'kitchen_day', category: 'indoor', style: 'cartoon', prompt: 'kitchen daylight', imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80' },
  { id: 'bg_living_d', name: 'living_room_day', category: 'indoor', style: 'cartoon', prompt: 'living room', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80' },
  { id: 'bg_classroom', name: 'classroom', category: 'indoor', style: 'cartoon', prompt: 'classroom', imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80' },
  { id: 'bg_hospital', name: 'hospital_room', category: 'indoor', style: 'cartoon', prompt: 'hospital room', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80' },
  { id: 'bg_street_d', name: 'street_day', category: 'outdoor', style: 'cartoon', prompt: 'city street', imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80' },
  { id: 'bg_park_d', name: 'park_day', category: 'outdoor', style: 'cartoon', prompt: 'park bench', imageUrl: 'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=800&q=80' },
  { id: 'bg_park_n', name: 'park_night', category: 'outdoor', style: 'cartoon', prompt: 'park night', imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80' },
  { id: 'bg_forest', name: 'forest_path', category: 'outdoor', style: 'cartoon', prompt: 'forest', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
  { id: 'bg_beach', name: 'beach_day', category: 'outdoor', style: 'cartoon', prompt: 'beach', imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { id: 'bg_market', name: 'market', category: 'outdoor', style: 'cartoon', prompt: 'market', imageUrl: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80' },
  { id: 'bg_restaurant', name: 'restaurant', category: 'indoor', style: 'cartoon', prompt: 'restaurant', imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' },
];

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function createEmptyProject(): Project {
  return {
    id: generateId(), title: 'Untitled Project', description: null, scriptText: null,
    genre: 'drama', status: 'draft', totalScenes: 0, durationSec: 0,
    characters: [], scenes: [], exportUrl: null, watermark: true, createdAt: new Date().toISOString()
  };
}

export function createCharacter(projectId: string, bodyTemplateId: string, name: string): Character {
  const bt = bodyTemplates.find(b => b.id === bodyTemplateId)!;
  return {
    id: generateId(), projectId, name, description: null,
    faceImageUrl: bt.thumbnailUrl, fullBodyUrl: null, bodyTemplateId, customColors: {}, spriteSet: null
  };
}

export function createScene(projectId: string, sceneNumber: number): Scene {
  return {
    id: generateId(), projectId, sceneNumber, setting: 'bedroom_day', description: null,
    mood: 'neutral', durationSec: 5, backgroundUrl: backgrounds[0]?.imageUrl ?? null,
    layers: [], voiceUrl: null, dialogText: null, voiceStyle: null, camera: null
  };
}
