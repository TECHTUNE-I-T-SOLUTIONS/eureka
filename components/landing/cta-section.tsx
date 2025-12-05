"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { FadeInUp, FloatingIcon } from "@/components/animations"

export function CTASection() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden px-4 py-20">
        {/* Background with animation */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
          />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <FadeInUp delay={0}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent-foreground mb-6 cursor-pointer hover:bg-accent/20 transition-colors"
            >
              <FloatingIcon delay={0.3}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity }}>
                  <div className="h-4 w-4 text-accent rounded-full bg-accent" />
                </motion.div>
              </FloatingIcon>
              Start your learning journey today
            </motion.div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <motion.h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl text-balance">
              Ready to transform how you study?
            </motion.h2>
          </FadeInUp>

          <FadeInUp delay={0.2}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Join thousands of students using Eureka to study smarter, not harder. Upload your first note and
              experience the difference.
            </p>
          </FadeInUp>

          <FadeInUp delay={0.3}>
            <div className="mt-10">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={() => setAuthOpen(true)}
                  className="h-14 px-10 rounded-xl font-semibold text-lg gap-2 group"
                >
                  Get Started for Free
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </FadeInUp>

          <FadeInUp delay={0.4}>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required. Free forever for personal use.</p>
          </FadeInUp>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode="signup" />
    </>
  )
}
