import React, { useMemo } from 'react';
import type { PuppetTemplate, PuppetPart, BoneDef, FaceExpression, FaceGeometry } from '../stores/puppets';

interface PuppetCanvasProps {
  puppet: PuppetTemplate;
  colors: Record<string, string>;
  faceImageUrl?: string | null;
  boneAngles: Record<string, number>;
  faceExpression?: FaceExpression;
  eyeOpen?: boolean;
  width?: number;
  height?: number;
  className?: string;
  // Bone editor mode
  showBones?: boolean;
  selectedBoneId?: string | null;
  onBoneClick?: (boneId: string) => void;
  editableAngles?: Record<string, number>;
  // Sprite mode
  spriteUrl?: string | null;
}

/* Compute absolute joint positions for bone overlay */
function computeJointPositions(
  bones: BoneDef[],
  angles: Record<string, number>,
  baseX = 100,
  baseY = 250,
): Map<string, { x: number; y: number; parentX?: number; parentY?: number }> {
  const tree = buildBoneTree(bones);
  const positions = new Map<string, { x: number; y: number; parentX?: number; parentY?: number }>();

  function walk(boneId: string, parentX: number, parentY: number) {
    const node = tree.get(boneId);
    if (!node) return;
    const angle = (angles[boneId] ?? node.bone.defaultRotation) * (Math.PI / 180);
    const ox = node.bone.offsetX;
    const oy = node.bone.offsetY;
    // Rotate offset by parent angle (but we accumulate)
    const x = parentX + ox * Math.cos(angle) - oy * Math.sin(angle);
    const y = parentY + ox * Math.sin(angle) + oy * Math.cos(angle);
    positions.set(boneId, { x, y, parentX, parentY });
    for (const childId of node.children) {
      walk(childId, x, y);
    }
  }

  for (const b of bones) {
    if (b.parent === null) {
      walk(b.id, baseX, baseY);
    }
  }
  return positions;
}

/* Build bone tree from flat array */
function buildBoneTree(bones: BoneDef[]): Map<string, { bone: BoneDef; children: string[] }> {
  const map = new Map<string, { bone: BoneDef; children: string[] }>();
  for (const b of bones) {
    map.set(b.id, { bone: b, children: [] });
  }
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
  return colors[fillRef] || '#888';
}

