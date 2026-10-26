'use client';

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from "@/lib/supabase/client"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Download,
  Share2,
  Sparkles,
  Mic,
  GraduationCap,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BookOpen,
  Smartphone,
  HardDrive,
  Wifi,
  Check,
} from 'lucide-react';

interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  downloadCount: number;
  downloadUrl: string;
}

interface Release {
  id: number;
  version: string;
  tagName: string;
  name: string;
  isPrerelease: boolean;
  publishedAt: string;
  releaseNotes: string;
  assets: ReleaseAsset[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const features = [
  {
    icon: <Sparkles className="w-5 h-5 text-blue-500" />,
    title: 'AI-Powered Note Synthesis',
    desc: 'Upload PDFs and course materials. Get executive summaries, key concepts, and layered breakdowns instantly.',
  },
  {
    icon: <Mic className="w-5 h-5 text-violet-500" />,
    title: 'Voice Lecturer Mode',
    desc: 'Listen to your notes as full audio walkthroughs with natural voices and adjustable playback speed.',
  },
  {
    icon: <GraduationCap className="w-5 h-5 text-emerald-500" />,
    title: 'University-Standard Practice Exams',
    desc: 'Generate 10 exam-grade questions from your notes with instant scoring and academic explanations.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-cyan-500" />,
    title: 'Academic Privacy & Security',
    desc: 'Your study materials stay private. End-to-end encrypted and never shared with third parties.',
  },
];

const requirements = [
  { icon: <Smartphone className="w-4 h-4" />, label: 'Android 10.0+' },
  { icon: <HardDrive className="w-4 h-4" />, label: '50 MB Free Storage' },
  { icon: <Wifi className="w-4 h-4" />, label: 'Internet Connection Required' },
  { icon: <BookOpen className="w-4 h-4" />, label: 'Supports PDF, TXT, MD' },
];

export default function AppDownloadPage() {
  const [user, setUser] = useState<any>(null)
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/app/releases?limit=5')
      .then((r) => r.json())
      .then((data: Release[]) => {
        const stable = Array.isArray(data)
          ? data.find((r) => !r.isPrerelease && r.assets.some((a) => a.name.endsWith('.apk'))) ?? data[0]
          : null;
        setRelease(stable ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const apkAsset = release?.assets.find((a) => a.name.endsWith('.apk'));

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'http://eureka.vercel.app/app';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eureka AI App', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0B0F19] dark:via-[#0f1729] dark:to-[#0B0F19]">
      {/* Header */}
      <Navbar user={user} />

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-blue-500 to-indigo-600 blur-xl opacity-30 scale-110" />
              <Image
                src="/Eureka-01.png"
                alt="Eureka App Icon"
                width={96}
                height={96}
                className="relative rounded-[28px] shadow-2xl border border-slate-200/30 dark:border-slate-700/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Eureka AI</h1>
            {release && (
              <Badge variant="secondary" className="text-xs font-semibold px-2 py-1">
                v{release.version}
              </Badge>
            )}
          </div>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-2">
            Intelligent Study Companion & AI Lecturer
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 max-w-lg mx-auto">
            Transform your lecture notes and study documents into clear summaries, voice breakdowns, and exam-ready practice questions.
          </p>
        </div>

        {/* Download Card */}
        <Card className="mb-10 border-slate-200/80 dark:border-slate-800/80 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Checking for latest release…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Could not fetch release information. Please try again later.
                </p>
              </div>
            ) : !apkAsset ? (
              <div className="text-center py-6">
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Coming Soon 🚀</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  The Android app is being prepared. Check back shortly or visit the website for updates.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">{release!.name || `Eureka v${release!.version}`}</span>
                    {release!.isPrerelease && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Beta</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                    {new Date(release!.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {apkAsset.size > 0 && ` · ${formatBytes(apkAsset.size)}`}
                    {apkAsset.downloadCount > 0 && ` · ${apkAsset.downloadCount.toLocaleString()} downloads`}
                  </p>
                  {release!.releaseNotes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{release!.releaseNotes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3 shrink-0">
                  <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 gap-2 min-w-[200px]">
                    <a href={apkAsset.downloadUrl} download>
                      <Download className="w-4 h-4" />
                      Download APK
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                    {copied ? 'Link Copied!' : 'Share App'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">What Eureka Offers</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {features.map((f, i) => (
            <Card key={i} className="border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Requirements */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">System Requirements</h2>
        <div className="flex flex-wrap gap-3 mb-12">
          {requirements.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/60 rounded-xl px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
              {r.icon}
              {r.label}
            </div>
          ))}
        </div>

      </div>
      {/* Footer */}
      <Footer />
    </main>
  );
}
