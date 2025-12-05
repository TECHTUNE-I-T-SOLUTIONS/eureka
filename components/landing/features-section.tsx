"use client"

import { Upload, Brain, MessageSquare, Bell, Download, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { FadeInUp, StaggerContainer, StaggerItem, FloatingIcon } from "@/components/animations"

const features = [
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Drag and drop your PDFs, documents, or paste text directly. Eureka handles the rest.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Advanced AI breaks down your notes into digestible chunks and creates embeddings for smart retrieval.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: MessageSquare,
    title: "Interactive Chat",
    description: "Have natural conversations about your study materials. Ask questions and get detailed explanations.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get notified when your notes are processed and ready for studying.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Download your notes, summaries, and chat history for offline studying.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your study materials are encrypted and never shared. Your data belongs to you.",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
]

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <FadeInUp delay={0}>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl text-balance">Everything you need to study effectively</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Eureka combines the power of AI with intuitive design to transform how you learn.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer delay={0.1}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <motion.div whileHover={{ y: -10, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <div className="glass-card rounded-2xl p-6 transition-all hover:shadow-xl h-full">
                    <motion.div
                      className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl", feature.bgColor)}
                      whileHover={{ rotate: 15, scale: 1.1 }}
                    >
                      <FloatingIcon delay={0.5}>
                        <feature.icon className={cn("h-6 w-6", feature.color)} />
                      </FloatingIcon>
                    </motion.div>
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      </div>
    </section>
  )
}
