"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { BookOpen, MessageCircle, Zap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { FloatingIcon, FadeInUp, StaggerContainer, StaggerItem } from "@/components/animations"

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
        {/* Background gradient with animation */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/2 left-1/2 -translate-x-1/2 h-[800px] w-[800px] rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl"
          />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <FadeInUp delay={0}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors"
              >
                <FloatingIcon delay={0.5}>
                  <img src="/Eureka-01.png" alt="Eureka" className="h-4 w-4 rounded" />
                </FloatingIcon>
                Your Personal Discovery Engine
              </motion.div>
            </FadeInUp>

            {/* Main heading */}
            <FadeInUp delay={0.1}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
                Study Smarter with{" "}
                <span className="relative">
                  <motion.span
                    className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                    animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Eureka
                  </motion.span>
                </span>
              </h1>
            </FadeInUp>

            {/* Subheading */}
            <FadeInUp delay={0.2}>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl text-pretty">
                Upload your notes, ask questions, and get AI-powered explanations, summaries, and practice questions.
                Your personal study assistant that understands your learning style.
              </p>
            </FadeInUp>

            {/* CTA Buttons */}
            <FadeInUp delay={0.3}>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => openAuth("signup")}
                    className="h-12 px-8 rounded-xl font-semibold text-base gap-2 group"
                  >
                    Get Started Free
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => openAuth("login")}
                    className="h-12 px-8 rounded-xl font-semibold text-base"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </div>
            </FadeInUp>

            {/* Feature highlights */}
            <StaggerContainer delay={0.4}>
              <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-3xl">
                <StaggerItem>
                  <FeatureCard
                    icon={BookOpen}
                    title="Smart Notes"
                    description="Upload any document and get instant summaries"
                  />
                </StaggerItem>
                <StaggerItem>
                  <FeatureCard
                    icon={MessageCircle}
                    title="AI Chat"
                    description="Ask questions about your study materials"
                  />
                </StaggerItem>
                <StaggerItem>
                  <FeatureCard
                    icon={Zap}
                    title="Practice Questions"
                    description="Generate quizzes to test your knowledge"
                  />
                </StaggerItem>
              </div>
            </StaggerContainer>
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
    <motion.div whileHover={{ y: -10, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
      <div className="glass-card rounded-2xl p-6 text-left transition-all hover:shadow-xl h-full">
        <motion.div
          className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  )
}
