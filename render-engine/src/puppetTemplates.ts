/* ─── Vector Puppet System (Server-side) ───
   SVG-based bone rigging for 2D character animation.
   Pure data + functions — no React dependency.
*/

export interface BoneDef {
  id: string;
  parent: string | null;
  offsetX: number;
  offsetY: number;
  defaultRotation: number;
}

export interface PuppetPart {
  boneId: string;
  type: 'path' | 'circle' | 'ellipse' | 'rect';
  attrs: Record<string, string | number>;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface FaceGeometry {
  leftEye: { cx: number; cy: number; rx: number; ry: number };
  rightEye: { cx: number; cy: number; rx: number; ry: number };
  leftEyebrow: { x1: number; y1: number; x2: number; y2: number };
  rightEyebrow: { x1: number; y1: number; x2: number; y2: number };
  mouth: { cx: number; cy: number; width: number };
}

export type Viseme = 'a' | 'e' | 'i' | 'o' | 'u' | 'm' | 'l' | 'th' | 'f';
export type Emotion = 'neutral' | 'smile' | 'frown' | 'surprise' | 'angry' | 'happy' | 'sad';
export type FaceExpression = Viseme | Emotion;

export interface PuppetTemplate {
  id: string;
  name: string;
  gender: string;
  displayName: string;
  viewBox: string;
  width: number;
  height: number;
  bones: BoneDef[];
  parts: PuppetPart[];
  faceGeometry: FaceGeometry;
  defaultColors: Record<string, string>;
  thumbnailUrl: string;
}

export interface BoneKeyframe {
  frame: number;
  rotation: number;
}

export interface MotionPreset {
  id: string;
  name: string;
  displayName: string;
  category: string;
  durationSec: number;
  fps: number;
  loop: boolean;
  keyframes: Record<string, BoneKeyframe[]>;
}

/* ─── Color helpers ─── */
export const defaultMaleColors = {
  skin: '#F5D0B0', hair: '#2D1B0E', shirt: '#3B82F6', pants: '#1F2937', shoes: '#111827',
};
export const defaultFemaleColors = {
  skin: '#F5D0B0', hair: '#5C3A21', shirt: '#EC4899', pants: '#374151', shoes: '#111827',
};
export const defaultChildColors = {
  skin: '#F5D0B0', hair: '#D97706', shirt: '#10B981', pants: '#6366F1', shoes: '#111827',
};

/* ─── Average Male Puppet ─── */
export const averageMalePuppet: PuppetTemplate = {
  id: 't2', name: 'average_male', gender: 'male', displayName: 'Average Male',
  viewBox: '0 0 200 350', width: 200, height: 350,
  thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avg-male&clothing=shirtCrewNeck',
  bones: [
    { id: 'root', parent: null, offsetX: 0, offsetY: 0, defaultRotation: 0 },
    { id: 'torso', parent: 'root', offsetX: 0, offsetY: -70, defaultRotation: 0 },
    { id: 'head', parent: 'torso', offsetX: 0, offsetY: -65, defaultRotation: 0 },
    { id: 'leftArm', parent: 'torso', offsetX: -22, offsetY: -55, defaultRotation: 0 },
    { id: 'leftForeArm', parent: 'leftArm', offsetX: 0, offsetY: 32, defaultRotation: 0 },
    { id: 'rightArm', parent: 'torso', offsetX: 22, offsetY: -55, defaultRotation: 0 },
    { id: 'rightForeArm', parent: 'rightArm', offsetX: 0, offsetY: 32, defaultRotation: 0 },
    { id: 'leftLeg', parent: 'root', offsetX: -10, offsetY: 0, defaultRotation: 0 },
    { id: 'leftLowerLeg', parent: 'leftLeg', offsetX: 0, offsetY: 40, defaultRotation: 0 },
    { id: 'rightLeg', parent: 'root', offsetX: 10, offsetY: 0, defaultRotation: 0 },
    { id: 'rightLowerLeg', parent: 'rightLeg', offsetX: 0, offsetY: 40, defaultRotation: 0 },
  ],
  parts: [
    { boneId: 'leftLeg', type: 'path', attrs: { d: 'M-8,0 C-10,10 -10,30 -8,40 L-2,40 C0,30 0,10 -2,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-7,0 C-9,10 -9,30 -7,40 L-1,40 C1,30 1,10 -1,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-10,42 Q-10,50 0,50 L8,50 C12,50 12,42 8,40 L0,40 Z' }, fill: 'shoes' },
    { boneId: 'leftLowerLeg', type: 'circle', attrs: { cx: 0, cy: 2, r: 5 }, fill: 'pants' },
    { boneId: 'rightLeg', type: 'path', attrs: { d: 'M2,0 C0,10 0,30 2,40 L8,40 C10,30 10,10 8,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M1,0 C-1,10 -1,30 1,40 L7,40 C9,30 9,10 7,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M-8,42 Q-8,50 0,50 L10,50 C14,50 14,42 10,40 L0,40 Z' }, fill: 'shoes' },
    { boneId: 'rightLowerLeg', type: 'circle', attrs: { cx: 0, cy: 2, r: 5 }, fill: 'pants' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-24,-62 Q-28,-45 -20,-20 L-18,0 Q-16,4 0,4 Q16,4 18,0 L20,-20 Q28,-45 24,-62 Q20,-70 0,-72 Q-20,-70 -24,-62 Z' }, fill: 'shirt' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-8,-68 Q0,-63 8,-68 L6,-72 Q0,-68 -6,-72 Z' }, fill: 'pants' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-7,-72 L-7,-78 Q0,-80 7,-78 L7,-72 Q0,-74 -7,-72 Z' }, fill: 'skin' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-19,-2 Q0,6 19,-2 L19,2 Q0,10 -19,2 Z' }, fill: 'pants' },
    { boneId: 'head', type: 'circle', attrs: { cx: 0, cy: -30, r: 25 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: -24, cy: -30, r: 4 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: 24, cy: -30, r: 4 }, fill: 'skin' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-26,-32 A26,26 0 0,1 26,-32 C28,-50 20,-62 0,-64 C-20,-62 -28,-50 -26,-32 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-24,-30 L-24,-20 L-20,-22 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M24,-30 L24,-20 L20,-22 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-1,-26 L0,-22 L2,-26' }, stroke: '#D4A574', strokeWidth: 1.5, fill: 'none' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-8,-10 Q0,-6 8,-10' }, stroke: '#D4A574', strokeWidth: 1, fill: 'none' },
    { boneId: 'leftArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 7 }, fill: 'shirt' },
    { boneId: 'leftArm', type: 'path', attrs: { d: 'M-6,2 Q-8,16 -6,30 L6,30 Q8,16 6,2 Z' }, fill: 'shirt' },
    { boneId: 'leftArm', type: 'rect', attrs: { x: -7, y: 28, width: 14, height: 4, rx: 2 }, fill: 'pants' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 5 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-5,2 Q-6,14 -5,26 L5,26 Q6,14 5,2 Z' }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 30, r: 6 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-3,34 Q0,38 3,34' }, stroke: '#D4A574', strokeWidth: 1, fill: 'none' },
    { boneId: 'rightArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 7 }, fill: 'shirt' },
    { boneId: 'rightArm', type: 'path', attrs: { d: 'M-6,2 Q-8,16 -6,30 L6,30 Q8,16 6,2 Z' }, fill: 'shirt' },
    { boneId: 'rightArm', type: 'rect', attrs: { x: -7, y: 28, width: 14, height: 4, rx: 2 }, fill: 'pants' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 5 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-5,2 Q-6,14 -5,26 L5,26 Q6,14 5,2 Z' }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 30, r: 6 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-3,34 Q0,38 3,34' }, stroke: '#D4A574', strokeWidth: 1, fill: 'none' },
  ],
  faceGeometry: {
    leftEye: { cx: -8, cy: -32, rx: 3.5, ry: 3.5 },
    rightEye: { cx: 8, cy: -32, rx: 3.5, ry: 3.5 },
    leftEyebrow: { x1: -14, y1: -38, x2: -2, y2: -38 },
    rightEyebrow: { x1: 2, y1: -38, x2: 14, y2: -38 },
    mouth: { cx: 0, cy: -16, width: 12 },
  },
  defaultColors: defaultMaleColors,
};