/* Render a single SVG element from part definition */
function renderPart(part: PuppetPart, colors: Record<string, string>) {
  const fill = part.fill ? getColor(part.fill, colors) : 'none';
  const stroke = part.stroke ? getColor(part.stroke, colors) : 'none';
  const strokeWidth = part.strokeWidth || 0;
  const attrs = part.attrs as Record<string, string | number>;

  switch (part.type) {
    case 'path':
      return (
        <path
          key={JSON.stringify(part.attrs)}
          d={String(attrs.d)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'circle':
      return (
        <circle
          key={JSON.stringify(part.attrs)}
          cx={Number(attrs.cx)}
          cy={Number(attrs.cy)}
          r={Number(attrs.r)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'ellipse':
      return (
        <ellipse
          key={JSON.stringify(part.attrs)}
          cx={Number(attrs.cx)}
          cy={Number(attrs.cy)}
          rx={Number(attrs.rx)}
          ry={Number(attrs.ry)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case 'rect':
      return (
        <rect
          key={JSON.stringify(part.attrs)}
          x={Number(attrs.x)}
          y={Number(attrs.y)}
          width={Number(attrs.width)}
          height={Number(attrs.height)}
          rx={Number(attrs.rx || 0)}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    default:
      return null;
  }
}

function renderMouth(cx: number, cy: number, width: number, expression: FaceExpression) {
  const hw = width / 2;
  const stroke = '#C0846B';
  const fillDark = '#8B5E4A';
  switch (expression) {
    // ── Emotional expressions ──
    case 'smile':
    case 'happy':
      return <path d={`M${cx - hw},${cy - 1} Q${cx},${cy + hw * 0.7} ${cx + hw},${cy - 1}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case 'frown':
    case 'sad':
      return <path d={`M${cx - hw},${cy + 1} Q${cx},${cy - hw * 0.5} ${cx + hw},${cy + 1}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case 'surprise':
    case 'a':
      return (
        <g>
          <path d={`M${cx - 4},${cy} Q${cx - 4},${cy + 7} ${cx},${cy + 7} Q${cx + 4},${cy + 7} ${cx + 4},${cy} Q${cx + 4},${cy - 3} ${cx},${cy - 3} Q${cx - 4},${cy - 3} ${cx - 4},${cy} Z`} fill={fillDark} stroke={stroke} strokeWidth={1} />
          <path d={`M${cx - 2},${cy + 4} Q${cx},${cy + 2} ${cx + 2},${cy + 4}`} stroke="#D47A6A" strokeWidth={0.8} fill="none" />
        </g>
      );
    case 'angry':
      return <path d={`M${cx - hw},${cy + 2} L${cx + hw},${cy}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case 'neutral':
    default:
      return <path d={`M${cx - hw},${cy} Q${cx},${cy + 3} ${cx + hw},${cy}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;

    // ── Visemes (lip-sync shapes) ──
    case 'e':
      return (
        <g>
          <path d={`M${cx - 3.5},${cy} Q${cx - 3.5},${cy + 5} ${cx},${cy + 5} Q${cx + 3.5},${cy + 5} ${cx + 3.5},${cy} Q${cx + 3.5},${cy - 2} ${cx},${cy - 2} Q${cx - 3.5},${cy - 2} ${cx - 3.5},${cy} Z`} fill={fillDark} stroke={stroke} strokeWidth={1} />
          <path d={`M${cx - 2},${cy - 0.5} L${cx + 2},${cy - 0.5}`} stroke="#fff" strokeWidth={0.6} fill="none" />
        </g>
      );
    case 'i':
      return <path d={`M${cx - hw * 0.6},${cy + 0.5} Q${cx},${cy + 2} ${cx + hw * 0.6},${cy + 0.5}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case 'o':
      return <ellipse cx={cx} cy={cy + 1.5} rx={hw * 0.5} ry={hw * 0.45} fill={fillDark} stroke={stroke} strokeWidth={1} />;
    case 'u':
      return <ellipse cx={cx} cy={cy + 1} rx={hw * 0.35} ry={hw * 0.3} fill={fillDark} stroke={stroke} strokeWidth={1} />;
    case 'm':
      return <path d={`M${cx - hw},${cy + 1} L${cx + hw},${cy + 1}`} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" />;
    case 'l':
      return (
        <g>
          <path d={`M${cx - 3},${cy} Q${cx - 3},${cy + 4} ${cx},${cy + 4} Q${cx + 3},${cy + 4} ${cx + 3},${cy} Q${cx + 3},${cy - 1} ${cx},${cy - 1} Q${cx - 3},${cy - 1} ${cx - 3},${cy} Z`} fill={fillDark} stroke={stroke} strokeWidth={1} />
          <ellipse cx={cx} cy={cy + 2.5} rx={1.5} ry={1} fill="#D47A6A" />
        </g>
      );
    case 'th':
      return (
        <g>
          <path d={`M${cx - 3.5},${cy} Q${cx - 3.5},${cy + 4.5} ${cx},${cy + 4.5} Q${cx + 3.5},${cy + 4.5} ${cx + 3.5},${cy} Q${cx + 3.5},${cy - 1.5} ${cx},${cy - 1.5} Q${cx - 3.5},${cy - 1.5} ${cx - 3.5},${cy} Z`} fill={fillDark} stroke={stroke} strokeWidth={1} />
          <path d={`M${cx - 2},${cy + 1} L${cx + 2},${cy + 1}`} stroke="#fff" strokeWidth={0.6} fill="none" />
        </g>
      );
    case 'f':
      return (
        <g>
          <path d={`M${cx - 3},${cy + 0.5} Q${cx - 3},${cy + 3.5} ${cx},${cy + 3.5} Q${cx + 3},${cy + 3.5} ${cx + 3},${cy + 0.5} Q${cx + 3},${cy - 0.5} ${cx},${cy - 0.5} Q${cx - 3},${cy - 0.5} ${cx - 3},${cy + 0.5} Z`} fill={fillDark} stroke={stroke} strokeWidth={1} />
          <path d={`M${cx - hw},${cy + 0.5} Q${cx},${cy - 1} ${cx + hw},${cy + 0.5}`} stroke={stroke} strokeWidth={1} fill="none" />
        </g>
      );
  }
}

function renderEyebrow(x1: number, y1: number, x2: number, y2: number, expression: FaceExpression, isLeft: boolean) {
  const stroke = '#3B2412';
  const sw = 1.8;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  let dy = 0;
  let rot = 0;

  switch (expression) {
    case 'smile':
      dy = -1.5;
      break;
    case 'angry':
      rot = isLeft ? 12 : -12;
      break;
    case 'frown':
      rot = isLeft ? -8 : 8;
      dy = 0.5;
      break;
    case 'surprise':
      dy = -3.5;
      break;
    case 'neutral':
    default:
      break;
  }

  const path = `M${x1},${y1} Q${(x1 + x2) / 2},${y1 - 2} ${x2},${y2}`;

  return (
    <path
      d={path}
      stroke={stroke}
      strokeWidth={sw}
      fill="none"
      strokeLinecap="round"
      transform={`rotate(${rot}, ${cx}, ${cy + dy}) translate(0, ${dy})`}
    />
  );
}

function renderEye(cx: number, cy: number, rx: number, ry: number, eyeOpen: boolean) {
  if (!eyeOpen) {
    return (
      <path
        d={`M${cx - rx},${cy} Q${cx},${cy + 1.5} ${cx + rx},${cy}`}
        stroke="#1a1a1a"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
      <circle cx={cx} cy={cy} r={rx * 0.55} fill="#1a1a1a" />
      <circle cx={cx - rx * 0.3} cy={cy - ry * 0.3} r={rx * 0.25} fill="#fff" />
    </g>
  );
}

/* Recursive bone group renderer */
function BoneGroup({
  boneId,
  tree,
  parts,
  angles,
  colors,
  faceImageUrl,
  faceExpression,
  eyeOpen,
  faceGeometry,
}: {
  boneId: string;
  tree: Map<string, { bone: BoneDef; children: string[] }>;
  parts: PuppetPart[];
  angles: Record<string, number>;
  colors: Record<string, string>;
  faceImageUrl?: string | null;
  faceExpression?: FaceExpression;
  eyeOpen?: boolean;
  faceGeometry?: FaceGeometry;
}) {
  const node = tree.get(boneId);
  if (!node) return null;

  const angle = angles[boneId] ?? node.bone.defaultRotation;
  const { offsetX, offsetY } = node.bone;

  // Parts attached to this bone
  const myParts = parts.filter(p => p.boneId === boneId);

  // Check if this is the head bone and we have a face image
  const isHead = boneId === 'head';

  return (
    <g transform={`translate(${offsetX}, ${offsetY}) rotate(${angle})`}>
      {/* Render parts for this bone */}
      {myParts.map(part => renderPart(part, colors))}

      {/* Dynamic face rigging on head */}
      {isHead && faceGeometry && (
        <g>
          {/* Dynamic eyebrows */}
          {renderEyebrow(faceGeometry.leftEyebrow.x1, faceGeometry.leftEyebrow.y1, faceGeometry.leftEyebrow.x2, faceGeometry.leftEyebrow.y2, faceExpression ?? 'neutral', true)}
          {renderEyebrow(faceGeometry.rightEyebrow.x1, faceGeometry.rightEyebrow.y1, faceGeometry.rightEyebrow.x2, faceGeometry.rightEyebrow.y2, faceExpression ?? 'neutral', false)}
          {/* Dynamic eyes */}
          {renderEye(faceGeometry.leftEye.cx, faceGeometry.leftEye.cy, faceGeometry.leftEye.rx, faceGeometry.leftEye.ry, eyeOpen ?? true)}
          {renderEye(faceGeometry.rightEye.cx, faceGeometry.rightEye.cy, faceGeometry.rightEye.rx, faceGeometry.rightEye.ry, eyeOpen ?? true)}
          {/* Dynamic mouth */}
          {renderMouth(faceGeometry.mouth.cx, faceGeometry.mouth.cy, faceGeometry.mouth.width, faceExpression ?? 'neutral')}
        </g>
      )}

      {/* Recursively render children */}
      {node.children.map(childId => (
        <BoneGroup
          key={childId}
          boneId={childId}
          tree={tree}
          parts={parts}
          angles={angles}
          colors={colors}
          faceImageUrl={faceImageUrl}
          faceExpression={faceExpression}
          eyeOpen={eyeOpen}
          faceGeometry={faceGeometry}
        />
      ))}
    </g>
  );
}

/* Bone overlay: joint circles + connecting lines */
function BoneOverlay({
  bones,
  angles,
  selectedBoneId,
  onBoneClick,
}: {
  bones: BoneDef[];
  angles: Record<string, number>;
  selectedBoneId?: string | null;
  onBoneClick?: (boneId: string) => void;
}) {
  const positions = useMemo(() => computeJointPositions(bones, angles), [bones, angles]);

  return (
    <g>
      {/* Connecting lines */}
      {Array.from(positions.entries()).map(([boneId, pos]) => {
        if (pos.parentX === undefined || pos.parentY === undefined) return null;
        return (
          <line
            key={`line-${boneId}`}
            x1={pos.parentX}
            y1={pos.parentY}
            x2={pos.x}
            y2={pos.y}
            stroke={selectedBoneId === boneId ? '#6366f1' : '#94a3b8'}
            strokeWidth={selectedBoneId === boneId ? 2.5 : 1.5}
            strokeDasharray={selectedBoneId === boneId ? undefined : '4 2'}
            opacity={0.8}
          />
        );
      })}
      {/* Joint circles */}
      {Array.from(positions.entries()).map(([boneId, pos]) => {
        const isSelected = selectedBoneId === boneId;
        return (
          <g key={`joint-${boneId}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 8 : 5}
              fill={isSelected ? '#6366f1' : '#e2e8f0'}
              stroke={isSelected ? '#fff' : '#64748b'}
              strokeWidth={isSelected ? 2 : 1}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onBoneClick?.(boneId);
              }}
            />
            {isSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={14}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.6}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function PuppetCanvas({
  puppet,
  colors,
  faceImageUrl,
  boneAngles,
  faceExpression,
  eyeOpen,
  width = 100,
  height = 175,
  className = '',
  showBones,
  selectedBoneId,
  onBoneClick,
  editableAngles,
  spriteUrl,
}: PuppetCanvasProps) {
  const tree = useMemo(() => buildBoneTree(puppet.bones), [puppet.bones]);

  // Find root bone(s)
  const rootBones = puppet.bones.filter(b => b.parent === null);

  // Center offset: puppet viewBox is 200x350, we want to center it
  const scaleX = width / puppet.width;
  const scaleY = height / puppet.height;
  const scale = Math.min(scaleX, scaleY);

  // Use editable angles when in bone edit mode, otherwise use passed boneAngles
  const activeAngles = editableAngles ?? boneAngles;

  return (
    <svg
      viewBox={puppet.viewBox}
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      style={{ display: 'block' }}
      onClick={() => {
        if (showBones) onBoneClick?.('');
      }}
    >
      {spriteUrl ? (
        <image
          href={spriteUrl}
          x="0"
          y="0"
          width={puppet.width}
          height={puppet.height}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <>
          {/* Shadow ellipse under feet */}
          <ellipse cx="100" cy="340" rx="35" ry="8" fill="rgba(0,0,0,0.15)" />

          {/* Root wrapper positioned at hip center */}
          <g transform={`translate(100, 250)`}>
            {rootBones.map(root => (
              <BoneGroup
                key={root.id}
                boneId={root.id}
                tree={tree}
                parts={puppet.parts}
                angles={activeAngles}
                colors={colors}
                faceImageUrl={faceImageUrl}
                faceExpression={faceExpression}
                eyeOpen={eyeOpen}
                faceGeometry={puppet.faceGeometry}
              />
            ))}
          </g>
        </>
      )}

      {/* Bone overlay on top */}
      {showBones && !spriteUrl && (
        <BoneOverlay
          bones={puppet.bones}
          angles={activeAngles}
          selectedBoneId={selectedBoneId}
          onBoneClick={onBoneClick}
        />
      )}
    </svg>
  );
}
