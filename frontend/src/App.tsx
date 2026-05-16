import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Plus, LogOut, Sparkles, Trash2, ChevronRight, Play, Clock, Users } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import AuthModal from './components/AuthModal';
import Editor from './components/Editor';
import LandingPage from './components/LandingPage';
import * as api from './lib/api';
import { Project, createEmptyProject } from './stores';

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState<'landing' | 'dashboard' | 'editor'>('landing');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const prevProjectRef = useRef<Project | null>(null);
  useEffect(() => { prevProjectRef.current = activeProject; }, [activeProject]);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getProjects();
      const normalized = data.map((p: any) => ({
        ...p,
        characters: (p.characters || []).map((pc: any) => pc.character || pc),
        scenes: p.scenes || [],
      }));
      setProjects(normalized);
    } catch (e: any) {
      console.error('Failed to load projects:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  const handleNewProject = async () => {
    if (!user) { setShowAuth(true); return; }
    try {
      const p = await api.createProject({ title: 'Untitled Project', genre: 'drama' });
      const normalized = { ...p, characters: [], scenes: [] };
      setProjects(prev => [normalized, ...prev]);
      setActiveProject(normalized);
      setView('editor');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenProject = (p: Project) => {
    setActiveProject(p);
    setView('editor');
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateProject = useCallback(async (p: Project) => {
    const durationSec = p.scenes?.reduce((sum, s) => sum + (s.durationSec || 0), 0) || 0;
    const totalScenes = p.scenes?.length || 0;
    const enriched = { ...p, durationSec, totalScenes };

    setProjects(prev => prev.map(x => x.id === p.id ? enriched : x));
    setActiveProject(enriched);

    try {
      await api.updateProject(p.id, {
        title: enriched.title,
        description: enriched.description,
        genre: enriched.genre,
        scriptText: enriched.scriptText,
        status: enriched.status,
        totalScenes: enriched.totalScenes,
        durationSec: enriched.durationSec,
        watermark: enriched.watermark,
      });
      // Persist scenes with layers to backend
      if (enriched.scenes.length > 0) {
        await api.saveScenes(p.id, enriched.scenes);
      }
      // Persist character customColors that changed
      const prev = prevProjectRef.current;
      for (const char of enriched.characters || []) {
        const prevChar = prev?.characters?.find(c => c.id === char.id);
        if (JSON.stringify(prevChar?.customColors) !== JSON.stringify(char.customColors)) {
          await api.updateCharacter(p.id, char.id, { customColors: char.customColors });
        }
      }
    } catch (e: any) {
      console.error('Auto-save failed:', e.message);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-surface-0">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {view === 'landing' ? (
        <LandingPage
          onEnterDashboard={() => setView('dashboard')}
          onLogin={() => setShowAuth(true)}
        />
      ) : view === 'dashboard' ? (
        <Dashboard
          projects={projects}
          loading={loading}
          user={user}
          onNew={handleNewProject}
          onOpen={handleOpenProject}
          onDelete={handleDeleteProject}
          onLogin={() => setShowAuth(true)}
          onLogout={logout}
        />
      ) : activeProject ? (
        <Editor
          project={activeProject}
          user={user}
          onUpdate={handleUpdateProject}
          onBack={() => { setView('dashboard'); fetchProjects(); }}
          onLogin={() => setShowAuth(true)}
          onLogout={logout}
        />
      ) : null}
    </div>
  );
}

function Dashboard({ projects, loading, user, onNew, onOpen, onDelete, onLogin, onLogout }: {
  projects: Project[]; loading: boolean; user: any;
  onNew: () => void; onOpen: (p: Project) => void;
  onDelete: (id: string) => void; onLogin: () => void; onLogout: () => void;
}) {
  return (
    <div className="flex-1 overflow-auto bg-surface-0">
      {/* Header */}
      <header className="bg-surface-100 border-b border-surface-300 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <Wand2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Autodraft Clone</h1>
            <p className="text-[10px] text-surface-600">AI Animation Maker</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-1.5 bg-surface-200 border border-surface-300 px-3 py-1.5 rounded-lg text-xs text-surface-400">
                <Sparkles size={12} className="text-brand-400" />
                <span>{user.credits} credits</span>
              </div>
              <button onClick={onLogout} className="text-surface-500 hover:text-white text-xs flex items-center gap-1 px-2 py-1.5 hover:bg-surface-200 rounded transition">
                <LogOut size={12} /> Keluar
              </button>
            </>
          ) : (
            <button onClick={onLogin} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
              Masuk / Daftar
            </button>
          )}
          <button onClick={onNew} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
            <Plus size={14} /> New Project
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center text-surface-600 py-20 text-sm">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-surface-400 rounded-2xl p-16 text-center max-w-xl mx-auto mt-8">
            <div className="w-16 h-16 bg-surface-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Wand2 size={28} className="text-surface-500" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">No projects yet</h2>
            <p className="text-xs text-surface-600 mb-6">Create your first animation story. Write a script, generate characters, and render a video.</p>
            <button onClick={onNew} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-xs font-medium transition">
              Create New Story
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Projects</h2>
              <span className="text-xs text-surface-600">{projects.length} total</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map(p => (
                <div key={p.id} className="bg-surface-100 border border-surface-300 rounded-xl p-4 hover:border-brand-500/50 transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-surface-200 text-surface-400 px-2 py-0.5 rounded capitalize">{p.genre}</span>
                      <span className="text-[10px] text-surface-600 flex items-center gap-1">
                        <Clock size={10} /> {Math.round(p.durationSec)}s
                      </span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-sm text-white mb-1 truncate">{p.title}</h3>
                  <p className="text-xs text-surface-600 mb-3 line-clamp-2">{p.description || 'No description'}</p>
                  <div className="flex items-center justify-between text-xs text-surface-600">
                    <span className="flex items-center gap-1">
                      <Play size={10} /> {p.totalScenes} scenes
                    </span>
                    <span className="capitalize">{p.status}</span>
                  </div>
                  <button onClick={() => onOpen(p)} className="mt-3 w-full bg-surface-200 hover:bg-surface-300 text-surface-300 hover:text-white py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1">
                    Open Editor <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
