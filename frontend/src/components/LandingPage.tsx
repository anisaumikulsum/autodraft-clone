import React, { useState, useEffect } from 'react';
import { Wand2, Play, Layers, Users, Zap, Film, ArrowRight, Check, Star, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onLogin: () => void;
}

export default function LandingPage({ onEnterDashboard, onLogin }: LandingPageProps) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-surface-0 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-surface-0/95 backdrop-blur border-b border-surface-300' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Wand2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm">Autodraft Clone</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#fitur" className="text-xs text-surface-500 hover:text-white transition hidden sm:block">Fitur</a>
            <a href="#harga" className="text-xs text-surface-500 hover:text-white transition hidden sm:block">Harga</a>
            {user ? (
              <button onClick={onEnterDashboard} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                Dashboard
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
                Masuk / Daftar
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-surface-100 border border-surface-300 px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={12} className="text-brand-400" />
            <span className="text-[11px] text-surface-400">AI Animation Platform — Versi Beta</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
            Buat Animasi Profesional
            <br />
            <span className="text-brand-500">Tanpa Skill Desain</span>
          </h1>
          <p className="text-sm text-surface-500 max-w-xl mx-auto mb-8 leading-relaxed">
            Cukup tulis script, AI akan menghasilkan karakter vector, background, voiceover, dan animasi otomatis. Export ke video HD dalam hitungan menit.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={user ? onEnterDashboard : () => setShowAuth(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-brand-900/30"
            >
              <Play size={16} /> Mulai Gratis
            </button>
            <a href="#demo" className="px-6 py-3 rounded-xl text-sm font-medium text-surface-400 hover:text-white border border-surface-300 hover:border-surface-500 transition">
              Lihat Demo
            </a>
          </div>
          <div className="mt-10 flex items-center justify-center gap-6 text-[11px] text-surface-600">
            <span className="flex items-center gap-1"><Check size={10} className="text-brand-500" /> Vector Puppet Rigging</span>
            <span className="flex items-center gap-1"><Check size={10} className="text-brand-500" /> AI Scene Generation</span>
            <span className="flex items-center gap-1"><Check size={10} className="text-brand-500" /> Export HD Video</span>
          </div>
        </div>
      </section>

      {/* Hero Visual / Screenshot */}
      <section id="demo" className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-surface-300 shadow-2xl bg-surface-100 aspect-video flex items-center justify-center group">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/30 to-transparent" />
            <div className="relative text-center">
              <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-900/50 group-hover:scale-110 transition">
                <Play size={24} className="text-white ml-0.5" />
              </div>
              <p className="text-xs text-surface-400">Preview Editor Interface</p>
            </div>
            {/* Floating UI elements as decoration */}
            <div className="absolute top-4 left-4 bg-surface-0/80 backdrop-blur px-3 py-2 rounded-lg border border-surface-300 text-[10px] text-surface-400 flex items-center gap-2">
              <Layers size={10} /> Scene 1 / 5
            </div>
            <div className="absolute top-4 right-4 bg-surface-0/80 backdrop-blur px-3 py-2 rounded-lg border border-surface-300 text-[10px] text-surface-400 flex items-center gap-2">
              <Users size={10} /> 2 Karakter
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-0/90 backdrop-blur px-4 py-2 rounded-full border border-surface-300 text-[10px] text-surface-400 flex items-center gap-3">
              <span className="flex items-center gap-1"><Zap size={10} className="text-brand-400" /> AI Render</span>
              <span className="w-px h-3 bg-surface-300" />
              <span className="flex items-center gap-1"><Film size={10} className="text-brand-400" /> 1080p</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-20 px-6 bg-surface-100 border-y border-surface-300">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] text-brand-400 font-semibold uppercase tracking-wider mb-2 block">Fitur Unggulan</span>
            <h2 className="text-2xl sm:text-3xl font-bold">Semua Tools yang Kamu Butuhkan</h2>
            <p className="text-xs text-surface-500 mt-3 max-w-md mx-auto">Dari script sampai video, semua otomatis dengan AI. Tinggal drag, drop, dan export.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Wand2}
              title="Vector Puppet Rigging"
              desc="Karakter berbasis vector dengan bone hierarchy. 8 motion preset: idle, walk, talk, sit, happy, sad, angry, waving."
            />
            <FeatureCard
              icon={Zap}
              title="AI Scene Generator"
              desc="Tulis script, AI breakdown jadi scene otomatis. Generate background, karakter, dan voiceover dengan satu klik."
            />
            <FeatureCard
              icon={Layers}
              title="Drag & Drop Editor"
              desc="Posisikan karakter di canvas dengan mouse. Gambar path pergerakan. Atur layer, scene, dan timeline dengan mudah."
            />
            <FeatureCard
              icon={Film}
              title="Export Video HD"
              desc="Render ke MP4 1080p dengan FFmpeg. Background + karakter + voiceover + subtitle digabung otomatis."
            />
            <FeatureCard
              icon={Users}
              title="Karakter Custom"
              desc="Pilih template Male/Female/Child. Ganti warna skin, hair, baju. Upload wajah sendiri."
            />
            <FeatureCard
              icon={Sparkles}
              title="Credit System"
              desc="Bayar per generasi, bukan per bulan. Transparan dan terjangkau untuk creator Indonesia."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold">Cara Kerja — 4 Langkah</h2>
            <p className="text-xs text-surface-500 mt-3">Lebih cepat dari software animasi tradisional</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard number="1" title="Tulis Script" desc="Masukkan cerita atau dialog. AI akan breakdown jadi scene otomatis." />
            <StepCard number="2" title="Generate Aset" desc="AI buat karakter, background, dan voiceover dalam hitungan detik." />
            <StepCard number="3" title="Atur Scene" desc="Drag & drop karakter di canvas. Atur posisi, animasi, dan path pergerakan." />
            <StepCard number="4" title="Export Video" desc="Render ke MP4 HD dengan satu klik. Download dan publish ke mana saja." />
          </div>
        </div>
      </section>

      {/* Pricing — Value Stacking */}
      <section id="harga" className="py-20 px-6 bg-surface-100 border-y border-surface-300">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] text-brand-400 font-semibold uppercase tracking-wider mb-2 block">Pricing</span>
            <h2 className="text-2xl sm:text-3xl font-bold">Value Stacking — Hemat Banget</h2>
            <p className="text-xs text-surface-500 mt-3 max-w-md mx-auto">Kumpulkan nilai per tool yang kamu dapatkan. Total value sebenarnya ribuan dollar.</p>
          </div>

          {/* Value Stack */}
          <div className="max-w-lg mx-auto mb-10 bg-surface-0 border border-surface-300 rounded-xl p-5">
            <p className="text-[11px] text-surface-500 uppercase tracking-wider mb-3 font-semibold">Nilai Tools yang Kamu Dapatkan:</p>
            <div className="space-y-2">
              <ValueRow label="Character Rigging Software" value="$199" />
              <ValueRow label="Animation Timeline Editor" value="$149" />
              <ValueRow label="AI Image Generation (SDXL)" value="$99/mo" />
              <ValueRow label="Text-to-Speech (ElevenLabs)" value="$29/mo" />
              <ValueRow label="Video Renderer (FFmpeg Cloud)" value="$49/mo" />
              <ValueRow label="Script Breakdown AI (GPT-4o)" value="$39/mo" />
            </div>
            <div className="border-t border-surface-300 mt-3 pt-3 flex items-center justify-between">
              <span className="text-xs text-surface-400">Total Nilai Sebenarnya</span>
              <span className="text-sm font-bold text-surface-300 line-through">$564+/mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="Rp 0"
              period="/bulan"
              credits="100 kredit"
              features={['3 project', 'Export 720p', 'Basic puppet templates', 'Community support']}
              cta="Mulai Gratis"
              onCta={user ? onEnterDashboard : () => setShowAuth(true)}
            />
            <PricingCard
              name="Creator"
              price="Rp 149rb"
              period="/bulan"
              credits="1.000 kredit"
              features={['Unlimited project', 'Export 1080p', 'Semua puppet templates', 'AI voiceover', 'Priority render']}
              cta="Pilih Creator"
              highlighted
              onCta={user ? onEnterDashboard : () => setShowAuth(true)}
            />
            <PricingCard
              name="Studio"
              price="Rp 349rb"
              period="/bulan"
              credits="3.000 kredit"
              features={['Unlimited project', 'Export 1080p + 4K', 'Custom puppet upload', 'API access', 'Dedicated support']}
              cta="Pilih Studio"
              onCta={user ? onEnterDashboard : () => setShowAuth(true)}
            />
          </div>
          <p className="text-center text-[10px] text-surface-600 mt-6">1 kredit = 1 generasi karakter / background / voiceover. Render video = 10 kredit.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold">Testimoni Creator</h2>
            <p className="text-xs text-surface-500 mt-3">Yang sudah pakai buat konten animasi</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TestimonialCard
              name="Andi Wijaya"
              role="Content Creator"
              text="Gue yang gaptek soal animasi sekarang bisa buat konten animated story. Cuma tulis script, AI ngurus sisanya."
            />
            <TestimonialCard
              name="Siti Nurhaliza"
              role="Social Media Manager"
              text="Dari yang butuh 2 minggu pake software kompleks, sekarang jadi 2 jam. Vector puppetnya smooth banget."
            />
            <TestimonialCard
              name="Budi Santoso"
              role="Edu Creator"
              text="Sistem kreditnya transparan. Gak ada biaya tersembunyi. Voiceover AI-nya juga natural buat konten edukasi."
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 bg-surface-100 border-t border-surface-300">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Siap Buat Animasi Pertamamu?</h2>
          <p className="text-xs text-surface-500 mb-8">Gratis 100 kredit setiap bulan. Tanpa kartu kredit. Tanpa ribet.</p>
          <button
            onClick={user ? onEnterDashboard : () => setShowAuth(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 mx-auto shadow-lg shadow-brand-900/30"
          >
            <Sparkles size={16} /> Mulai Gratis Sekarang
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-surface-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <Wand2 size={12} className="text-white" />
            </div>
            <span className="text-xs text-surface-500">Autodraft Clone — AI Animation Maker</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-surface-600">
            <a href="#" className="hover:text-surface-400 transition">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-surface-400 transition">Kebijakan Privasi</a>
            <a href="#" className="hover:text-surface-400 transition">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub Components ─── */

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-surface-0 border border-surface-300 rounded-xl p-5 hover:border-brand-500/50 transition group">
      <div className="w-9 h-9 bg-surface-100 border border-surface-300 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-900/20 group-hover:border-brand-500/30 transition">
        <Icon size={16} className="text-brand-500" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-[11px] text-surface-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="relative bg-surface-0 border border-surface-300 rounded-xl p-5">
      <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-[11px] font-bold mb-3">{number}</div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-[11px] text-surface-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-surface-500">{label}</span>
      <span className="text-surface-400 font-medium line-through">{value}</span>
    </div>
  );
}

function PricingCard({ name, price, period, credits, features, cta, highlighted, onCta }: {
  name: string; price: string; period: string; credits: string; features: string[]; cta: string; highlighted?: boolean; onCta: () => void;
}) {
  return (
    <div className={`relative rounded-xl border p-5 transition ${highlighted ? 'bg-surface-0 border-brand-500 ring-1 ring-brand-500/50' : 'bg-surface-0 border-surface-300'}`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full">Paling Populer</div>
      )}
      <h3 className="text-sm font-semibold mb-1">{name}</h3>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-extrabold">{price}</span>
        <span className="text-[11px] text-surface-500">{period}</span>
      </div>
      <p className="text-[11px] text-brand-400 font-medium mb-4">{credits}</p>
      <ul className="space-y-2 mb-5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-surface-400">
            <Check size={12} className="text-brand-500 shrink-0 mt-0.5" /> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        className={`w-full py-2 rounded-lg text-xs font-semibold transition ${highlighted ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-surface-200 hover:bg-surface-300 text-surface-300 hover:text-white'}`}
      >
        {cta}
      </button>
    </div>
  );
}

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="bg-surface-100 border border-surface-300 rounded-xl p-5">
      <div className="flex items-center gap-1 mb-3">
        {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
      </div>
      <p className="text-[11px] text-surface-400 leading-relaxed mb-4">"{text}"</p>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-[10px] font-bold">
          {name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div>
          <p className="text-[11px] font-medium">{name}</p>
          <p className="text-[10px] text-surface-600">{role}</p>
        </div>
      </div>
    </div>
  );
}
