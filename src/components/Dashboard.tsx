import { useState } from 'react';

interface DashboardProps {
  onBack: () => void;
}

type GenerationMode = 'text-to-image' | 'image-to-image' | 'ai-paint' | 'upscale' | 'remove-bg' | 'pose-maker';

const aspectRatios = [
  { id: '1:1', label: '1:1', width: 1024, height: 1024 },
  { id: '3:2', label: '3:2', width: 1008, height: 672 },
  { id: '2:3', label: '2:3', width: 672, height: 1008 },
  { id: '16:9', label: '16:9', width: 1024, height: 576 },
  { id: '9:16', label: '9:16', width: 576, height: 1024 },
  { id: '4:3', label: '4:3', width: 1024, height: 768 },
  { id: '3:4', label: '3:4', width: 768, height: 1024 },
];

const styles = [
  { id: 'default', name: 'Default', emoji: '✨' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'realistic', name: 'Realistic', emoji: '📷' },
  { id: 'cartoon', name: 'Cartoon', emoji: '🎨' },
  { id: '3d-render', name: '3D Render', emoji: '🎮' },
  { id: 'ghibli', name: 'Ghibli', emoji: '🌸' },
];

export default function Dashboard({ onBack }: DashboardProps) {
  const [activeMode, setActiveMode] = useState<GenerationMode>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [steps, setSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedImages([]);
    
    // Simulate generation (in real app, this would call an API)
    setTimeout(() => {
      const placeholderImages = [
        `https://picsum.photos/seed/${Date.now()}/1024/1024`,
        `https://picsum.photos/seed/${Date.now() + 1}/1024/1024`,
        `https://picsum.photos/seed/${Date.now() + 2}/1024/1024`,
        `https://picsum.photos/seed/${Date.now() + 3}/1024/1024`,
      ];
      setGeneratedImages(placeholderImages);
      setIsGenerating(false);
    }, 3000);
  };

  const modes = [
    { id: 'text-to-image', label: 'Text to Image', icon: '✏️' },
    { id: 'image-to-image', label: 'Image to Image', icon: '🖼️' },
    { id: 'ai-paint', label: 'AI Paint', icon: '🎨' },
    { id: 'upscale', label: 'Upscale', icon: '📈' },
    { id: 'remove-bg', label: 'Remove BG', icon: '🎭' },
    { id: 'pose-maker', label: 'Pose Maker', icon: '🧍' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white font-['Inter',sans-serif]">
      {/* Header */}
      <header className="bg-[#222226] border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
              <span className="text-xl font-bold">AutoDraft</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/10 rounded-lg relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-semibold">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#222226] border-r border-white/10 p-4 min-h-[calc(100vh-73px)]">
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 text-white">
              <span className="text-xl">✨</span>
              <span>Generate</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">📁</span>
              <span>My Projects</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">👥</span>
              <span>Characters</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">🎭</span>
              <span>Templates</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">💾</span>
              <span>Assets</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">🎵</span>
              <span>Audio</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-gray-400 transition">
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </button>
          </nav>
          
          {/* Plan Info */}
          <div className="mt-8 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💎</span>
              <span className="font-semibold">Free Plan</span>
            </div>
            <div className="text-sm text-gray-400 mb-3">
              <span className="text-white font-semibold">5</span> / 10 generations left
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
            <button className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-sm font-medium hover:opacity-90 transition">
              Upgrade to Pro
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition ${
                  activeMode === mode.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Generation Panel */}
            <div className="bg-[#222226] rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-semibold mb-4">Create Image</h2>
              
              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl resize-none focus:outline-none focus:border-purple-500 placeholder-gray-500"
                />
              </div>

              {/* Style Selection */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                        selectedStyle === style.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      <span>{style.emoji}</span>
                      <span>{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedAspectRatio(ratio.id)}
                      className={`px-4 py-2 rounded-lg transition ${
                        selectedAspectRatio === ratio.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
              >
                <span>{showAdvanced ? '▼' : '▶'}</span>
                <span>Advanced Options</span>
              </button>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="space-y-4 mb-4 p-4 bg-white/5 rounded-xl">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Steps: {steps}</label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Guidance Scale: {guidanceScale}</label>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.5"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Seed (optional)</label>
                    <input
                      type="number"
                      value={seed || ''}
                      onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Leave empty for random"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Negative Prompt</label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="What to avoid in the image..."
                      className="w-full h-20 p-3 bg-white/5 border border-white/10 rounded-lg resize-none focus:outline-none focus:border-purple-500 placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
                  !prompt.trim() || isGenerating
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '✨ Generate'
                )}
              </button>
            </div>

            {/* Results Panel */}
            <div className="bg-[#222226] rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Generated Images</h2>
                {generatedImages.length > 0 && (
                  <button className="text-purple-400 hover:text-purple-300 text-sm">
                    Download All
                  </button>
                )}
              </div>
              
              {generatedImages.length === 0 && !isGenerating ? (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-gray-400">Generated images will appear here</p>
                  </div>
                </div>
              ) : isGenerating ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse text-6xl mb-4">⚙️</div>
                    <p className="text-gray-400">Creating your masterpiece...</p>
                    <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((img, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square bg-white/5 rounded-xl overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Download">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Edit">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Use in Canvas">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Generations */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Generations</h2>
              <button className="text-purple-400 hover:text-purple-300 text-sm">View All</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
                >
                  <img
                    src={`https://picsum.photos/seed/${i + 100}/400/400`}
                    alt={`Recent ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}