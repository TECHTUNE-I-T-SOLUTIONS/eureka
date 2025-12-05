"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, X, Zap } from "lucide-react"

export default function PricingPage() {
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

  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: "0",
      period: "Forever free",
      features: [
        { text: "Upload up to 5 documents", included: true },
        { text: "Basic AI summaries", included: true },
        { text: "Chat with Eureka", included: true },
        { text: "Practice questions", included: true },
        { text: "Community support", included: true },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false },
        { text: "Unlimited uploads", included: false },
        { text: "Export study materials", included: false },
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      description: "For serious students",
      price: "9.99",
      period: "per month",
      features: [
        { text: "Unlimited document uploads", included: true },
        { text: "Advanced AI summaries", included: true },
        { text: "Chat with Eureka", included: true },
        { text: "Personalized practice questions", included: true },
        { text: "Email support", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom learning paths", included: true },
        { text: "Export study materials", included: true },
        { text: "Priority support", included: false },
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Premium",
      description: "For power learners",
      price: "19.99",
      period: "per month",
      features: [
        { text: "Unlimited document uploads", included: true },
        { text: "Advanced AI summaries", included: true },
        { text: "Chat with Eureka", included: true },
        { text: "Personalized practice questions", included: true },
        { text: "Priority email support", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom learning paths", included: true },
        { text: "Export study materials", included: true },
        { text: "24/7 Priority support", included: true },
      ],
      cta: "Start Free Trial",
      highlighted: false,
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
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade whenever you're ready. Cancel anytime with no questions asked.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border transition-all ${
                    plan.highlighted
                      ? "border-primary bg-primary/5 shadow-lg scale-105"
                      : "border-border/50 hover:border-primary/50"
                  } p-8 flex flex-col`}
                >
                  {plan.highlighted && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary w-fit px-3 py-1">
                      <Zap className="h-3 w-3 text-white" />
                      <span className="text-xs font-semibold text-white">Most Popular</span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ml-2 text-sm">{plan.period}</span>
                  </div>

                  <button
                    className={`py-2 px-4 rounded-lg font-semibold mb-8 transition-colors ${
                      plan.highlighted
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-primary text-primary hover:bg-primary/5"
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <div className="space-y-4 flex-1">
                    {plan.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-foreground" : "text-muted-foreground/50"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-16 sm:py-20 border-t border-border/50 border-b">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">Can I upgrade or downgrade my plan?</h3>
                <p className="text-muted-foreground">
                  Yes, you can change your plan at any time. Your billing will be adjusted accordingly.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards and digital payment methods through Stripe.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">Is there a free trial?</h3>
                <p className="text-muted-foreground">
                  Yes! Pro and Premium plans come with a 14-day free trial. No credit card required.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">Can I cancel anytime?</h3>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription anytime. No long-term contracts required.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">Do you offer educational discounts?</h3>
                <p className="text-muted-foreground">
                  Yes! Students and educators get 30% off annual plans. Contact us at support@eureka.study.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-3">What happens if I cancel?</h3>
                <p className="text-muted-foreground">
                  You'll lose access to premium features but can still use the free plan. Your data remains accessible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Study Smarter?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start with our free plan or begin a free trial of Pro. No credit card required.
            </p>
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Get Started Free
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