/* ─── Average Female Puppet ─── */
export const averageFemalePuppet: PuppetTemplate = {
  id: 't5', name: 'average_female', gender: 'female', displayName: 'Average Female',
  viewBox: '0 0 200 350', width: 200, height: 350,
  thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avg-female&top=longHair',
  bones: [
    { id: 'root', parent: null, offsetX: 0, offsetY: 0, defaultRotation: 0 },
    { id: 'torso', parent: 'root', offsetX: 0, offsetY: -65, defaultRotation: 0 },
    { id: 'head', parent: 'torso', offsetX: 0, offsetY: -62, defaultRotation: 0 },
    { id: 'leftArm', parent: 'torso', offsetX: -18, offsetY: -53, defaultRotation: 0 },
    { id: 'leftForeArm', parent: 'leftArm', offsetX: 0, offsetY: 30, defaultRotation: 0 },
    { id: 'rightArm', parent: 'torso', offsetX: 18, offsetY: -53, defaultRotation: 0 },
    { id: 'rightForeArm', parent: 'rightArm', offsetX: 0, offsetY: 30, defaultRotation: 0 },
    { id: 'leftLeg', parent: 'root', offsetX: -9, offsetY: 0, defaultRotation: 0 },
    { id: 'leftLowerLeg', parent: 'leftLeg', offsetX: 0, offsetY: 42, defaultRotation: 0 },
    { id: 'rightLeg', parent: 'root', offsetX: 9, offsetY: 0, defaultRotation: 0 },
    { id: 'rightLowerLeg', parent: 'rightLeg', offsetX: 0, offsetY: 42, defaultRotation: 0 },
  ],
  parts: [
    { boneId: 'leftLeg', type: 'path', attrs: { d: 'M-7,0 C-9,10 -9,30 -7,42 L-1,42 C1,30 1,10 -1,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-6,0 C-8,10 -8,30 -6,42 L0,42 C2,30 2,10 0,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-8,44 Q-8,52 0,52 L8,52 C12,52 12,44 8,42 L0,42 Z' }, fill: 'shoes' },
    { boneId: 'leftLowerLeg', type: 'circle', attrs: { cx: 0, cy: 2, r: 4.5 }, fill: 'pants' },
    { boneId: 'rightLeg', type: 'path', attrs: { d: 'M1,0 C-1,10 -1,30 1,42 L7,42 C9,30 9,10 7,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M0,0 C-2,10 -2,30 0,42 L6,42 C8,30 8,10 6,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M-8,44 Q-8,52 0,52 L10,52 C14,52 14,44 10,42 L0,42 Z' }, fill: 'shoes' },
    { boneId: 'rightLowerLeg', type: 'circle', attrs: { cx: 0, cy: 2, r: 4.5 }, fill: 'pants' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-20,-58 Q-24,-40 -16,-15 L-14,0 Q-12,4 0,4 Q12,4 14,0 L16,-15 Q24,-40 20,-58 Q14,-66 0,-68 Q-14,-66 -20,-58 Z' }, fill: 'shirt' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-5,-68 L-5,-74 Q0,-76 5,-74 L5,-68 Q0,-70 -5,-68 Z' }, fill: 'skin' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-10,-66 Q0,-60 10,-66 L8,-70 Q0,-64 -8,-70 Z' }, fill: 'pants' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-16,-4 Q0,4 16,-4 L16,0 Q0,8 -16,0 Z' }, fill: 'pants' },
    { boneId: 'head', type: 'circle', attrs: { cx: 0, cy: -28, r: 23 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: -22, cy: -28, r: 3.5 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: 22, cy: -28, r: 3.5 }, fill: 'skin' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-24,-28 A24,24 0 0,1 24,-28 C30,-15 32,5 30,25 L26,23 C28,5 24,-10 18,-22 Q0,-54 -18,-22 C-24,-10 -28,5 -26,23 L-30,25 C-32,5 -30,-15 -24,-28 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-20,-38 Q-10,-48 0,-45 Q10,-48 20,-38 L18,-42 Q0,-50 -18,-42 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-1,-24 L0,-21 L2,-24' }, stroke: '#D4A574', strokeWidth: 1.2, fill: 'none' },
    { boneId: 'head', type: 'circle', attrs: { cx: -14, cy: -22, r: 4 }, fill: 'rgba(255,150,150,0.2)' },
    { boneId: 'head', type: 'circle', attrs: { cx: 14, cy: -22, r: 4 }, fill: 'rgba(255,150,150,0.2)' },
    { boneId: 'leftArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 6 }, fill: 'skin' },
    { boneId: 'leftArm', type: 'path', attrs: { d: 'M-5,2 Q-6,15 -5,28 L5,28 Q6,15 5,2 Z' }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 4.5 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-4.5,2 Q-5,13 -4.5,24 L4.5,24 Q5,13 4.5,2 Z' }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 28, r: 5.5 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-2,32 Q0,35 2,32' }, stroke: '#D4A574', strokeWidth: 0.8, fill: 'none' },
    { boneId: 'rightArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 6 }, fill: 'skin' },
    { boneId: 'rightArm', type: 'path', attrs: { d: 'M-5,2 Q-6,15 -5,28 L5,28 Q6,15 5,2 Z' }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 4.5 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-4.5,2 Q-5,13 -4.5,24 L4.5,24 Q5,13 4.5,2 Z' }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 28, r: 5.5 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-2,32 Q0,35 2,32' }, stroke: '#D4A574', strokeWidth: 0.8, fill: 'none' },
  ],
  faceGeometry: {
    leftEye: { cx: -7, cy: -30, rx: 3.5, ry: 3.5 },
    rightEye: { cx: 7, cy: -30, rx: 3.5, ry: 3.5 },
    leftEyebrow: { x1: -14, y1: -36, x2: -2, y2: -36 },
    rightEyebrow: { x1: 2, y1: -36, x2: 14, y2: -36 },
    mouth: { cx: 0, cy: -14, width: 10 },
  },
  defaultColors: defaultFemaleColors,
};

