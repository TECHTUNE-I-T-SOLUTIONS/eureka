"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { BookOpen, MessageCircle, Zap, ArrowRight } from "lucide-react"

export function HeroSection() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <>
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <img src="/Eureka-01.png" alt="Eureka" className="h-4 w-4 rounded" />
              Your Personal Discovery Engine
            </div>

            {/* Main heading */}
            <h1 className="animate-slide-up text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              Study Smarter with{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Eureka</span>
              </span>
            </h1>

            {/* Subheading */}
            <p
              className="animate-slide-up mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty"
              style={{ animationDelay: "100ms" }}
            >
              Upload your notes, ask questions, and get AI-powered explanations, summaries, and practice questions. Your
              personal study assistant that understands your learning style.
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up mt-10 flex flex-col sm:flex-row gap-4" style={{ animationDelay: "200ms" }}>
              <Button
                size="lg"
                onClick={() => openAuth("signup")}
                className="h-12 px-8 rounded-xl font-semibold text-base gap-2 group"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => openAuth("login")}
                className="h-12 px-8 rounded-xl font-semibold text-base"
              >
                Sign In
              </Button>
            </div>

            {/* Feature highlights */}
            <div
              className="animate-slide-up mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-3xl"
              style={{ animationDelay: "300ms" }}
            >
              <FeatureCard
                icon={BookOpen}
                title="Smart Notes"
                description="Upload any document and get instant summaries"
              />
              <FeatureCard
                icon={MessageCircle}
                title="AI Chat"
                description="Ask questions about your study materials"
              />
              <FeatureCard
                icon={Zap}
                title="Practice Questions"
                description="Generate quizzes to test your knowledge"
              />
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="glass-card rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
