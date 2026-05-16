import { Resvg } from '@resvg/resvg-js';
import {
  PuppetTemplate, PuppetPart, BoneDef, FaceExpression, FaceGeometry,
  getPuppetTemplate, getMotionPreset, computeBoneAngles,
  textToVisemes, getVisemeAtTime, isEyeOpenAtTime,
} from './puppetTemplates.js';

/* ─── SVG String Builder ─── */

function buildBoneTree(bones: BoneDef[]): Map<string, { bone: BoneDef; children: string[] }> {
  const map = new Map<string, { bone: BoneDef; children: string[] }>();
  for (const b of bones) map.set(b.id, { bone: b, children: [] });
  for (const b of bones) {
    if (b.parent) {
      const parent = map.get(b.parent);
      if (parent) parent.children.push(b.id);
    }
  }
  return map;
}

function getColor(fillRef: string | undefined, colors: Record<string, string>): string {
  if (!fillRef) return '#888';
  return colors[fillRef] || fillRef; // if it's already a literal color
}

function renderPart(part: PuppetPart, colors: Record<string, string>): string {
  const fill = part.fill ? getColor(part.fill, colors) : 'none';
  const stroke = part.stroke ? getColor(part.stroke, colors) : 'none';
  const sw = part.strokeWidth || 0;
  const a = part.attrs;
  switch (part.type) {
    case 'path':
      return ` <path d="${a.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'circle':
      return ` <circle cx="${a.cx}" cy="${a.cy}" r="${a.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    case 'ellipse':
      return ` <ellipse cx="${a.cx}" cy="${a.cy}" rx="${a.rx}" ry="${a.ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    case 'rect':
      return ` <rect x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" rx="${a.rx || 0}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`;
    default: return '';
  }
}

function renderMouth(cx: number, cy: number, width: number, expression: FaceExpression): string {
  const hw = width / 2;
  const stroke = '#C0846B';
  const fillDark = '#8B5E4A';
  let shape = '';
  switch (expression) {
    case 'smile': case 'happy':
      shape = ` <path d="M${cx-hw},${cy-1} Q${cx},${cy+hw*0.7} ${cx+hw},${cy-1}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`; break;
    case 'frown': case 'sad':
      shape = ` <path d="M${cx-hw},${cy+1} Q${cx},${cy-hw*0.5} ${cx+hw},${cy+1}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`; break;
    case 'surprise': case 'a':
      shape = ` <g><path d="M${cx-4},${cy} Q${cx-4},${cy+7} ${cx},${cy+7} Q${cx+4},${cy+7} ${cx+4},${cy} Q${cx+4},${cy-3} ${cx},${cy-3} Q${cx-4},${cy-3} ${cx-4},${cy} Z" fill="${fillDark}" stroke="${stroke}" stroke-width="1" /><path d="M${cx-2},${cy+4} Q${cx},${cy+2} ${cx+2},${cy+4}" stroke="#D47A6A" stroke-width="0.8" fill="none" /></g>`; break;
    case 'angry':
      shape = ` <path d="M${cx-hw},${cy+2} L${cx+hw},${cy}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`; break;
    case 'e':
      shape = ` <g><path d="M${cx-3.5},${cy} Q${cx-3.5},${cy+5} ${cx},${cy+5} Q${cx+3.5},${cy+5} ${cx+3.5},${cy} Q${cx+3.5},${cy-2} ${cx},${cy-2} Q${cx-3.5},${cy-2} ${cx-3.5},${cy} Z" fill="${fillDark}" stroke="${stroke}" stroke-width="1" /><path d="M${cx-2},${cy-0.5} L${cx+2},${cy-0.5}" stroke="#fff" stroke-width="0.6" fill="none" /></g>`; break;
    case 'i':
      shape = ` <path d="M${cx-hw*0.6},${cy+0.5} Q${cx},${cy+2} ${cx+hw*0.6},${cy+0.5}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`; break;
    case 'o':
      shape = ` <ellipse cx="${cx}" cy="${cy+1.5}" rx="${hw*0.5}" ry="${hw*0.45}" fill="${fillDark}" stroke="${stroke}" stroke-width="1" />`; break;
    case 'u':
      shape = ` <ellipse cx="${cx}" cy="${cy+1}" rx="${hw*0.35}" ry="${hw*0.3}" fill="${fillDark}" stroke="${stroke}" stroke-width="1" />`; break;
    case 'm':
      shape = ` <path d="M${cx-hw},${cy+1} L${cx+hw},${cy+1}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`; break;
    case 'l':
      shape = ` <g><path d="M${cx-3},${cy} Q${cx-3},${cy+4} ${cx},${cy+4} Q${cx+3},${cy+4} ${cx+3},${cy} Q${cx+3},${cy-1} ${cx},${cy-1} Q${cx-3},${cy-1} ${cx-3},${cy} Z" fill="${fillDark}" stroke="${stroke}" stroke-width="1" /><ellipse cx="${cx}" cy="${cy+2.5}" rx="1.5" ry="1" fill="#D47A6A" /></g>`; break;
    case 'th':
      shape = ` <g><path d="M${cx-3.5},${cy} Q${cx-3.5},${cy+4.5} ${cx},${cy+4.5} Q${cx+3.5},${cy+4.5} ${cx+3.5},${cy} Q${cx+3.5},${cy-1.5} ${cx},${cy-1.5} Q${cx-3.5},${cy-1.5} ${cx-3.5},${cy} Z" fill="${fillDark}" stroke="${stroke}" stroke-width="1" /><path d="M${cx-2},${cy+1} L${cx+2},${cy+1}" stroke="#fff" stroke-width="0.6" fill="none" /></g>`; break;
    case 'f':
      shape = ` <g><path d="M${cx-3},${cy+0.5} Q${cx-3},${cy+3.5} ${cx},${cy+3.5} Q${cx+3},${cy+3.5} ${cx+3},${cy+0.5} Q${cx+3},${cy-0.5} ${cx},${cy-0.5} Q${cx-3},${cy-0.5} ${cx-3},${cy+0.5} Z" fill="${fillDark}" stroke="${stroke}" stroke-width="1" /><path d="M${cx-hw},${cy+0.5} Q${cx},${cy-1} ${cx+hw},${cy+0.5}" stroke="${stroke}" stroke-width="1" fill="none" /></g>`; break;
    default:
      shape = ` <path d="M${cx-hw},${cy} Q${cx},${cy+3} ${cx+hw},${cy}" stroke="${stroke}" stroke-width="1.5" fill="none" stroke-linecap="round" />`;
  }
  return shape;
}

