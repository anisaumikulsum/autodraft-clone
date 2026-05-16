import { useState } from 'react';
import { X, User, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-100 border border-surface-300 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-surface-500 hover:text-white transition">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-1">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-sm text-surface-600 mb-6">{mode === 'login' ? 'Sign in to continue creating animations' : 'Start your free trial today'}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1">Name</label>
              <div className="flex items-center bg-surface-200 border border-surface-300 rounded-lg px-3">
                <User size={16} className="text-surface-600" />
                <input
                  type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent w-full py-2.5 px-2 text-sm outline-none placeholder-surface-600"
                  placeholder="Your name"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Email</label>
            <div className="flex items-center bg-surface-200 border border-surface-300 rounded-lg px-3">
              <Mail size={16} className="text-surface-600" />
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent w-full py-2.5 px-2 text-sm outline-none placeholder-surface-600"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Password</label>
            <div className="flex items-center bg-surface-200 border border-surface-300 rounded-lg px-3">
              <Lock size={16} className="text-surface-600" />
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent w-full py-2.5 px-2 text-sm outline-none placeholder-surface-600"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 py-2.5 rounded-lg font-medium transition"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-surface-600">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('register')} className="text-brand-400 hover:text-brand-300 font-medium">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
