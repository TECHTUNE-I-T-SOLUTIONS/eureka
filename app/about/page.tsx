"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Lightbulb, Users, Zap, Target, Award, Heart } from "lucide-react"

export default function AboutPage() {
  const [user, setUser] = useState(null)

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

  const values = [
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We leverage cutting-edge AI to transform the way students learn and study.",
    },
    {
      icon: Users,
      title: "Accessibility",
      description: "Making quality education assistance available to every student, regardless of background.",
    },
    {
      icon: Heart,
      title: "Empathy",
      description: "We understand the challenges students face and build solutions with compassion.",
    },
    {
      icon: Zap,
      title: "Efficiency",
      description: "Save time on studying and focus on understanding with our AI-powered insights.",
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Committed to delivering the highest quality learning experience possible.",
    },
    {
      icon: Award,
      title: "Integrity",
      description: "Transparent, honest, and committed to ethical AI practices.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-24 border-b border-border/50">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">About Eureka</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Transforming Education with AI</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Eureka is on a mission to empower every student with an intelligent, personalized study assistant that adapts
              to their learning style and helps them achieve academic excellence.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Our Story</h2>
            <div className="space-y-6 text-muted-foreground">
              <p className="text-lg">
                Eureka was born from a simple observation: students spend countless hours studying, often without proper
                guidance or the right tools. We realized that AI could revolutionize the learning process by providing
                personalized, intelligent assistance tailored to each student's unique needs.
              </p>
              <p className="text-lg">
                Our team of educators and technologists came together with a shared vision: to build the most intuitive and
                effective AI study companion. We wanted to create something that doesn't just answer questions, but truly
                helps students understand concepts at a deeper level.
              </p>
              <p className="text-lg">
                Today, Eureka serves thousands of students worldwide, helping them upload their study materials, get instant
                summaries and explanations, practice with AI-generated questions, and ultimately, succeed in their academic
                journey.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, idx) => {
                const Icon = value.icon
                return (
                  <div key={idx} className="p-6 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="mb-4 p-3 w-fit rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8 sm:p-12 border border-primary/20">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                To democratize access to high-quality educational support by providing every student with an intelligent,
                personalized AI study companion that makes learning more efficient, enjoyable, and effective.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold mb-3">For Students</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>✓ Personalized learning experience</li>
                    <li>✓ Instant answers and explanations</li>
                    <li>✓ Practice questions tailored to learning level</li>
                    <li>✓ Time-saving study tools</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-3">For Education</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li>✓ Support academic excellence</li>
                    <li>✓ Complement classroom learning</li>
                    <li>✓ Help students succeed</li>
                    <li>✓ Make education accessible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">What Sets Us Apart</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Advanced AI Technology</h3>
                  <p className="text-muted-foreground">
                    Powered by Google's Gemini 2.0 Flash, our AI provides accurate, contextual, and personalized responses.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Personalized Learning</h3>
                  <p className="text-muted-foreground">
                    Adapts to your learning style and preferences, providing explanations at your level (beginner, intermediate,
                    advanced).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Intuitive Interface</h3>
                  <p className="text-muted-foreground">
                    Clean, user-friendly design that makes studying enjoyable and frictionless.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Privacy-First Approach</h3>
                  <p className="text-muted-foreground">
                    Your study materials are encrypted and secure. We never sell your data to third parties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Started */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Start Your Learning Journey</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of students who are already using Eureka to study smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/callback?mode=signup"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="/contact"
                className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
