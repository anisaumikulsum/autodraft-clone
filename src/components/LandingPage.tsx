import { useState } from 'react';

interface LandingPageProps {
  onStartCreating: () => void;
}

export default function LandingPage({ onStartCreating }: LandingPageProps) {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: '🎨',
      title: 'Text to Image',
      description: 'Transform your ideas into stunning visuals with AI-powered image generation'
    },
    {
      icon: '✏️',
      title: 'AI Paint',
      description: 'Edit and enhance images with intelligent brush tools and smart suggestions'
    },
    {
      icon: '📐',
      title: 'Pose Maker',
      description: 'Create dynamic character poses from our library or custom sketches'
    },
    {
      icon: '🎬',
      title: 'Animation Tools',
      description: 'Bring your characters to life with professional animation capabilities'
    },
    {
      icon: '🎭',
      title: 'Character Training',
      description: 'Train custom AI models to maintain consistency across your projects'
    },
    {
      icon: '🔊',
      title: 'Voiceover',
      description: 'Add professional voiceovers to your animations automatically'
    }
  ];

  const templates = [
    { id: 1, title: 'Fantasy Character', category: 'Characters' },
    { id: 2, title: 'Sci-Fi Scene', category: 'Backgrounds' },
    { id: 3, title: 'Comedy Style', category: 'Animation' },
    { id: 4, title: 'Product Shot', category: 'Commercial' },
    { id: 5, title: 'Educational', category: 'Explainer' },
    { id: 6, title: 'Social Media', category: 'Marketing' }
  ];

  return (
    <div className="min-h-screen bg-[#1A1B1E] text-white font-['Inter',sans-serif]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1B1E]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
            <span className="text-xl font-bold">AutoDraft</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#templates" className="text-gray-300 hover:text-white transition">Templates</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
            <a href="#tutorials" className="text-gray-300 hover:text-white transition">Tutorials</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white transition">Login</button>
            <button 
              onClick={onStartCreating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-full font-medium hover:opacity-90 transition"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
            ✨ AI-Powered Animation & Art Creation
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create Stunning Animations
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Instantly</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Transform your ideas into captivating 2D animations and digital art with AI. 
            Perfect for content creators, marketers, and animators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button 
              onClick={onStartCreating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-semibold text-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <span>Start Creating for Free</span>
              <span>→</span>
            </button>
            <button className="px-8 py-4 rounded-full border border-gray-600 font-medium text-lg hover:bg-white/5 transition">
              Watch Demo
            </button>
          </div>
          
          {/* Hero Image/Video Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 mx-auto cursor-pointer hover:bg-white/20 transition">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-gray-400">Watch how it works</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful AI Tools</h2>
            <p className="text-gray-400 text-lg">Everything you need to create professional animations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Start with Templates</h2>
            <p className="text-gray-400 text-lg">Jumpstart your creative projects</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div 
                key={template.id}
                className="group relative aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-purple-500/50 transition"
              >
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium">
                    Use Template
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <p className="text-sm text-purple-400">{template.category}</p>
                  <h3 className="text-lg font-semibold">{template.title}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button className="text-purple-400 hover:text-purple-300 font-medium">
              View All Templates →
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Create stunning content in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Describe Your Vision</h3>
              <p className="text-gray-400">Enter a text prompt or upload an image describing what you want to create</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Generates</h3>
              <p className="text-gray-400">Our powerful AI transforms your description into beautiful visuals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Edit & Export</h3>
              <p className="text-gray-400">Customize your creations and export in various formats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-gray-400 text-lg">Start free, upgrade when you need more</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-4xl font-bold mb-1">$0</p>
              <p className="text-gray-400 mb-6">Forever free</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 10 generations/month</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Basic templates</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Community support</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-gray-600 hover:bg-white/10 transition">
                Get Started
              </button>
            </div>
            <div className="bg-gradient-to-b from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-1">$19</p>
              <p className="text-gray-400 mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited generations</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All templates</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Priority support</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Commercial license</li>
              </ul>
              <button className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90 transition">
                Upgrade Now
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-2">Team</h3>
              <p className="text-4xl font-bold mb-1">$49</p>
              <p className="text-gray-400 mb-6">per month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Everything in Pro</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 5 team members</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> API access</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Dedicated support</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-gray-600 hover:bg-white/10 transition">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-gray-400 text-lg mb-8">Join thousands of creators making amazing content</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-6 py-4 rounded-full bg-white/10 border border-white/20 w-full sm:w-80 focus:outline-none focus:border-purple-500"
            />
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-full font-semibold hover:opacity-90 transition whitespace-nowrap">
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                <span className="text-xl font-bold">AutoDraft</span>
              </div>
              <p className="text-gray-400">AI-powered animation and art creation platform for everyone.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Templates</a></li>
                <li><a href="#" className="hover:text-white transition">Tutorials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm">© 2024 AutoDraft. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white transition">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}