function renderEyebrow(x1: number, y1: number, x2: number, y2: number, expression: FaceExpression, isLeft: boolean): string {
  const stroke = '#3B2412';
  const sw = 1.8;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  let dy = 0, rot = 0;
  switch (expression) {
    case 'smile': case 'happy': dy = -1.5; break;
    case 'angry': rot = isLeft ? 12 : -12; break;
    case 'frown': case 'sad': rot = isLeft ? -8 : 8; dy = 0.5; break;
    case 'surprise': dy = -3.5; break;
  }
  const path = `M${x1},${y1} Q${(x1+x2)/2},${y1-2} ${x2},${y2}`;
  return ` <path d="${path}" stroke="${stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round" transform="rotate(${rot}, ${cx}, ${cy+dy}) translate(0, ${dy})" />`;
}

function renderEye(cx: number, cy: number, rx: number, ry: number, eyeOpen: boolean): string {
  if (!eyeOpen) {
    return ` <path d="M${cx-rx},${cy} Q${cx},${cy+1.5} ${cx+rx},${cy}" stroke="#1a1a1a" stroke-width="1.5" fill="none" stroke-linecap="round" />`;
  }
  return ` <g><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" /><circle cx="${cx}" cy="${cy}" r="${rx*0.55}" fill="#1a1a1a" /><circle cx="${cx-rx*0.3}" cy="${cy-ry*0.3}" r="${rx*0.25}" fill="#fff" /></g>`;
}

