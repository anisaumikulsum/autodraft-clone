export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'processing' | 'completed' | 'failed';
}

export interface GenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  model: string;
  style?: string;
  numImages: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnail?: string;
  prompt: string;
  seed?: number;
  createdAt: Date;
}

export type AspectRatio = '1:1' | '3:2' | '2:3' | '16:9' | '9:16' | '4:3' | '3:4';

export type GenerationMode = 
  | 'text-to-image'
  | 'image-to-image'
  | 'ai-paint'
  | 'upscale'
  | 'remove-background'
  | 'object-removal'
  | 'pose-maker';

export interface Model {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
}