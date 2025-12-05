"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Mail, Lock, User, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ConfirmationModal } from "@/components/modals/confirmation-modal"
import { LoadingModal } from "@/components/modals/loading-modal"
import { FadeInUp, ScaleIn } from "@/components/animations"

type AuthMode = "login" | "signup" | "forgot"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: AuthMode
}

export function AuthModal({ open, onOpenChange, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingModal, setShowLoadingModal] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastMode, setLastMode] = useState<AuthMode>(defaultMode)
  const router = useRouter()

  React.useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setDisplayName("")
    }
  }, [open, defaultMode])

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen && (email || password || displayName)) {
      setLastMode(mode)
      setShowConfirmation(true)
    } else {
      onOpenChange(newOpen)
    }
  }

  const confirmClose = () => {
    setShowConfirmation(false)
    onOpenChange(false)
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setDisplayName("")
  }

  const cancelClose = () => {
    setShowConfirmation(false)
  }

  const getConfirmationMessage = () => {
    switch (lastMode) {
      case "signup":
        return {
          title: "Leave without signing up?",
          description: "Your account creation will be cancelled. You can always sign up later.",
        }
      case "forgot":
        return {
          title: "Leave without resetting password?",
          description: "Your password reset request will be cancelled.",
        }
      case "login":
        return {
          title: "Leave without logging in?",
          description: "Your login session will be cancelled.",
        }
    }
  }

  const confirmationMessage = getConfirmationMessage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowLoadingModal(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Show loading modal briefly before success
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setShowLoadingModal(false)

      toast.success("Welcome back!", {
        description: "You've successfully logged in.",
      })
      onOpenChange(false)
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setShowLoadingModal(false)
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure your passwords match.",
      })
      return
    }

    if (password.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters.",
      })
      return
    }

    setShowLoadingModal(true)

    try {
      const supabase = createClient()
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      })

      if (signupError) throw signupError

      // Create user_settings after auth user is created
      if (authData.user?.id) {
        const { error: settingsError } = await supabase
          .from("user_settings")
          .insert({
            id: authData.user.id,
            display_name: displayName || email.split("@")[0],
          })

        if (settingsError) throw settingsError
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
      setShowLoadingModal(false)

      toast.success("Check your email!", {
        description: "We've sent you a confirmation link.",
      })
      setMode("login")
    } catch (error) {
      setShowLoadingModal(false)
      toast.error("Signup failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setShowLoadingModal(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      await new Promise((resolve) => setTimeout(resolve, 1500))
      setShowLoadingModal(false)

      toast.success("Reset link sent!", {
        description: "Check your email for the password reset link.",
      })
      setMode("login")
    } catch (error) {
      setShowLoadingModal(false)
      toast.error("Reset failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md glass-card border-border/50 rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="space-y-3">
                <ScaleIn delay={0.1}>
                  <div className="flex items-center justify-center">
                    <motion.img
                      src="/Eureka-01.png"
                      alt="Eureka"
                      className="h-16 w-16 rounded-lg"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                </ScaleIn>
                <FadeInUp delay={0.2}>
                  <DialogTitle className="text-center text-2xl font-bold">
                    {mode === "login" && "Welcome Back"}
                    {mode === "signup" && "Create Account"}
                    {mode === "forgot" && "Reset Password"}
                  </DialogTitle>
                </FadeInUp>
                <FadeInUp delay={0.3}>
                  <DialogDescription className="text-center text-muted-foreground">
                    {mode === "login" && "Sign in to continue your learning journey"}
                    {mode === "signup" && "Start your journey with Eureka"}
                    {mode === "forgot" && "We'll send you a reset link"}
                  </DialogDescription>
                </FadeInUp>
              </DialogHeader>

              <form
                onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword}
                className="space-y-4 pt-4"
              >
                {mode === "signup" && (
                  <FadeInUp delay={0.4}>
                    <motion.div className="space-y-2">
                      <Label htmlFor="displayName" className="text-sm font-medium">
                        Display Name
                      </Label>
                      <div className="relative">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="displayName"
                            type="text"
                            placeholder="Your name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="pl-10 rounded-xl transition-all focus:ring-2"
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  </FadeInUp>
                )}

                <FadeInUp delay={mode === "signup" ? 0.5 : 0.4}>
                  <motion.div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 rounded-xl transition-all focus:ring-2"
                      />
                    </div>
                  </motion.div>
                </FadeInUp>

                {mode !== "forgot" && (
                  <FadeInUp delay={mode === "signup" ? 0.6 : 0.5}>
                    <motion.div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 rounded-xl transition-all focus:ring-2"
                        />
                      </div>
                    </motion.div>
                  </FadeInUp>
                )}

                {mode === "signup" && (
                  <FadeInUp delay={0.7}>
                    <motion.div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pl-10 rounded-xl transition-all focus:ring-2"
                        />
                      </div>
                    </motion.div>
                  </FadeInUp>
                )}

                <FadeInUp delay={mode === "signup" ? 0.8 : mode === "forgot" ? 0.5 : 0.6}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full rounded-xl h-11 font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {mode === "login" && "Sign In"}
                          {mode === "signup" && "Create Account"}
                          {mode === "forgot" && "Send Reset Link"}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </FadeInUp>
              </form>

              <div className="flex flex-col items-center gap-2 pt-4 text-sm">
                {mode === "login" && (
                  <>
                    <motion.button
                      whileHover={{ x: 5 }}
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot your password?
                    </motion.button>
                    <div className="text-muted-foreground">
                      Don&apos;t have an account?{" "}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        type="button"
                        onClick={() => setMode("signup")}
                        className="font-medium text-primary hover:underline"
                      >
                        Sign up
                      </motion.button>
                    </div>
                  </>
                )}

                {mode === "signup" && (
                  <div className="text-muted-foreground">
                    Already have an account?{" "}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-medium text-primary hover:underline"
                    >
                      Sign in
                    </motion.button>
                  </div>
                )}

                {mode === "forgot" && (
                  <motion.button
                    whileHover={{ x: -5 }}
                    type="button"
                    onClick={() => setMode("login")}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={showConfirmation}
        title={confirmationMessage.title}
        description={confirmationMessage.description}
        onConfirm={confirmClose}
        onCancel={cancelClose}
        confirmText="Yes, leave"
        cancelText="Continue"
      />

      <LoadingModal isOpen={showLoadingModal} message="Authenticating..." />
    </>
  )
}