/* ─── Child Puppet ─── */
export const childPuppet: PuppetTemplate = {
  id: 't6', name: 'child', gender: 'neutral', displayName: 'Child',
  viewBox: '0 0 200 350', width: 200, height: 350,
  thumbnailUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=child',
  bones: [
    { id: 'root', parent: null, offsetX: 0, offsetY: 0, defaultRotation: 0 },
    { id: 'torso', parent: 'root', offsetX: 0, offsetY: -50, defaultRotation: 0 },
    { id: 'head', parent: 'torso', offsetX: 0, offsetY: -50, defaultRotation: 0 },
    { id: 'leftArm', parent: 'torso', offsetX: -16, offsetY: -42, defaultRotation: 0 },
    { id: 'leftForeArm', parent: 'leftArm', offsetX: 0, offsetY: 22, defaultRotation: 0 },
    { id: 'rightArm', parent: 'torso', offsetX: 16, offsetY: -42, defaultRotation: 0 },
    { id: 'rightForeArm', parent: 'rightArm', offsetX: 0, offsetY: 22, defaultRotation: 0 },
    { id: 'leftLeg', parent: 'root', offsetX: -9, offsetY: 0, defaultRotation: 0 },
    { id: 'leftLowerLeg', parent: 'leftLeg', offsetX: 0, offsetY: 28, defaultRotation: 0 },
    { id: 'rightLeg', parent: 'root', offsetX: 9, offsetY: 0, defaultRotation: 0 },
    { id: 'rightLowerLeg', parent: 'rightLeg', offsetX: 0, offsetY: 28, defaultRotation: 0 },
  ],
  parts: [
    { boneId: 'leftLeg', type: 'path', attrs: { d: 'M-7,0 C-9,7 -9,20 -7,28 L-1,28 C1,20 1,7 -1,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-6,0 C-8,7 -8,20 -6,26 L0,26 C2,20 2,7 0,0 Z' }, fill: 'pants' },
    { boneId: 'leftLowerLeg', type: 'path', attrs: { d: 'M-10,28 Q-10,36 0,36 L10,36 C14,36 14,28 10,26 L0,26 Z' }, fill: 'shoes' },
    { boneId: 'leftLowerLeg', type: 'circle', attrs: { cx: 0, cy: 1, r: 5 }, fill: 'pants' },
    { boneId: 'rightLeg', type: 'path', attrs: { d: 'M1,0 C-1,7 -1,20 1,28 L7,28 C9,20 9,7 7,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M0,0 C-2,7 -2,20 0,26 L6,26 C8,20 8,7 6,0 Z' }, fill: 'pants' },
    { boneId: 'rightLowerLeg', type: 'path', attrs: { d: 'M-10,28 Q-10,36 0,36 L12,36 C16,36 16,28 12,26 L0,26 Z' }, fill: 'shoes' },
    { boneId: 'rightLowerLeg', type: 'circle', attrs: { cx: 0, cy: 1, r: 5 }, fill: 'pants' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-19,-46 Q-22,-25 -15,-2 L15,-2 Q22,-25 19,-46 Q10,-52 -10,-52 Z' }, fill: 'shirt' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M-6,-52 L-6,-56 Q0,-58 6,-56 L6,-52 Q0,-54 -6,-52 Z' }, fill: 'skin' },
    { boneId: 'torso', type: 'path', attrs: { d: 'M0,-35 L2,-30 L7,-30 L3,-26 L5,-21 L0,-24 L-5,-21 L-3,-26 L-7,-30 L-2,-30 Z' }, fill: '#fff' },
    { boneId: 'head', type: 'circle', attrs: { cx: 0, cy: -22, r: 28 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: -27, cy: -22, r: 3.5 }, fill: 'skin' },
    { boneId: 'head', type: 'circle', attrs: { cx: 27, cy: -22, r: 3.5 }, fill: 'skin' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-28,-22 A28,28 0 0,1 28,-22 C32,-5 22,8 15,2 C8,-5 -8,-5 -15,2 C-22,8 -32,-5 -28,-22 Z' }, fill: 'hair' },
    { boneId: 'head', type: 'path', attrs: { d: 'M-5,-48 Q0,-58 5,-48 Q0,-52 -5,-48' }, fill: 'hair' },
    { boneId: 'head', type: 'circle', attrs: { cx: -18, cy: -18, r: 4.5 }, fill: 'rgba(255,140,140,0.25)' },
    { boneId: 'head', type: 'circle', attrs: { cx: 18, cy: -18, r: 4.5 }, fill: 'rgba(255,140,140,0.25)' },
    { boneId: 'head', type: 'circle', attrs: { cx: 0, cy: -19, r: 1.5 }, fill: '#D4A574' },
    { boneId: 'leftArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 6 }, fill: 'shirt' },
    { boneId: 'leftArm', type: 'path', attrs: { d: 'M-5,2 Q-6,11 -5,20 L5,20 Q6,11 5,2 Z' }, fill: 'shirt' },
    { boneId: 'leftArm', type: 'rect', attrs: { x: -6, y: 18, width: 12, height: 3, rx: 1.5 }, fill: 'pants' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 4.5 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-4.5,2 Q-5,10 -4.5,16 L4.5,16 Q5,10 4.5,2 Z' }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'circle', attrs: { cx: 0, cy: 20, r: 6 }, fill: 'skin' },
    { boneId: 'leftForeArm', type: 'path', attrs: { d: 'M-3,24 Q0,27 3,24' }, stroke: '#D4A574', strokeWidth: 1, fill: 'none' },
    { boneId: 'rightArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 6 }, fill: 'shirt' },
    { boneId: 'rightArm', type: 'path', attrs: { d: 'M-5,2 Q-6,11 -5,20 L5,20 Q6,11 5,2 Z' }, fill: 'shirt' },
    { boneId: 'rightArm', type: 'rect', attrs: { x: -6, y: 18, width: 12, height: 3, rx: 1.5 }, fill: 'pants' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 0, r: 4.5 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-4.5,2 Q-5,10 -4.5,16 L4.5,16 Q5,10 4.5,2 Z' }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'circle', attrs: { cx: 0, cy: 20, r: 6 }, fill: 'skin' },
    { boneId: 'rightForeArm', type: 'path', attrs: { d: 'M-3,24 Q0,27 3,24' }, stroke: '#D4A574', strokeWidth: 1, fill: 'none' },
  ],
  faceGeometry: {
    leftEye: { cx: -10, cy: -24, rx: 4.5, ry: 4.5 },
    rightEye: { cx: 10, cy: -24, rx: 4.5, ry: 4.5 },
    leftEyebrow: { x1: -16, y1: -30, x2: -4, y2: -30 },
    rightEyebrow: { x1: 4, y1: -30, x2: 16, y2: -30 },
    mouth: { cx: 0, cy: -10, width: 16 },
  },
  defaultColors: defaultChildColors,
};

export const puppetTemplates: PuppetTemplate[] = [averageMalePuppet, averageFemalePuppet, childPuppet];

export function getPuppetTemplate(id: string): PuppetTemplate | undefined {
  return puppetTemplates.find(p => p.id === id);
}

/* ─── Motion Presets ─── */
function kf(frame: number, rotation: number): BoneKeyframe {
  return { frame, rotation };
}

export const puppetMotionPresets: MotionPreset[] = [
  {
    id: 'm_idle', name: 'idle', displayName: 'Idle Standing', category: 'body', durationSec: 2, fps: 12, loop: true,
    keyframes: {
      head: [kf(0, 0), kf(6, 2), kf(12, -1), kf(18, 1), kf(24, 0)],
      torso: [kf(0, 0), kf(12, 0)],
      leftArm: [kf(0, 3), kf(12, -2), kf(24, 3)],
      leftForeArm: [kf(0, 0), kf(12, 0)],
      rightArm: [kf(0, -3), kf(12, 2), kf(24, -3)],
      rightForeArm: [kf(0, 0), kf(12, 0)],
      leftLeg: [kf(0, 0), kf(12, 0)],
      leftLowerLeg: [kf(0, 0), kf(12, 0)],
      rightLeg: [kf(0, 0), kf(12, 0)],
      rightLowerLeg: [kf(0, 0), kf(12, 0)],
    },
  },
  {
    id: 'm_walk', name: 'walk', displayName: 'Walking', category: 'body', durationSec: 1, fps: 12, loop: true,
    keyframes: {
      head: [kf(0, -2), kf(6, 2), kf(12, -2)],
      torso: [kf(0, 2), kf(6, -2), kf(12, 2)],
      leftArm: [kf(0, 25), kf(6, -25), kf(12, 25)],
      leftForeArm: [kf(0, -10), kf(6, -5), kf(12, -10)],
      rightArm: [kf(0, -25), kf(6, 25), kf(12, -25)],
      rightForeArm: [kf(0, -5), kf(6, -10), kf(12, -5)],
      leftLeg: [kf(0, -25), kf(6, 25), kf(12, -25)],
      leftLowerLeg: [kf(0, 10), kf(6, 0), kf(12, 10)],
      rightLeg: [kf(0, 25), kf(6, -25), kf(12, 25)],
      rightLowerLeg: [kf(0, 0), kf(6, 10), kf(12, 0)],
    },
  },
  {
    id: 'm_talk', name: 'talk', displayName: 'Talking', category: 'face', durationSec: 1.5, fps: 8, loop: true,
    keyframes: {
      head: [kf(0, 0), kf(4, 3), kf(8, -2), kf(12, 0)],
      torso: [kf(0, 0), kf(8, 0)],
      leftArm: [kf(0, 5), kf(4, 10), kf(8, 5), kf(12, 0)],
      leftForeArm: [kf(0, -5), kf(4, -15), kf(8, -5), kf(12, 0)],
      rightArm: [kf(0, -5), kf(4, -10), kf(8, -5), kf(12, 0)],
      rightForeArm: [kf(0, -5), kf(4, -10), kf(8, -5), kf(12, 0)],
      leftLeg: [kf(0, 0)], leftLowerLeg: [kf(0, 0)],
      rightLeg: [kf(0, 0)], rightLowerLeg: [kf(0, 0)],
    },
  },
  {
    id: 'm_sit', name: 'sit', displayName: 'Sitting', category: 'body', durationSec: 2, fps: 12, loop: false,
    keyframes: {
      head: [kf(0, 0)], torso: [kf(0, -15)],
      leftArm: [kf(0, -30)], leftForeArm: [kf(0, -70)],
      rightArm: [kf(0, 30)], rightForeArm: [kf(0, -70)],
      leftLeg: [kf(0, -90)], leftLowerLeg: [kf(0, 90)],
      rightLeg: [kf(0, -90)], rightLowerLeg: [kf(0, 90)],
    },
  },
  {
    id: 'm_happy', name: 'happy', displayName: 'Happy / Cheer', category: 'combined', durationSec: 1.5, fps: 12, loop: true,
    keyframes: {
      head: [kf(0, 0), kf(6, -5), kf(12, 0), kf(18, 5), kf(24, 0)],
      torso: [kf(0, 0), kf(12, -3), kf(24, 0)],
      leftArm: [kf(0, -120), kf(12, -130), kf(24, -120)],
      leftForeArm: [kf(0, -20), kf(12, -30), kf(24, -20)],
      rightArm: [kf(0, 120), kf(12, 130), kf(24, 120)],
      rightForeArm: [kf(0, -20), kf(12, -30), kf(24, -20)],
      leftLeg: [kf(0, 0)], leftLowerLeg: [kf(0, 0)],
      rightLeg: [kf(0, 0)], rightLowerLeg: [kf(0, 0)],
    },
  },
  {
    id: 'm_sad', name: 'sad', displayName: 'Sad / Slump', category: 'face', durationSec: 2, fps: 12, loop: false,
    keyframes: {
      head: [kf(0, 8)], torso: [kf(0, 5)],
      leftArm: [kf(0, 5)], leftForeArm: [kf(0, 15)],
      rightArm: [kf(0, -5)], rightForeArm: [kf(0, 15)],
      leftLeg: [kf(0, 0)], leftLowerLeg: [kf(0, 0)],
      rightLeg: [kf(0, 0)], rightLowerLeg: [kf(0, 0)],
    },
  },
  {
    id: 'm_angry', name: 'angry_point', displayName: 'Angry Pointing', category: 'combined', durationSec: 2, fps: 12, loop: false,
    keyframes: {
      head: [kf(0, 0), kf(6, -5), kf(12, 0)],
      torso: [kf(0, -5), kf(12, 0)],
      leftArm: [kf(0, 10), kf(12, 0)],
      leftForeArm: [kf(0, 20), kf(12, 0)],
      rightArm: [kf(0, -45), kf(6, -50), kf(12, -45)],
      rightForeArm: [kf(0, -90), kf(6, -95), kf(12, -90)],
      leftLeg: [kf(0, 0)], leftLowerLeg: [kf(0, 0)],
      rightLeg: [kf(0, 0)], rightLowerLeg: [kf(0, 0)],
    },
  },
  {
    id: 'm_waving', name: 'waving', displayName: 'Waving', category: 'body', durationSec: 1, fps: 8, loop: true,
    keyframes: {
      head: [kf(0, 0)], torso: [kf(0, 0)],
      leftArm: [kf(0, -130), kf(2, -140), kf(4, -130), kf(6, -140), kf(8, -130)],
      leftForeArm: [kf(0, -20), kf(1, -30), kf(2, -20), kf(3, -30), kf(4, -20), kf(5, -30), kf(6, -20), kf(7, -30), kf(8, -20)],
      rightArm: [kf(0, 10)], rightForeArm: [kf(0, 10)],
      leftLeg: [kf(0, 0)], leftLowerLeg: [kf(0, 0)],
      rightLeg: [kf(0, 0)], rightLowerLeg: [kf(0, 0)],
    },
  },
];

export function getMotionPreset(id: string, customMotions: MotionPreset[] = []): MotionPreset | undefined {
  return customMotions.find(m => m.id === id) || puppetMotionPresets.find(m => m.id === id);
}

export function interpolateKeyframe(keyframes: BoneKeyframe[], frame: number): number {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].rotation;
  let prev = keyframes[0];
  let next = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (frame >= keyframes[i].frame && frame <= keyframes[i + 1].frame) {
      prev = keyframes[i];
      next = keyframes[i + 1];
      break;
    }
  }
  if (prev.frame === next.frame) return prev.rotation;
  const t = (frame - prev.frame) / (next.frame - prev.frame);
  return prev.rotation + (next.rotation - prev.rotation) * t;
}

export function computeBoneAngles(preset: MotionPreset, elapsedMs: number, isLooping: boolean): Record<string, number> {
  const totalFrames = preset.durationSec * preset.fps;
  let currentFrame = (elapsedMs / 1000) * preset.fps;
  if (isLooping && preset.loop) {
    currentFrame = currentFrame % totalFrames;
  } else {
    currentFrame = Math.min(currentFrame, totalFrames);
  }
  const angles: Record<string, number> = {};
  for (const [boneId, kfs] of Object.entries(preset.keyframes)) {
    angles[boneId] = interpolateKeyframe(kfs, currentFrame);
  }
  return angles;
}

/* ─── Lip-Sync Engine ─── */
const visemeMap: Record<string, Viseme> = {
  a: 'a', e: 'e', i: 'i', o: 'o', u: 'u',
  m: 'm', b: 'm', p: 'm',
  l: 'l',
  f: 'f', v: 'f',
  t: 'th', d: 'th', s: 'th', z: 'th', n: 'th',
};

export function textToVisemes(text: string): Viseme[] {
  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '');
  const result: Viseme[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const chunk = cleaned.slice(i, i + 2);
    const dominant = chunk.split('').find(c => 'aeiou'.includes(c)) || chunk[0];
    result.push(visemeMap[dominant] || 'm');
  }
  if (result.length === 0) result.push('m');
  return result;
}

export function getVisemeAtTime(visemes: Viseme[], durationSec: number, elapsedMs: number, isLooping: boolean): Viseme {
  const durMs = durationSec * 1000;
  const t = isLooping ? (elapsedMs % durMs) : Math.min(elapsedMs, durMs);
  const idx = Math.floor((t / durMs) * visemes.length);
  return visemes[Math.min(idx, visemes.length - 1)];
}

export function isEyeOpenAtTime(layerId: string, elapsedMs: number): boolean {
  let hash = 0;
  for (let i = 0; i < layerId.length; i++) {
    hash = ((hash << 5) - hash) + layerId.charCodeAt(i);
    hash |= 0;
  }
  const interval = 2500 + (Math.abs(hash) % 2000);
  const blinkDur = 120;
  const cycle = interval + blinkDur;
  const phase = elapsedMs % cycle;
  return phase < interval;
}
