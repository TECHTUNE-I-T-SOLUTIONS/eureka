"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FadeInUp, FloatingIcon, StaggerContainer, StaggerItem } from "@/components/animations"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <StaggerContainer delay={0}>
            <div className="col-span-2 md:col-span-1">
              <StaggerItem>
                <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 mb-4">
                  <motion.img
                    src="/Eureka-01.png"
                    alt="Eureka"
                    className="h-8 w-8 rounded-lg"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-lg font-semibold">Eureka</span>
                </motion.div>
              </StaggerItem>
              <StaggerItem>
                <p className="text-sm text-muted-foreground">AI-powered study assistant for smarter learning.</p>
              </StaggerItem>
            </div>
          </StaggerContainer>

          {/* Product */}
          <StaggerContainer delay={0.1}>
            <div>
              <StaggerItem>
                <h4 className="font-semibold mb-4 text-sm">Product</h4>
              </StaggerItem>
              <nav className="space-y-2 text-sm text-muted-foreground">
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/pricing" className="hover:text-foreground transition-colors block">
                      Pricing
                    </Link>
                  </motion.div>
                </StaggerItem>
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/faq" className="hover:text-foreground transition-colors block">
                      FAQ
                    </Link>
                  </motion.div>
                </StaggerItem>
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/about" className="hover:text-foreground transition-colors block">
                      About
                    </Link>
                  </motion.div>
                </StaggerItem>
              </nav>
            </div>
          </StaggerContainer>

          {/* Company */}
          <StaggerContainer delay={0.2}>
            <div>
              <StaggerItem>
                <h4 className="font-semibold mb-4 text-sm">Company</h4>
              </StaggerItem>
              <nav className="space-y-2 text-sm text-muted-foreground">
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/contact" className="hover:text-foreground transition-colors block">
                      Contact
                    </Link>
                  </motion.div>
                </StaggerItem>
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="#" className="hover:text-foreground transition-colors block">
                      Blog
                    </Link>
                  </motion.div>
                </StaggerItem>
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="#" className="hover:text-foreground transition-colors block">
                      Roadmap
                    </Link>
                  </motion.div>
                </StaggerItem>
              </nav>
            </div>
          </StaggerContainer>

          {/* Legal */}
          <StaggerContainer delay={0.3}>
            <div>
              <StaggerItem>
                <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              </StaggerItem>
              <nav className="space-y-2 text-sm text-muted-foreground">
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/privacy" className="hover:text-foreground transition-colors block">
                      Privacy Policy
                    </Link>
                  </motion.div>
                </StaggerItem>
                <StaggerItem>
                  <motion.div whileHover={{ x: 5 }}>
                    <Link href="/terms" className="hover:text-foreground transition-colors block">
                      Terms of Service
                    </Link>
                  </motion.div>
                </StaggerItem>
              </nav>
            </div>
          </StaggerContainer>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/50">
          <FadeInUp delay={0.4}>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Eureka. All rights reserved.</p>
          </FadeInUp>
          <div className="flex gap-4">
            <motion.a
              href="#"
              title="GitHub"
              whileHover={{ scale: 1.2, y: -3 }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">GitHub</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </motion.a>
            <motion.a
              href="#"
              title="Twitter"
              whileHover={{ scale: 1.2, y: -3 }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7a1.7 1.7 0 00-1-2z" />
              </svg>
            </motion.a>
            <motion.a
              href="#"
              title="LinkedIn"
              whileHover={{ scale: 1.2, y: -3 }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  )
}
