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
import { Loader2, Mail, Lock, User, ArrowLeft, Sparkles } from "lucide-react"

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success("Welcome back!", {
        description: "You've successfully logged in.",
      })
      onOpenChange(false)
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
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

    setIsLoading(true)

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

      toast.success("Check your email!", {
        description: "We've sent you a confirmation link.",
      })
      setMode("login")
    } catch (error) {
      toast.error("Signup failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success("Reset link sent!", {
        description: "Check your email for the password reset link.",
      })
      setMode("login")
    } catch (error) {
      toast.error("Reset failed", {
        description: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-border/50 rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 flex h-18 w-18 items-center justify-center rounded-2xl text-primary-foreground">
              <img src="/Eureka-01.png" alt="Eureka" className="h-16 w-16 rounded-lg" /> <br />
              {/* <p className="text-lg font-semibold">Eureka</p> */}
            </div>

            {/* <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <img src="/Eureka-01.png" alt="Eureka" className="h-8 w-8 rounded-lg" />
            </div> */}
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {mode === "login" && "Welcome Back"}
            {mode === "signup" && "Create Account"}
            {mode === "forgot" && "Reset Password"}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {mode === "login" && "Sign in to continue your learning journey"}
            {mode === "signup" && "Start your journey with Eureka"}
            {mode === "forgot" && "We'll send you a reset link"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword}
          className="space-y-4 pt-4"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
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
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
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
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          )}

          {mode === "signup" && (
            <div className="space-y-2">
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
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full rounded-xl h-11 font-semibold" disabled={isLoading}>
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
        </form>

        <div className="flex flex-col items-center gap-2 pt-4 text-sm">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot your password?
              </button>
              <div className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <div className="text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
