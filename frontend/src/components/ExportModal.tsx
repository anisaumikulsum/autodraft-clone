import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Loader2, Film, CheckCircle, AlertCircle } from 'lucide-react';
import * as api from '../lib/api';

interface ExportModalProps {
  projectId: string;
  onClose: () => void;
}

export default function ExportModal({ projectId, onClose }: ExportModalProps) {
  const [status, setStatus] = useState<'draft' | 'rendering' | 'done' | 'failed'>('draft');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const pollStatus = async () => {
    try {
      const project = await api.getProject(projectId);
      setStatus(project.status);
      if (project.exportUrl) setExportUrl(project.exportUrl);
      if (project.status === 'done' || project.status === 'failed') {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (e: any) {
      console.error('Poll failed:', e.message);
    }
  };

  useEffect(() => {
    pollStatus();
    intervalRef.current = window.setInterval(pollStatus, 3000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [projectId]);

  const handleRender = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.renderVideo(projectId);
      setStatus('rendering');
      setExportUrl(null);
      // restart polling if it stopped
      if (!intervalRef.current) {
        intervalRef.current = window.setInterval(pollStatus, 3000);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to queue render');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-100 border border-surface-300 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 text-surface-500 hover:text-white p-1">
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
            <Film size={18} className="text-brand-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Export Video</h2>
            <p className="text-[11px] text-surface-500">Render project ke MP4 1080p</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-surface-0 border border-surface-300 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-surface-500">Status</span>
            <StatusBadge status={status} />
          </div>
          {status === 'rendering' && (
            <div className="mt-2">
              <div className="h-1 bg-surface-300 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-[10px] text-surface-500 mt-1">Rendering in progress... This may take a few minutes.</p>
            </div>
          )}
          {status === 'done' && exportUrl && (
            <div className="mt-3 flex items-center gap-2">
              <a
                href={exportUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download size={14} /> Download MP4
              </a>
            </div>
          )}
          {status === 'failed' && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-400">
              <AlertCircle size={12} /> Render failed. Please try again.
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-[11px] text-red-400">{error}</div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-600">Cost: 10 credits</span>
          <button
            onClick={handleRender}
            disabled={loading || status === 'rendering'}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
            {status === 'rendering' ? 'Rendering...' : status === 'done' ? 'Render Ulang' : 'Start Render'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') return <span className="text-[11px] font-medium text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Selesai</span>;
  if (status === 'rendering') return <span className="text-[11px] font-medium text-brand-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Rendering</span>;
  if (status === 'failed') return <span className="text-[11px] font-medium text-red-400 flex items-center gap-1"><AlertCircle size={12} /> Gagal</span>;
  return <span className="text-[11px] font-medium text-surface-500">Ready</span>;
}