function renderBoneGroup(
  boneId: string,
  tree: Map<string, { bone: BoneDef; children: string[] }>,
  parts: PuppetPart[],
  angles: Record<string, number>,
  colors: Record<string, string>,
  faceExpression: FaceExpression,
  eyeOpen: boolean,
  faceGeometry?: FaceGeometry,
): string {
  const node = tree.get(boneId);
  if (!node) return '';
  const angle = angles[boneId] ?? node.bone.defaultRotation;
  const { offsetX, offsetY } = node.bone;
  const myParts = parts.filter(p => p.boneId === boneId);
  const isHead = boneId === 'head';
  let svg = '';
  svg += ` <g transform="translate(${offsetX}, ${offsetY}) rotate(${angle})">`;
  for (const part of myParts) svg += renderPart(part, colors);
  if (isHead && faceGeometry) {
    const fg = faceGeometry;
    svg += renderEyebrow(fg.leftEyebrow.x1, fg.leftEyebrow.y1, fg.leftEyebrow.x2, fg.leftEyebrow.y2, faceExpression, true);
    svg += renderEyebrow(fg.rightEyebrow.x1, fg.rightEyebrow.y1, fg.rightEyebrow.x2, fg.rightEyebrow.y2, faceExpression, false);
    svg += renderEye(fg.leftEye.cx, fg.leftEye.cy, fg.leftEye.rx, fg.leftEye.ry, eyeOpen);
    svg += renderEye(fg.rightEye.cx, fg.rightEye.cy, fg.rightEye.rx, fg.rightEye.ry, eyeOpen);
    svg += renderMouth(fg.mouth.cx, fg.mouth.cy, fg.mouth.width, faceExpression);
  }
  for (const childId of node.children) {
    svg += renderBoneGroup(childId, tree, parts, angles, colors, faceExpression, eyeOpen, faceGeometry);
  }
  svg += ' </g>';
  return svg;
}

export function generatePuppetSvg(
  puppet: PuppetTemplate,
  colors: Record<string, string>,
  boneAngles: Record<string, number>,
  faceExpression: FaceExpression,
  eyeOpen: boolean,
): string {
  const tree = buildBoneTree(puppet.bones);
  const rootBones = puppet.bones.filter((b: BoneDef) => b.parent === null);
  const scaleX = 80 / puppet.width;
  const scaleY = 140 / puppet.height;
  const scale = Math.min(scaleX, scaleY);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${puppet.viewBox}" width="${80}" height="${140}">`;
  svg += ` <ellipse cx="100" cy="340" rx="35" ry="8" fill="rgba(0,0,0,0.15)" />`;
  svg += ` <g transform="translate(100, 250)">`;
  for (const root of rootBones) {
    svg += renderBoneGroup(root.id, tree, puppet.parts, boneAngles, colors, faceExpression, eyeOpen, puppet.faceGeometry);
  }
  svg += ' </g>';
  svg += '</svg>';
  return svg;
}

/* ─── SVG → PNG via resvg ─── */
export function renderPuppetToPng(
  puppet: PuppetTemplate,
  colors: Record<string, string>,
  boneAngles: Record<string, number>,
  faceExpression: FaceExpression,
  eyeOpen: boolean,
  outWidth = 160,
  outHeight = 280,
): Buffer {
  const svg = generatePuppetSvg(puppet, colors, boneAngles, faceExpression, eyeOpen);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: outWidth },
    font: { defaultFontFamily: 'sans-serif' },
  });
  const png = resvg.render();
  return png.asPng();
}

/* ─── Per-frame puppet state for a scene ─── */
export function getPuppetFrameState(
  layerId: string,
  motionPresetId: string,
  dialogText: string | null | undefined,
  sceneDurationSec: number,
  elapsedMs: number,
): { angles: Record<string, number>; expression: FaceExpression; eyeOpen: boolean } {
  const preset = getMotionPreset(motionPresetId);
  const angles = preset ? computeBoneAngles(preset, elapsedMs, true) : {};
  let expression: FaceExpression = 'neutral';
  if (preset) {
    switch (preset.name) {
      case 'talk': expression = 'neutral'; break;
      case 'eating': expression = 'a'; break;
      case 'happy': case 'laugh': case 'waving': expression = 'smile'; break;
      case 'sad': case 'cry': expression = 'frown'; break;
      case 'angry': expression = 'angry'; break;
      case 'shocked': expression = 'surprise'; break;
      default: expression = 'neutral';
    }
    if (preset.name === 'talk' && dialogText) {
      const visemes = textToVisemes(dialogText);
      expression = getVisemeAtTime(visemes, sceneDurationSec, elapsedMs, true);
    }
  }
  const eyeOpen = isEyeOpenAtTime(layerId, elapsedMs);
  return { angles, expression, eyeOpen };
}
