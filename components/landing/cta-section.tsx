"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { Sparkles, ArrowRight } from "lucide-react"

export function CTASection() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden px-4 py-20">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent-foreground mb-6">
            <Sparkles className="h-4 w-4 text-accent" />
            Start your learning journey today
          </div>

          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl text-balance">Ready to transform how you study?</h2>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of students using Eureka to study smarter, not harder. Upload your first note and experience
            the difference.
          </p>

          <div className="mt-10">
            <Button
              size="lg"
              onClick={() => setAuthOpen(true)}
              className="h-14 px-10 rounded-xl font-semibold text-lg gap-2 group"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">No credit card required. Free forever for personal use.</p>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode="signup" />
    </>
  )
}
