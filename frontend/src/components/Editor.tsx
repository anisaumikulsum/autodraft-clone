import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, FileText, Users, Layers, Play, Pause, Wand2, Sparkles,
  Download, Trash2, Plus, LogOut, SkipBack, SkipForward, Rewind, FastForward,
  FlipHorizontal, Route, Gauge, Image, Mic, Box,
  Eye, EyeOff, X, Check, Palette, Undo2, Redo2, Copy, Camera
} from 'lucide-react';
import * as api from '../lib/api';
import {
  Project, Scene, Character, bodyTemplates, motionPresets, backgrounds,
  generateId, createCharacter, createScene
} from '../stores';
import {
  getPuppetTemplate, puppetMotionPresets, getMotionPreset,
  computeBoneAngles, textToVisemes, getVisemeAtTime, isEyeOpenAtTime,
  interpolateKeyframe,
  type FaceExpression, type MotionPreset
} from '../stores/puppets';
import PuppetCanvas from './PuppetCanvas';
import ExportModal from './ExportModal';

/* ─── Types ─── */
type LeftTool = 'scenes' | 'characters' | 'assets' | 'script' | 'export';
type RightTab = 'scene' | 'animate' | 'layers' | 'audio';

/* ─── Editor Shell ─── */
export default function Editor({
  project, user, onUpdate, onBack, onLogin, onLogout
}: {
  project: Project; user: any;
  onUpdate: (p: Project) => void; onBack: () => void;
  onLogin: () => void; onLogout: () => void;
}) {
  const [projectState, setProjectState] = useState<Project>(project);
  const [generating, setGenerating] = useState(false);

  /* layout */
  const [leftTool, setLeftTool] = useState<LeftTool>('scenes');
  const [rightTab, setRightTab] = useState<RightTab>('scene');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(project.scenes[0]?.id ?? null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playSceneIndex, setPlaySceneIndex] = useState<number>(-1);
  const timerRef = useRef<number | null>(null);

  /* bone editor */
  const [customMotions, setCustomMotions] = useState<MotionPreset[]>([]);
  const [boneEditMode, setBoneEditMode] = useState(false);
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);
  const [editableAngles, setEditableAngles] = useState<Record<string, number>>({});
  const [keyframes, setKeyframes] = useState<Record<number, Record<string, number>>>({});
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [recorderFrame, setRecorderFrame] = useState(0);
  const previewRafRef = useRef<number | null>(null);
  const [customDurationSec, setCustomDurationSec] = useState(2);
  const [customFps, setCustomFps] = useState(8);
  const [customLoop, setCustomLoop] = useState(true);
  const [customMotionName, setCustomMotionName] = useState('');
  const [savingMotion, setSavingMotion] = useState(false);

  /* drag & drop canvas positioning */
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const projectRef = useRef(projectState);
  useEffect(() => { projectRef.current = projectState; }, [projectState]);
  const dragRef = useRef<{
    layerId: string;
    startMouseX: number;
    startMouseY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const clickSuppressRef = useRef(false);

  /* debounced auto-save */
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, []);
  function scheduleSave(next: Project) {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => onUpdate(next), 500);
  }

  /* timeline scene drag reorder */
  const [dragSceneIndex, setDragSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  /* export modal */
  const [showExportModal, setShowExportModal] = useState(false);

  /* path drawing */
  const [pathMode, setPathMode] = useState(false);
  const [pathPoints, setPathPoints] = useState<{x:number;y:number}[]>([]);

  /* undo / redo history */
  const MAX_HISTORY = 50;
  const historyRef = useRef<{ project: Project; sceneId: string | null; layerId: string | null }[]>([
    { project: JSON.parse(JSON.stringify(project)), sceneId: project.scenes[0]?.id ?? null, layerId: null }
  ]);
  const historyIndexRef = useRef(0);
  const skipHistoryRef = useRef(false);

  function pushHistory(nextProject: Project, nextSceneId: string | null = selectedSceneId, nextLayerId: string | null = selectedLayerId) {
    if (skipHistoryRef.current) return;
    // Trim redo branch
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({
      project: JSON.parse(JSON.stringify(nextProject)),
      sceneId: nextSceneId,
      layerId: nextLayerId,
    });
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }

  function undo() {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setProjectState(JSON.parse(JSON.stringify(entry.project)));
    setSelectedSceneId(entry.sceneId);
    setSelectedLayerId(entry.layerId);
    setTimeout(() => (skipHistoryRef.current = false), 0);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    skipHistoryRef.current = true;
    setProjectState(JSON.parse(JSON.stringify(entry.project)));
    setSelectedSceneId(entry.sceneId);
    setSelectedLayerId(entry.layerId);
    setTimeout(() => (skipHistoryRef.current = false), 0);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) redo();
          else undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* fetch custom motions */
  useEffect(() => {
    if (user) {
      api.getCustomMotions().then((motions: MotionPreset[]) => setCustomMotions(motions)).catch(() => {});
    }
  }, [user]);

  const scene = projectState.scenes.find(s => s.id === selectedSceneId);
  const selectedLayer = scene?.layers.find(l => l.id === selectedLayerId);
  const selectedChar = selectedLayer?.type === 'character'
    ? projectState.characters.find(c => c.id === selectedLayer.refId)
    : undefined;

  const update = (partial: Partial<Project>, shouldPushHistory = true) => {
    const next = { ...projectState, ...partial };
    setProjectState(next);
    scheduleSave(next);
    if (shouldPushHistory) pushHistory(next);
  };

  const updateScene = (sid: string, patch: Partial<Scene>, shouldPushHistory = true) => {
    const nextScenes = projectState.scenes.map(s => s.id === sid ? { ...s, ...patch } : s);
    const next = { ...projectState, scenes: nextScenes };
    setProjectState(next);
    scheduleSave(next);
    if (shouldPushHistory) pushHistory(next);
  };

  const reorderScenes = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const scenes = [...projectState.scenes];
    const [removed] = scenes.splice(fromIndex, 1);
    scenes.splice(toIndex, 0, removed);
    const renumbered = scenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
    const next = { ...projectState, scenes: renumbered };
    setProjectState(next);
    scheduleSave(next);
    pushHistory(next);
  };

  /* drag helpers */
  const startDrag = (layerId: string, e: React.MouseEvent) => {
    if (playing) return;
    const s = scene;
    if (!s) return;
    const layer = s.layers.find(l => l.id === layerId);
    if (!layer || layer.type !== 'character') return;
    e.preventDefault();
    dragRef.current = {
      layerId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    };
    setSelectedLayerId(layerId);
    setRightTab('animate');
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startMouseX;
      const dy = e.clientY - d.startMouseY;
      const nextX = Math.max(0, Math.min(720, d.origX + dx));
      const nextY = Math.max(0, Math.min(400, d.origY + dy));
      setProjectState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s =>
          s.id === selectedSceneId
            ? {
                ...s,
                layers: s.layers.map(l =>
                  l.id === d.layerId ? { ...l, x: nextX, y: nextY } : l
                ),
              }
            : s
        ),
      }));
    };
    const onUp = () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;
      clickSuppressRef.current = true;
      setTimeout(() => (clickSuppressRef.current = false), 50);
      const latest = projectRef.current;
      const s = latest.scenes.find(sc => sc.id === selectedSceneId);
      const layer = s?.layers.find(l => l.id === d.layerId);
      if (!layer) return;
      const next = {
        ...latest,
        scenes: latest.scenes.map(sc =>
          sc.id === selectedSceneId
            ? { ...sc, layers: sc.layers.map(l => l.id === d.layerId ? { ...l, x: layer.x, y: layer.y } : l) }
            : sc
        ),
      };
      pushHistory(next, selectedSceneId, d.layerId);
      scheduleSave(next);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [selectedSceneId, onUpdate]);

  /* scene ops */
  const addScene = () => {
    const num = projectState.scenes.length + 1;
    const s = createScene(projectState.id, num);
    const bg = backgrounds[num % backgrounds.length];
    s.backgroundUrl = bg?.imageUrl ?? null;
    s.setting = bg?.name ?? 'bedroom_day';
    update({ scenes: [...projectState.scenes, s], totalScenes: num });
    setSelectedSceneId(s.id);
  };

  const deleteScene = (sid: string) => {
    const filtered = projectState.scenes.filter(s => s.id !== sid);
    update({
      scenes: filtered.map((s, i) => ({ ...s, sceneNumber: i + 1 })),
      totalScenes: filtered.length
    });
    if (selectedSceneId === sid) setSelectedSceneId(filtered[0]?.id ?? null);
  };

  const duplicateScene = (sid: string) => {
    const idx = projectState.scenes.findIndex(s => s.id === sid);
    if (idx < 0) return;
    const orig = projectState.scenes[idx];
    const dup = createScene(projectState.id, orig.sceneNumber + 1);
    dup.setting = orig.setting;
    dup.description = orig.description;
    dup.mood = orig.mood;
    dup.durationSec = orig.durationSec;
    dup.backgroundUrl = orig.backgroundUrl;
    dup.dialogText = orig.dialogText;
    dup.voiceUrl = orig.voiceUrl;
    dup.voiceStyle = orig.voiceStyle;
    dup.camera = orig.camera;
    dup.layers = orig.layers.map(l => ({
      ...l,
      id: generateId(),
      pathData: l.pathData,
    }));
    const next = [...projectState.scenes];
    next.splice(idx + 1, 0, dup);
    update({
      scenes: next.map((s, i) => ({ ...s, sceneNumber: i + 1 })),
      totalScenes: next.length,
    });
    setSelectedSceneId(dup.id);
  };

  const addCharToScene = (sid: string, charId: string) => {
    const s = projectState.scenes.find(sc => sc.id === sid);
    if (!s) return;
    const newLayer = {
      id: generateId(), type: 'character' as const, refId: charId,
      x: 100 + s.layers.filter(l => l.type === 'character').length * 180,
      y: 200, scale: 1, zIndex: 10, motionPresetId: motionPresets[0].id
    };
    updateScene(sid, { layers: [...s.layers, newLayer] });
    setSelectedLayerId(newLayer.id);
    setRightTab('animate');
  };

  /* character ops */
  const [charPickerOpen, setCharPickerOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharTemplate, setNewCharTemplate] = useState<string | null>(null);
  const [charGenerating, setCharGenerating] = useState<string | null>(null);

  const addCharacter = async () => {
    if (!newCharTemplate || !newCharName.trim()) return;
    const c = createCharacter(projectState.id, newCharTemplate, newCharName);
    try {
      const saved = await api.createCharacterManual(projectState.id, c.name, c.bodyTemplateId, c.faceImageUrl || undefined);
      update({ characters: [...projectState.characters, { ...c, id: saved.id || c.id }] });
    } catch {
      update({ characters: [...projectState.characters, c] });
    }
    setNewCharName('');
    setNewCharTemplate(null);
    setCharPickerOpen(false);
  };

  const removeCharacter = async (id: string) => {
    // Optimistic UI update
    update({ characters: projectState.characters.filter(c => c.id !== id) });
    // also remove from all scenes
    update({
      scenes: projectState.scenes.map(s => ({
        ...s,
        layers: s.layers.filter(l => !(l.type === 'character' && l.refId === id))
      }))
    });
    try {
      await api.deleteCharacter(projectState.id, id);
    } catch (e: any) {
      console.error('Failed to delete character:', e.message);
    }
  };

  const generateFace = async (char: Character) => {
    if (!user) { onLogin(); return; }
    setCharGenerating(char.id);
    try {
      await api.generateCharacter(projectState.id, char.name, char.bodyTemplateId, char.description || undefined);
      alert(`AI generation queued for ${char.name}!`);
    } catch (e: any) { alert(e.message); }
    finally { setCharGenerating(null); }
  };

  /* script */
  const [scriptDraft, setScriptDraft] = useState(projectState.scriptText || '');
  const handleBreakdown = async () => {
    if (!user) { onLogin(); return; }
    if (!scriptDraft.trim()) return;
    setGenerating(true);
    try {
      await api.generateScriptBreakdown(projectState.id, scriptDraft);
      alert('Script breakdown queued! Scenes will appear shortly.');
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(false); }
  };

  /* export */
  const handleExport = () => {
    if (!user) { onLogin(); return; }
    setShowExportModal(true);
  };

  /* playback */
  const totalDuration = projectState.scenes.reduce((a, s) => a + s.durationSec, 0);

  const playAll = useCallback(() => {
    if (projectState.scenes.length === 0) return;
    setPlaying(true);
    setPlaySceneIndex(0);
    setSelectedSceneId(projectState.scenes[0].id);
    let idx = 0;
    const run = () => {
      if (idx >= projectState.scenes.length) {
        setPlaying(false);
        setPlaySceneIndex(-1);
        return;
      }
      setSelectedSceneId(projectState.scenes[idx].id);
      setPlaySceneIndex(idx);
      const dur = projectState.scenes[idx].durationSec * 1000;
      idx++;
      timerRef.current = window.setTimeout(run, dur);
    };
    run();
  }, [projectState.scenes]);

  const stopPlayback = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setPlaying(false);
    setPlaySceneIndex(-1);
  };

  /* ─── Bone animation state ─── */
  const [boneAngles, setBoneAngles] = useState<Record<string, number>>({});
  const rafRef = useRef<number | null>(null);
  const animStartRef = useRef<number>(0);
  /* path-following positions during playback */
  const [pathPositions, setPathPositions] = useState<Record<string, { x: number; y: number }>>({});
  /* face rigging — per-layer state computed in rAF, stored in ref */
  const faceStatesRef = useRef<Record<string, { expression: FaceExpression; eyeOpen: boolean }>>({});

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ─── Face expression from motion preset ─── */
  function expressionFromPreset(presetId: string): FaceExpression {
    switch (presetId) {
      case 'm_talk': return 'neutral';
      case 'm_eating': return 'a';
      case 'm_happy':
      case 'm_laugh':
      case 'm_waving': return 'smile';
      case 'm_sad':
      case 'm_cry': return 'frown';
      case 'm_angry': return 'angry';
      case 'm_shocked': return 'surprise';
      default: return 'neutral';
    }
  }


  function getSpriteUrl(char: Character | undefined, motionPresetId: string | undefined): string | null {
    if (!char?.spriteSet) return null;
    const preset = motionPresets.find(m => m.id === motionPresetId);
    if (!preset?.spriteKey) return null;
    return char.spriteSet[preset.spriteKey] || null;
  }

  function getPathPosition(pathData: string, progress: number): { x: number; y: number } {
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', pathData);
    const len = pathEl.getTotalLength();
    const p = pathEl.getPointAtLength(Math.max(0, Math.min(1, progress)) * len);
    return { x: p.x, y: p.y };
  }

  /* ─── Bone & face animation loop ─── */
  const startBoneAnimation = useCallback((presetId: string, startTime: number) => {
    const preset = getMotionPreset(presetId);
    if (!preset) return;

    const loop = (now: number) => {
      const elapsed = now - startTime;
      const angles = computeBoneAngles(preset, elapsed, true);
      setBoneAngles(angles);

      /* face states for ALL character layers */
      const nextFaces: Record<string, { expression: FaceExpression; eyeOpen: boolean }> = {};
      if (scene) {
        for (const layer of scene.layers) {
          if (layer.type !== 'character' || layer.visible === false) continue;
          const layerPreset = layer.motionPresetId || '';
          let expr: FaceExpression = expressionFromPreset(layerPreset);
          // Lip-sync when talking and scene has dialogue
          if (layerPreset === 'm_talk' && scene.dialogText) {
            const visemes = textToVisemes(scene.dialogText);
            expr = getVisemeAtTime(visemes, scene.durationSec, elapsed, true);
          }
          nextFaces[layer.id] = {
            expression: expr,
            eyeOpen: isEyeOpenAtTime(layer.id, elapsed),
          };
        }
      }
      faceStatesRef.current = nextFaces;

      /* path-following for each character layer with a path */
      if (scene) {
        const nextPos: Record<string, { x: number; y: number }> = {};
        const durMs = (scene.durationSec || 1) * 1000;
        const progress = Math.min(1, Math.max(0, elapsed / durMs));
        for (const layer of scene.layers) {
          if (layer.type === 'character' && layer.pathData) {
            nextPos[layer.id] = getPathPosition(layer.pathData, progress);
          }
        }
        if (Object.keys(nextPos).length > 0) {
          setPathPositions(nextPos);
        }
      }
      if (playing) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [playing, scene]);

  useEffect(() => {
    if (playing && scene) {
      const layer = scene.layers.find(l => l.type === 'character');
      if (layer?.motionPresetId) {
        animStartRef.current = performance.now();
        startBoneAnimation(layer.motionPresetId, animStartRef.current);
      }
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setBoneAngles({});
      setPathPositions({});
      faceStatesRef.current = {};
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, scene, startBoneAnimation]);

  /* ─── Render ─── */
  return (
    <div className="h-screen flex flex-col bg-surface-0 text-white select-none overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="h-11 bg-surface-100 border-b border-surface-300 flex items-center px-3 gap-3 shrink-0 z-20">
        <button onClick={onBack} className="p-1.5 hover:bg-surface-200 rounded-md transition" title="Dashboard">
          <ChevronLeft size={16} className="text-surface-400" />
        </button>
        <div className="w-px h-5 bg-surface-300" />
        <input
          type="text"
          value={projectState.title}
          onChange={e => update({ title: e.target.value })}
          className="bg-transparent text-sm font-medium outline-none w-48 text-white placeholder-surface-600"
          placeholder="Untitled Project"
        />
        <div className="flex-1" />
        <span className="text-[10px] text-surface-600 bg-surface-200 px-1.5 py-0.5 rounded">16:9</span>
        <button
          onClick={() => update({ status: projectState.status === 'draft' ? 'saved' : 'draft' })}
          className="text-xs bg-surface-200 hover:bg-surface-300 text-surface-300 px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
        >
          <Check size={12} /> Save
        </button>
        <button
          onClick={handleExport}
          disabled={generating}
          className="text-xs bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
        >
          <Download size={12} /> {generating ? '...' : 'Download'}
        </button>
        {user && (
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <Sparkles size={12} className="text-brand-400" />
            <span>{user.credits} cr</span>
          </div>
        )}
        <div className="w-px h-5 bg-surface-300" />
        <button onClick={onLogout} className="p-1.5 hover:bg-surface-200 rounded-md transition" title="Logout">
          <LogOut size={14} className="text-surface-500" />
        </button>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-14 bg-surface-100 border-r border-surface-300 flex flex-col items-center py-2 gap-1 shrink-0 z-10">
          <ToolBtn icon={Layers} label="Scenes" active={leftTool === 'scenes'} onClick={() => setLeftTool('scenes')} />
          <ToolBtn icon={Users} label="Chars" active={leftTool === 'characters'} onClick={() => setLeftTool('characters')} />
          <ToolBtn icon={Image} label="Assets" active={leftTool === 'assets'} onClick={() => setLeftTool('assets')} />
          <ToolBtn icon={FileText} label="Script" active={leftTool === 'script'} onClick={() => { setLeftTool('script'); setShowScriptModal(true); }} />
          <div className="flex-1" />
          <ToolBtn icon={Sparkles} label="Export" active={false} onClick={handleExport} disabled={generating} />
        </aside>

        {/* Left Panel (expandable based on tool) */}
        {leftTool !== 'script' && leftTool !== 'export' && (
          <aside className="w-56 bg-surface-100 border-r border-surface-300 flex flex-col shrink-0 z-10">
            {leftTool === 'scenes' && (
              <>
                <div className="px-3 py-2 border-b border-surface-300 flex items-center justify-between">
                  <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Scenes</span>
                  <button onClick={addScene} className="p-1 hover:bg-surface-200 rounded transition"><Plus size={14} className="text-surface-400" /></button>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                  {projectState.scenes.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSceneId(s.id); stopPlayback(); }}
                      className={`w-full text-left rounded-lg overflow-hidden transition group ${selectedSceneId === s.id ? 'ring-1 ring-brand-500' : 'hover:bg-surface-200'}`}
                    >
                      <div className="h-16 bg-surface-200 relative">
                        {s.backgroundUrl ? (
                          <img src={s.backgroundUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" alt="" />
                        ) : <div className="w-full h-full bg-surface-300" />}
                        {playSceneIndex === i && playing && (
                          <div className="absolute inset-0 bg-brand-600/20 flex items-center justify-center">
                            <Play size={16} className="text-brand-400" />
                          </div>
                        )}
                        <div className="absolute top-1 left-2 text-[10px] font-bold bg-black/60 px-1 rounded">{i + 1}</div>
                        <button
                          onClick={e => { e.stopPropagation(); duplicateScene(s.id); }}
                          className="absolute top-1 right-1 p-1 rounded bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition"
                          title="Duplicate scene"
                        >
                          <Copy size={10} />
                        </button>
                        <div className="absolute bottom-1 right-2 text-[10px] text-white/70 bg-black/40 px-1 rounded">{s.durationSec}s</div>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="text-[11px] font-medium truncate">{s.dialogText || `Scene ${i + 1}`}</div>
                        <div className="text-[10px] text-surface-600 truncate">{s.setting}</div>
                      </div>
                    </button>
                  ))}
                  {projectState.scenes.length === 0 && (
                    <div className="p-4 text-center text-xs text-surface-600">No scenes yet.<br/>Write a script or add manually.</div>
                  )}
                </div>
              </>
            )}
            {leftTool === 'characters' && (
              <>
                <div className="px-3 py-2 border-b border-surface-300 flex items-center justify-between">
                  <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Characters</span>
                  <button onClick={() => setCharPickerOpen(!charPickerOpen)} className="p-1 hover:bg-surface-200 rounded transition"><Plus size={14} className="text-surface-400" /></button>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                  {charPickerOpen && (
                    <div className="bg-surface-200 rounded-lg p-2 mb-2 space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        {bodyTemplates.map(bt => (
                          <button
                            key={bt.id}
                            onClick={() => setNewCharTemplate(bt.id)}
                            className={`p-1 rounded border text-center transition ${newCharTemplate === bt.id ? 'border-brand-500 bg-brand-600/10' : 'border-surface-400 hover:border-surface-500'}`}
                          >
                            <img src={bt.thumbnailUrl} alt="" className="w-8 h-8 mx-auto rounded-full bg-surface-300" />
                            <div className="text-[9px] mt-0.5 truncate">{bt.displayName}</div>
                          </button>
                        ))}
                      </div>
                      <input
                        type="text" value={newCharName}
                        onChange={e => setNewCharName(e.target.value)}
                        placeholder="Name..."
                        className="w-full bg-surface-300 border border-surface-400 rounded px-2 py-1 text-xs outline-none"
                      />
                      <div className="flex gap-1">
                        <button onClick={addCharacter} disabled={!newCharTemplate || !newCharName.trim()} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs py-1 rounded transition">Create</button>
                        <button onClick={() => setCharPickerOpen(false)} className="flex-1 text-xs text-surface-500 hover:text-surface-300 py-1">Cancel</button>
                      </div>
                    </div>
                  )}
                  {projectState.characters.map(c => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-200 transition group">
                      <img src={c.faceImageUrl || ''} alt="" className="w-8 h-8 rounded-full bg-surface-300 object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{c.name}</div>
                        <div className="text-[10px] text-surface-600">{bodyTemplates.find(b => b.id === c.bodyTemplateId)?.displayName}</div>
                      </div>
                      <button onClick={() => generateFace(c)} disabled={charGenerating === c.id} className="text-brand-400 hover:text-brand-300 opacity-0 group-hover:opacity-100 transition">
                        <Sparkles size={12} />
                      </button>
                      <button onClick={() => removeCharacter(c.id)} className="text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {leftTool === 'assets' && (
              <>
                <div className="px-3 py-2 border-b border-surface-300">
                  <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Backgrounds</span>
                </div>
                <div className="flex-1 overflow-auto p-2 grid grid-cols-2 gap-1">
                  {backgrounds.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        if (scene) updateScene(scene.id, { backgroundUrl: bg.imageUrl, setting: bg.name });
                      }}
                      className={`relative rounded-lg overflow-hidden border transition ${scene?.setting === bg.name ? 'ring-1 ring-brand-500 border-brand-500' : 'border-surface-300 hover:border-surface-500'}`}
                    >
                      <img src={bg.imageUrl} className="w-full h-16 object-cover" alt="" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate">{bg.name}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </aside>
        )}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Floating Toolbar */}
          <div className="h-9 bg-surface-100 border-b border-surface-300 flex items-center px-2 gap-0.5 shrink-0">
            <TbBtn icon={Undo2} label="Undo" onClick={undo} />
            <TbBtn icon={Redo2} label="Redo" onClick={redo} />
            <div className="w-px h-4 bg-surface-300 mx-1" />
            <TbBtn icon={FlipHorizontal} label="Flip" />
            <TbBtn icon={Route} label="Path" active={pathMode} onClick={() => { setPathMode(v => !v); setPathPoints([]); }} />
            <TbBtn icon={Gauge} label="Speed" />
            <TbBtn icon={Sparkles} label="AI Animate" />
            <TbBtn icon={Box} label="Props" />
            <div className="flex-1" />
            {selectedLayer && (
              <button
                onClick={() => {
                  if (!scene) return;
                  updateScene(scene.id, { layers: scene.layers.filter(l => l.id !== selectedLayer.id) });
                  setSelectedLayerId(null);
                }}
                className="px-2 py-1 text-[10px] hover:bg-surface-200 rounded text-red-400 flex items-center gap-1 transition"
              >
                <Trash2 size={10} /> Delete
              </button>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-surface-0 flex items-center justify-center p-4 relative overflow-hidden">
            {scene ? (
              <div
                ref={canvasRef}
                className={`relative bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-surface-300 ${pathMode ? 'cursor-crosshair' : ''}`}
                style={{ aspectRatio: '16/9', maxHeight: '100%', maxWidth: '100%', width: '100%' }}
                onClick={e => {
                  if (pathMode && selectedLayer?.type === 'character') {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    if (pathPoints.length === 0) {
                      setPathPoints([{ x, y }]);
                    } else {
                      setPathPoints(prev => [...prev, { x, y }]);
                    }
                    return;
                  }
                  setSelectedLayerId(null);
                }}
                onDoubleClick={() => {
                  if (pathMode && selectedLayer?.type === 'character' && pathPoints.length >= 2) {
                    const d = pathPoints.reduce((acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`), '');
                    updateScene(scene.id, {
                      layers: scene.layers.map(l =>
                        l.id === selectedLayer.id ? { ...l, pathData: d } : l
                      ),
                    });
                    setPathPoints([]);
                    setPathMode(false);
                  }
                }}
              >
                {/* Camera-transformed scene content */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${(scene.camera?.panX || 0)}px, ${(scene.camera?.panY || 0)}px) rotate(${(scene.camera?.rotation || 0)}deg) scale(${(scene.camera?.zoom || 1)})`,
                    transformOrigin: 'center center',
                  }}
                >
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: scene.backgroundUrl ? `url(${scene.backgroundUrl})` : undefined,
                    backgroundColor: !scene.backgroundUrl ? '#1a1a1a' : undefined
                  }}
                />

                {/* Render stored paths for character layers */}
                {scene.layers.filter(l => l.type === 'character' && l.pathData && l.visible !== false).map(layer => (
                  <svg key={`path-${layer.id}`} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                    <path d={layer.pathData} fill="none" stroke="rgba(37,99,235,0.6)" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                ))}

                {/* Path preview while drawing */}
                {pathMode && pathPoints.length > 0 && (
                  <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                    <path
                      d={pathPoints.reduce((acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`), '')}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    {pathPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb" />
                    ))}
                  </svg>
                )}

                {/* Character Puppet Layers */}
                {scene.layers.filter(l => l.type === 'character' && l.visible !== false).map(layer => {
                  const ch = projectState.characters.find(c => c.id === layer.refId);
                  const isSel = selectedLayerId === layer.id;
                  const isDragging = dragRef.current?.layerId === layer.id;
                  const puppet = getPuppetTemplate(ch?.bodyTemplateId || 't2');
                  const colors = { ...puppet?.defaultColors, ...ch?.customColors };
                  /* Playback position: path-following > walk tween > static */
                  const pathPos = playing ? pathPositions[layer.id] : null;
                  const isMoving = playing && layer.motionPresetId === 'm_walk' && !layer.pathData;
                  const tweenX = isMoving ? Math.min(layer.x + (scene.durationSec * 15), 560) : layer.x;
                  const displayX = pathPos ? pathPos.x : tweenX;
                  const displayY = pathPos ? pathPos.y : layer.y;
                  return (
                    <div
                      key={layer.id}
                      className={`absolute flex flex-col items-center select-none ${isSel ? 'ring-2 ring-brand-500 rounded-lg' : ''} ${isDragging ? 'cursor-grabbing' : (pathMode ? '' : 'cursor-grab')}`}
                      style={{ left: displayX, top: displayY, transform: `scale(${layer.scale})`, zIndex: layer.zIndex, transition: isMoving ? `left ${scene.durationSec}s linear` : 'none', opacity: isDragging ? 0.9 : 1 }}
                      onMouseDown={e => {
                        if (pathMode) return;
                        startDrag(layer.id, e);
                      }}
                      onClick={e => {
                        if (clickSuppressRef.current) return;
                        if (pathMode) {
                          e.stopPropagation();
                          setSelectedLayerId(layer.id);
                          return;
                        }
                        e.stopPropagation();
                        setSelectedLayerId(layer.id);
                        setRightTab('animate');
                      }}
                    >
                      {puppet && (
                        <PuppetCanvas
                          puppet={puppet}
                          colors={colors}
                          faceImageUrl={ch?.faceImageUrl}
                          boneAngles={boneAngles}
                          faceExpression={
                            playing
                              ? faceStatesRef.current[layer.id]?.expression || expressionFromPreset(layer.motionPresetId || '')
                              : expressionFromPreset(layer.motionPresetId || '')
                          }
                          eyeOpen={
                            playing
                              ? (faceStatesRef.current[layer.id]?.eyeOpen ?? true)
                              : true
                          }
                          spriteUrl={getSpriteUrl(ch, layer.motionPresetId)}
                          width={80}
                          height={140}
                        />
                      )}
                      <div className="text-xs font-medium bg-black/60 text-white px-2 py-0.5 rounded mt-1">{ch?.name}</div>
                    </div>
                  );
                })}

                {/* Dialogue Overlay */}
                {scene.dialogText && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-3 text-center">
                    <p className="text-sm text-white/90 italic" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{scene.dialogText}</p>
                  </div>
                )}

                {/* Scene badge */}
                <div className="absolute top-2 left-2 bg-black/50 text-white/60 text-[10px] px-2 py-0.5 rounded">
                  Scene {scene.sceneNumber} · {scene.durationSec}s
                </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-surface-600">
                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select or create a scene</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-64 bg-surface-100 border-l border-surface-300 flex flex-col shrink-0 z-10">
          {/* Tabs */}
          <div className="flex border-b border-surface-300">
            {[
              { id: 'scene' as RightTab, label: 'Scene' },
              { id: 'animate' as RightTab, label: 'Animate' },
              { id: 'layers' as RightTab, label: 'Layers' },
              { id: 'audio' as RightTab, label: 'Audio' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition ${rightTab === t.id ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-600/5' : 'text-surface-600 hover:text-surface-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-3">
            {rightTab === 'scene' && scene && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Background</label>
                  <select
                    value={scene.setting}
                    onChange={e => {
                      const bg = backgrounds.find(b => b.name === e.target.value);
                      updateScene(scene.id, { setting: e.target.value, backgroundUrl: bg?.imageUrl ?? null });
                    }}
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded px-2 py-1.5 text-xs outline-none"
                  >
                    {backgrounds.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Mood</label>
                  <select
                    value={scene.mood}
                    onChange={e => updateScene(scene.id, { mood: e.target.value })}
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded px-2 py-1.5 text-xs outline-none capitalize"
                  >
                    {['neutral','happy','sad','angry','scary','romantic'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Duration (sec)</label>
                  <input
                    type="number" min={1} max={60} value={scene.durationSec}
                    onChange={e => updateScene(scene.id, { durationSec: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded px-2 py-1.5 text-xs text-center"
                  />
                </div>

                {/* Camera Controls */}
                {(() => {
                  const cam = { panX: 0, panY: 0, zoom: 1, rotation: 0, ...(scene.camera || {}) };
                  const setCam = (patch: Partial<typeof cam>) => updateScene(scene.id, { camera: { ...cam, ...patch } });
                  return (
                    <div>
                      <label className="text-[10px] text-surface-600 uppercase font-semibold flex items-center gap-1">
                        <Camera size={10} /> Camera
                      </label>
                      <div className="mt-1 space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-surface-500">
                            <span>Pan X</span>
                            <span>{cam.panX}px</span>
                          </div>
                          <input
                            type="range" min="-500" max="500" value={cam.panX}
                            onChange={e => setCam({ panX: parseInt(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-surface-500">
                            <span>Pan Y</span>
                            <span>{cam.panY}px</span>
                          </div>
                          <input
                            type="range" min="-500" max="500" value={cam.panY}
                            onChange={e => setCam({ panY: parseInt(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-surface-500">
                            <span>Zoom</span>
                            <span>{cam.zoom.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range" min="0.5" max="2.0" step="0.1" value={cam.zoom}
                            onChange={e => setCam({ zoom: parseFloat(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-surface-500">
                            <span>Rotation</span>
                            <span>{cam.rotation}°</span>
                          </div>
                          <input
                            type="range" min="-30" max="30" value={cam.rotation}
                            onChange={e => setCam({ rotation: parseInt(e.target.value) })}
                            className="w-full accent-brand-600"
                          />
                        </div>
                        <button
                          onClick={() => updateScene(scene.id, { camera: { panX: 0, panY: 0, zoom: 1, rotation: 0 } })}
                          className="w-full text-[10px] py-1 rounded bg-surface-200 hover:bg-surface-300 text-surface-500 transition"
                        >
                          Reset Camera
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Dialogue</label>
                  <textarea
                    value={scene.dialogText || ''}
                    onChange={e => updateScene(scene.id, { dialogText: e.target.value })}
                    placeholder="Dialogue for this scene..."
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded-lg p-2 text-xs outline-none h-20 resize-none"
                  />
                </div>
                <button
                  onClick={() => deleteScene(scene.id)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded transition"
                >
                  <Trash2 size={12} /> Delete Scene
                </button>
              </div>
            )}

            {rightTab === 'animate' && selectedLayer && selectedChar && scene && (
              <div className="space-y-3">
                {/* Puppet preview */}
                {(() => {
                  const puppet = getPuppetTemplate(selectedChar.bodyTemplateId);
                  const colors = { ...puppet?.defaultColors, ...selectedChar.customColors };
                  if (!puppet) return null;
                  const preset = getMotionPreset(selectedLayer.motionPresetId || '', customMotions);
                  const baseAngles = preset ? computeBoneAngles(preset, 0, false) : {};
                  return (
                    <div className={`flex justify-center py-2 ${boneEditMode ? 'bg-surface-200/50 rounded-lg' : ''}`}>
                      <PuppetCanvas
                        puppet={puppet}
                        colors={colors}
                        faceImageUrl={selectedChar.faceImageUrl}
                        boneAngles={baseAngles}
                        faceExpression={expressionFromPreset(selectedLayer.motionPresetId || '')}
                        eyeOpen={true}
                        spriteUrl={getSpriteUrl(selectedChar, selectedLayer.motionPresetId)}
                        width={boneEditMode ? 100 : 60}
                        height={boneEditMode ? 175 : 105}
                        showBones={boneEditMode}
                        selectedBoneId={selectedBoneId}
                        onBoneClick={(id) => setSelectedBoneId(id || null)}
                        editableAngles={boneEditMode ? editableAngles : undefined}
                      />
                    </div>
                  );
                })()}

                {/* Visibility toggle in Animate tab */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => {
                      updateScene(scene.id, {
                        layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, visible: selectedLayer.visible !== false ? false : true } : l)
                      });
                    }}
                    className="flex items-center gap-1.5 text-[10px] text-surface-500 hover:text-brand-400 transition"
                  >
                    {selectedLayer.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                    {selectedLayer.visible !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Motion</label>
                  <select
                    value={selectedLayer.motionPresetId || ''}
                    onChange={e => {
                      updateScene(scene.id, {
                        layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, motionPresetId: e.target.value } : l)
                      });
                    }}
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded px-2 py-1.5 text-xs outline-none"
                  >
                    {puppetMotionPresets.map(m => <option key={m.id} value={m.id}>{m.displayName}</option>)}
                    {customMotions.length > 0 && <option disabled>──────────</option>}
                    {customMotions.map(m => <option key={m.id} value={m.id}>✏️ {m.name || m.displayName}</option>)}
                  </select>
                </div>

                {/* Bone Edit Mode Toggle */}
                <div className="flex items-center justify-between bg-surface-200/50 rounded-lg px-2 py-1.5">
                  <span className="text-[10px] text-surface-400 font-semibold">🦴 Bone Edit Mode</span>
                  <button
                    onClick={() => {
                      const nextMode = !boneEditMode;
                      setBoneEditMode(nextMode);
                      if (nextMode) {
                        // Enter bone edit: load current preset angles as starting point
                        const preset = getMotionPreset(selectedLayer.motionPresetId || '', customMotions);
                        const base = preset ? computeBoneAngles(preset, 0, false) : {};
                        setEditableAngles(base);
                        setKeyframes({});
                        setSelectedBoneId(null);
                        setRecorderFrame(0);
                        setCustomDurationSec(preset?.durationSec || 2);
                        setCustomFps(preset?.fps || 8);
                        setCustomLoop(preset?.loop ?? true);
                        setCustomMotionName('');
                      } else {
                        // Exit bone edit
                        setSelectedBoneId(null);
                        setPreviewPlaying(false);
                        if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
                      }
                    }}
                    className={`w-8 h-4 rounded-full transition relative ${boneEditMode ? 'bg-brand-500' : 'bg-surface-500'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${boneEditMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* ── Bone Editor UI ── */}
                {boneEditMode ? (
                  <>
                    {/* Selected Bone Rotation */}
                    {selectedBoneId && (
                      <div className="bg-surface-200/50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-surface-400 font-semibold uppercase">{selectedBoneId}</span>
                          <button
                            onClick={() => {
                              const puppet = getPuppetTemplate(selectedChar.bodyTemplateId);
                              const bone = puppet?.bones.find(b => b.id === selectedBoneId);
                              setEditableAngles(prev => ({ ...prev, [selectedBoneId]: bone?.defaultRotation ?? 0 }));
                            }}
                            className="text-[10px] text-surface-500 hover:text-brand-400"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="range" min="-180" max="180"
                          value={editableAngles[selectedBoneId] ?? 0}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            setEditableAngles(prev => ({ ...prev, [selectedBoneId]: val }));
                          }}
                          className="w-full accent-brand-600"
                        />
                        <div className="text-[10px] text-surface-600 text-right">{(editableAngles[selectedBoneId] ?? 0)}°</div>
                      </div>
                    )}

                    {/* Keyframe Recorder */}
                    <div className="bg-surface-200/50 rounded-lg p-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-surface-400 font-semibold uppercase">Keyframes</span>
                        <span className="text-[10px] text-surface-500">{Object.keys(keyframes).length} recorded</span>
                      </div>

                      {/* Frame input + nav */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRecorderFrame(Math.max(0, recorderFrame - 1))}
                          className="px-1 py-0.5 rounded bg-surface-300 text-[10px] hover:bg-surface-400"
                        >-</button>
                        <input
                          type="number" min={0} max={customDurationSec * customFps}
                          value={recorderFrame}
                          onChange={e => setRecorderFrame(Math.max(0, Math.min(customDurationSec * customFps, parseInt(e.target.value) || 0)))}
                          className="w-12 bg-surface-0 border border-surface-300 rounded text-center text-[10px] py-0.5"
                        />
                        <span className="text-[10px] text-surface-500">/ {customDurationSec * customFps}</span>
                        <button
                          onClick={() => setRecorderFrame(Math.min(customDurationSec * customFps, recorderFrame + 1))}
                          className="px-1 py-0.5 rounded bg-surface-300 text-[10px] hover:bg-surface-400"
                        >+</button>
                      </div>

                      {/* Timeline dots */}
                      <div className="flex items-center gap-0.5 h-4">
                        {Array.from({ length: customDurationSec * customFps + 1 }, (_, i) => {
                          const hasKey = keyframes[i] !== undefined;
                          const isCurrent = i === recorderFrame;
                          return (
                            <button
                              key={i}
                              onClick={() => setRecorderFrame(i)}
                              className={`w-1.5 h-1.5 rounded-full transition ${hasKey ? 'bg-brand-500' : 'bg-surface-400'} ${isCurrent ? 'ring-1 ring-white scale-125' : ''}`}
                              title={`Frame ${i}${hasKey ? ' (keyframe)' : ''}`}
                            />
                          );
                        })}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (previewPlaying) {
                              setPreviewPlaying(false);
                              if (previewRafRef.current) cancelAnimationFrame(previewRafRef.current);
                            } else {
                              setPreviewPlaying(true);
                              const start = performance.now();
                              const loop = () => {
                                const elapsed = performance.now() - start;
                                const totalFrames = customDurationSec * customFps;
                                let currentFrame = (elapsed / 1000) * customFps;
                                if (customLoop) {
                                  currentFrame = currentFrame % totalFrames;
                                } else {
                                  currentFrame = Math.min(currentFrame, totalFrames);
                                  if (currentFrame >= totalFrames) {
                                    setPreviewPlaying(false);
                                    return;
                                  }
                                }
                                setRecorderFrame(Math.floor(currentFrame));
                                // Interpolate angles
                                const puppet = getPuppetTemplate(selectedChar.bodyTemplateId);
                                const angles: Record<string, number> = {};
                                for (const bone of puppet?.bones || []) {
                                  const kfs = Object.entries(keyframes)
                                    .map(([f, a]) => ({ frame: parseInt(f), rotation: a[bone.id] ?? 0 }))
                                    .filter(k => !isNaN(k.frame))
                                    .sort((a, b) => a.frame - b.frame);
                                  if (kfs.length > 0) {
                                    angles[bone.id] = interpolateKeyframe(kfs, currentFrame);
                                  }
                                }
                                setEditableAngles(angles);
                                previewRafRef.current = requestAnimationFrame(loop);
                              };
                              previewRafRef.current = requestAnimationFrame(loop);
                            }
                          }}
                          className={`flex-1 text-[10px] py-1 rounded font-medium transition ${previewPlaying ? 'bg-red-500/20 text-red-400' : 'bg-brand-600/20 text-brand-400'}`}
                        >
                          {previewPlaying ? '⏹ Stop' : '▶ Play'}
                        </button>
                        <button
                          onClick={() => {
                            setKeyframes(prev => ({ ...prev, [recorderFrame]: { ...editableAngles } }));
                          }}
                          className="flex-1 text-[10px] py-1 rounded font-medium bg-brand-600 text-white hover:bg-brand-500 transition"
                        >
                          🔴 Record
                        </button>
                        {keyframes[recorderFrame] && (
                          <button
                            onClick={() => {
                              setKeyframes(prev => {
                                const next = { ...prev };
                                delete next[recorderFrame];
                                return next;
                              });
                            }}
                            className="text-[10px] py-1 px-2 rounded text-red-400 hover:bg-red-500/10"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-surface-500">Dur (s)</label>
                        <input type="number" min={1} max={10} value={customDurationSec} onChange={e => setCustomDurationSec(parseInt(e.target.value) || 1)} className="w-full bg-surface-200 border border-surface-300 rounded text-center text-[10px] py-0.5" />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500">FPS</label>
                        <select value={customFps} onChange={e => setCustomFps(parseInt(e.target.value))} className="w-full bg-surface-200 border border-surface-300 rounded text-center text-[10px] py-0.5">
                          {[8, 12, 24].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-500">Loop</label>
                        <button onClick={() => setCustomLoop(!customLoop)} className={`w-full text-[10px] py-0.5 rounded transition ${customLoop ? 'bg-brand-600/20 text-brand-400' : 'bg-surface-300 text-surface-500'}`}>
                          {customLoop ? 'On' : 'Off'}
                        </button>
                      </div>
                    </div>

                    {/* Save */}
                    <div className="border-t border-surface-300 pt-2 space-y-1.5">
                      <input
                        type="text"
                        value={customMotionName}
                        onChange={e => setCustomMotionName(e.target.value)}
                        placeholder="Motion name..."
                        className="w-full bg-surface-200 border border-surface-300 rounded px-2 py-1 text-xs outline-none"
                      />
                      <button
                        onClick={async () => {
                          if (!customMotionName.trim() || Object.keys(keyframes).length === 0) return;
                          setSavingMotion(true);
                          try {
                            // Convert keyframes to backend format
                            const boneKeyframes: Record<string, { frame: number; rotation: number }[]> = {};
                            for (const [frameStr, angles] of Object.entries(keyframes)) {
                              for (const [boneId, rotation] of Object.entries(angles)) {
                                if (!boneKeyframes[boneId]) boneKeyframes[boneId] = [];
                                boneKeyframes[boneId].push({ frame: parseInt(frameStr), rotation });
                              }
                            }
                            for (const kfs of Object.values(boneKeyframes)) {
                              kfs.sort((a, b) => a.frame - b.frame);
                            }
                            const motion = await api.createCustomMotion({
                              name: customMotionName.trim(),
                              boneKeyframes,
                              durationSec: customDurationSec,
                              fps: customFps,
                              loop: customLoop,
                            });
                            setCustomMotions(prev => [...prev, motion]);
                            setCustomMotionName('');
                            // Auto-select the new motion for the current layer
                            updateScene(scene.id, {
                              layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, motionPresetId: motion.id } : l)
                            });
                            setBoneEditMode(false);
                          } catch (e: any) {
                            alert(e.message || 'Failed to save motion');
                          } finally {
                            setSavingMotion(false);
                          }
                        }}
                        disabled={!customMotionName.trim() || Object.keys(keyframes).length === 0 || savingMotion}
                        className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-surface-400 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 rounded transition"
                      >
                          {savingMotion ? 'Saving...' : '💾 Save Custom Motion'}
                        </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Colors */}
                    <div>
                      <label className="text-[10px] text-surface-600 uppercase font-semibold flex items-center gap-1">
                        <Palette size={10} /> Colors
                      </label>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        {['skin', 'hair', 'shirt', 'pants', 'shoes'].map(colorKey => (
                          <div key={colorKey} className="flex items-center gap-1">
                            <input
                              type="color"
                              value={selectedChar.customColors?.[colorKey] || getPuppetTemplate(selectedChar.bodyTemplateId)?.defaultColors?.[colorKey] || '#888'}
                              onChange={e => {
                                const nextColors = { ...selectedChar.customColors, [colorKey]: e.target.value };
                                const next = {
                                  ...projectState,
                                  characters: projectState.characters.map(c => c.id === selectedChar.id ? { ...c, customColors: nextColors } : c)
                                };
                                setProjectState(next);
                                scheduleSave(next);
                              }}
                              className="w-5 h-5 rounded border-none p-0 cursor-pointer"
                            />
                            <span className="text-[10px] text-surface-500 capitalize">{colorKey}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-surface-600 uppercase font-semibold">Position X</label>
                      <input
                        type="range" min="20" max="600"
                        value={selectedLayer.x}
                        onChange={e => {
                          updateScene(scene.id, {
                            layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, x: parseInt(e.target.value) } : l)
                          });
                        }}
                        className="mt-1 w-full accent-brand-600"
                      />
                      <div className="text-[10px] text-surface-600 text-right">{selectedLayer.x}px</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-surface-600 uppercase font-semibold">Position Y</label>
                      <input
                        type="range" min="20" max="320"
                        value={selectedLayer.y}
                        onChange={e => {
                          updateScene(scene.id, {
                            layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, y: parseInt(e.target.value) } : l)
                          });
                        }}
                        className="mt-1 w-full accent-brand-600"
                      />
                      <div className="text-[10px] text-surface-600 text-right">{selectedLayer.y}px</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-surface-600 uppercase font-semibold">Scale</label>
                      <input
                        type="range" min="0.5" max="2" step="0.1"
                        value={selectedLayer.scale}
                        onChange={e => {
                          updateScene(scene.id, {
                            layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, scale: parseFloat(e.target.value) } : l)
                          });
                        }}
                        className="mt-1 w-full accent-brand-600"
                      />
                      <div className="text-[10px] text-surface-600 text-right">{selectedLayer.scale}x</div>
                    </div>

                    {/* Path info & clear */}
                    <div className="border-t border-surface-300 pt-2">
                      <label className="text-[10px] text-surface-600 uppercase font-semibold flex items-center gap-1">
                        <Route size={10} /> Movement Path
                      </label>
                      {selectedLayer.pathData ? (
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-brand-400">Path set ({(selectedLayer.pathData.match(/L/g) || []).length + 1} points)</span>
                          <button
                            onClick={() => {
                              updateScene(scene.id, {
                                layers: scene.layers.map(l => l.id === selectedLayer.id ? { ...l, pathData: undefined } : l)
                              });
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-surface-200 transition"
                          >
                            Clear
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-surface-600">
                          Click Path tool in toolbar, then click points on canvas to draw a path. Double-click to finish.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {rightTab === 'animate' && (!selectedLayer || !selectedChar) && (
              <div className="text-center text-surface-600 py-8 text-xs">Select a character in the scene to edit animation.</div>
            )}

            {rightTab === 'layers' && scene && (
              <div className="space-y-1">
                <div className="text-[10px] text-surface-600 uppercase font-semibold mb-2">Scene Layers</div>
                {scene.layers.filter(l => l.type === 'character').map(layer => {
                  const ch = projectState.characters.find(c => c.id === layer.refId);
                  const isSel = selectedLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg transition text-left ${isSel ? 'bg-brand-600/10 ring-1 ring-brand-500/50' : 'hover:bg-surface-200'}`}
                    >
                      <img src={ch?.faceImageUrl || ''} alt="" className="w-6 h-6 rounded-full bg-surface-300 object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs truncate ${layer.visible === false ? 'text-surface-600 line-through' : ''}`}>{ch?.name}</div>
                        <div className="text-[10px] text-surface-600">{motionPresets.find(m => m.id === layer.motionPresetId)?.displayName}</div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateScene(scene.id, { layers: scene.layers.map(l => l.id === layer.id ? { ...l, visible: layer.visible !== false ? false : true } : l) });
                        }}
                        className="text-surface-600 hover:text-brand-400 p-1"
                        title={layer.visible !== false ? 'Hide layer' : 'Show layer'}
                      >
                        {layer.visible !== false ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateScene(scene.id, { layers: scene.layers.filter(l => l.id !== layer.id) });
                          if (selectedLayerId === layer.id) setSelectedLayerId(null);
                        }}
                        className="text-surface-600 hover:text-red-400 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  );
                })}
                {scene.layers.length === 0 && <div className="text-xs text-surface-600 py-4 text-center">No layers yet.</div>}

                {/* Add character */}
                {projectState.characters.length > 0 && (
                  <div className="pt-2 border-t border-surface-300 mt-2">
                    <div className="text-[10px] text-surface-600 uppercase font-semibold mb-1">Add to Scene</div>
                    <div className="flex flex-wrap gap-1">
                      {projectState.characters.map(c => (
                        <button
                          key={c.id}
                          onClick={() => addCharToScene(scene.id, c.id)}
                          className="flex items-center gap-1 bg-surface-200 hover:bg-surface-300 border border-surface-300 px-2 py-1 rounded text-[10px] transition"
                        >
                          <img src={c.faceImageUrl || ''} alt="" className="w-4 h-4 rounded-full bg-surface-400" /> {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {rightTab === 'audio' && scene && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-surface-600 uppercase font-semibold">Voice Style</label>
                  <select
                    value={scene.voiceStyle || 'neutral'}
                    onChange={e => updateScene(scene.id, { voiceStyle: e.target.value })}
                    className="mt-1 w-full bg-surface-200 border border-surface-300 rounded px-2 py-1.5 text-xs outline-none"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="excited">Excited</option>
                    <option value="sad">Sad</option>
                    <option value="angry">Angry</option>
                    <option value="whisper">Whisper</option>
                  </select>
                </div>
                {scene.voiceUrl && (
                  <audio controls className="w-full mt-2" src={scene.voiceUrl} />
                )}
                <button
                  onClick={async () => {
                    if (!user) { onLogin(); return; }
                    if (!scene.dialogText) { alert('Add dialogue first'); return; }
                    setGenerating(true);
                    try {
                      await api.generateVoice(projectState.id, scene.id, scene.dialogText, scene.voiceStyle || undefined);
                      alert('Voice generation queued!');
                    } catch (e: any) { alert(e.message); }
                    finally { setGenerating(false); }
                  }}
                  disabled={generating}
                  className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs py-2 rounded transition flex items-center justify-center gap-1.5"
                >
                  <Mic size={12} /> {generating ? '...' : 'Generate Voice'}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Bottom Timeline ── */}
      <div className="h-32 bg-surface-100 border-t border-surface-300 shrink-0 flex flex-col z-10">
        {/* Controls */}
        <div className="h-8 border-b border-surface-300 flex items-center px-3 gap-2 shrink-0">
          <button onClick={stopPlayback} className="p-1 hover:bg-surface-200 rounded text-surface-500 transition"><SkipBack size={12} /></button>
          <button onClick={stopPlayback} className="p-1 hover:bg-surface-200 rounded text-surface-500 transition"><Rewind size={12} /></button>
          <button
            onClick={playing ? stopPlayback : playAll}
            className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition"
          >
            {playing ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>
          <button onClick={stopPlayback} className="p-1 hover:bg-surface-200 rounded text-surface-500 transition"><FastForward size={12} /></button>
          <button onClick={stopPlayback} className="p-1 hover:bg-surface-200 rounded text-surface-500 transition"><SkipForward size={12} /></button>
          <span className="text-[10px] text-surface-500 font-mono w-10">
            {playSceneIndex >= 0 ? String(playSceneIndex + 1).padStart(2, '0') : '00'}
          </span>
          <div className="flex-1" />
          <span className="text-[10px] text-surface-600">{projectState.scenes.length} scenes · {totalDuration}s</span>
        </div>

        {/* Tracks */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
          <div className="flex items-center gap-1 min-w-max">
            {/* Scene track */}
            <div className="flex items-center gap-1">
              {projectState.scenes.map((s, i) => (
                <button
                  key={s.id}
                  draggable
                  onClick={() => { setSelectedSceneId(s.id); stopPlayback(); }}
                  onDragStart={() => { setDragSceneIndex(i); }}
                  onDragEnd={() => { setDragSceneIndex(null); setDragOverSceneIndex(null); }}
                  onDragOver={e => { e.preventDefault(); setDragOverSceneIndex(i); }}
                  onDrop={e => {
                    e.preventDefault();
                    if (dragSceneIndex !== null && dragSceneIndex !== i) {
                      reorderScenes(dragSceneIndex, i);
                    }
                    setDragSceneIndex(null);
                    setDragOverSceneIndex(null);
                  }}
                  className={`relative h-16 rounded-lg overflow-hidden border transition group select-none ${selectedSceneId === s.id ? 'ring-1 ring-brand-500 border-brand-500' : 'border-surface-300 hover:border-surface-500'} ${dragSceneIndex === i ? 'opacity-40' : ''} ${dragOverSceneIndex === i && dragSceneIndex !== i ? 'ring-2 ring-brand-400 border-brand-400' : ''}`}
                  style={{ width: Math.max(80, s.durationSec * 20), cursor: dragSceneIndex === i ? 'grabbing' : 'grab' }}
                >
                  {s.backgroundUrl ? (
                    <img src={s.backgroundUrl} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition" alt="" />
                  ) : <div className="w-full h-full bg-surface-200" />}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold bg-black/50 px-1 rounded text-white">{i + 1}</span>
                    <span className="text-[9px] text-white/80 bg-black/40 px-1 rounded mt-0.5">{s.durationSec}s</span>
                  </div>
                  {playSceneIndex === i && playing && (
                    <div className="absolute inset-0 bg-brand-600/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Script Modal ── */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-100 border border-surface-300 rounded-xl w-full max-w-2xl p-5 relative shadow-2xl">
            <button onClick={() => setShowScriptModal(false)} className="absolute top-3 right-3 text-surface-500 hover:text-white p-1">
              <X size={16} />
            </button>
            <h2 className="text-sm font-semibold mb-1">Write Your Story</h2>
            <p className="text-xs text-surface-600 mb-3">Paste a script and let AI break it into scenes automatically.</p>
            <textarea
              value={scriptDraft}
              onChange={e => { setScriptDraft(e.target.value); update({ scriptText: e.target.value }); }}
              placeholder={`Budi: Hai Ani, gimana kabarmu hari ini?\nAni: Aku baik Budi, kamu sendiri gimana?\nBudi: Aku juga baik. Yuk kita ke taman?\nAni: Ayo!`}
              className="w-full h-56 bg-surface-200 border border-surface-300 rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-brand-500 resize-none placeholder-surface-600"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-surface-600">
                {projectState.scenes.length > 0 ? `${projectState.scenes.length} scenes created` : 'No scenes yet'}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowScriptModal(false)} className="px-3 py-1.5 text-xs text-surface-500 hover:text-white transition">Close</button>
                <button
                  onClick={handleBreakdown}
                  disabled={generating || !scriptDraft.trim()}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-lg transition"
                >
                  <Wand2 size={12} /> {generating ? 'Processing...' : 'Auto Breakdown'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <ExportModal projectId={projectState.id} onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}

/* ─── Subcomponents ─── */
function ToolBtn({ icon: Icon, label, active, onClick, badge, disabled }: { icon: any; label: string; active: boolean; onClick: () => void; badge?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition ${active ? 'bg-brand-600/15 text-brand-400' : disabled ? 'opacity-40 text-surface-600' : 'text-surface-600 hover:bg-surface-200 hover:text-surface-400'}`}
    >
      {badge && <span className="absolute top-0.5 right-0.5 text-[7px] bg-brand-600 text-white px-0.5 rounded leading-none">{badge}</span>}
      <Icon size={16} />
      <span className="text-[8px] leading-none">{label}</span>
    </button>
  );
}

function TbBtn({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 transition ${
        active ? 'bg-brand-600 text-white' : 'text-surface-500 hover:bg-surface-200 hover:text-surface-300'
      }`}
    >
      <Icon size={12} /> {label}
    </button>
  );
}
