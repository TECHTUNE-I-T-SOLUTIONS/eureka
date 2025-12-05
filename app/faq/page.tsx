"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { HelpCircle, ChevronDown } from "lucide-react"

export default function FAQPage() {
  const [user, setUser] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

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

  const categories = [
    {
      title: "Getting Started",
      questions: [
        {
          id: "start-1",
          q: "How do I create an account?",
          a: "Click the 'Sign Up' button on our homepage, enter your email and password, and you're ready to go! You can also sign in with Google for faster signup.",
        },
        {
          id: "start-2",
          q: "Is Eureka free?",
          a: "Yes! Eureka has a free plan with all basic features. We also offer Pro and Premium plans for power users who need advanced features.",
        },
        {
          id: "start-3",
          q: "What file formats does Eureka support?",
          a: "We support PDF, text files (.txt), and markdown files (.md). You can also paste content directly into the chat.",
        },
      ],
    },
    {
      title: "Using Eureka",
      questions: [
        {
          id: "using-1",
          q: "How do I upload documents?",
          a: "Go to the Notes section and click 'Upload File' or 'Create New Note'. You can drag and drop files or select them from your device.",
        },
        {
          id: "using-2",
          q: "How does the AI summarization work?",
          a: "Eureka uses advanced AI to analyze your documents and create concise summaries highlighting key concepts, important details, and main ideas.",
        },
        {
          id: "using-3",
          q: "Can I chat with Eureka about multiple documents?",
          a: "Yes! You can reference multiple documents in the chat and ask questions about them. Eureka will provide contextual answers based on all your uploaded materials.",
        },
        {
          id: "using-4",
          q: "How are practice questions generated?",
          a: "Our AI analyzes your study materials and generates questions covering the main topics, concepts, and learning objectives.",
        },
      ],
    },
    {
      title: "Privacy and Security",
      questions: [
        {
          id: "privacy-1",
          q: "Is my data safe?",
          a: "Yes. Your data is encrypted in transit and at rest. We follow industry-standard security practices and never sell your data to third parties.",
        },
        {
          id: "privacy-2",
          q: "Can I delete my documents?",
          a: "Yes, you can delete individual documents or your entire account at any time from Settings. Deleted data is permanently removed.",
        },
        {
          id: "privacy-3",
          q: "How is my personal information used?",
          a: "We only use your information to provide our service and improve your experience. Check our Privacy Policy for complete details.",
        },
        {
          id: "privacy-4",
          q: "Is GDPR compliant?",
          a: "Yes, Eureka is fully GDPR compliant. We comply with all major data protection regulations worldwide.",
        },
      ],
    },
    {
      title: "Billing and Account",
      questions: [
        {
          id: "billing-1",
          q: "Can I change my plan anytime?",
          a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
        },
        {
          id: "billing-2",
          q: "What's your refund policy?",
          a: "We offer a 30-day money-back guarantee on all paid plans. Contact support@eureka.study to request a refund.",
        },
        {
          id: "billing-3",
          q: "Do you offer discounts?",
          a: "Yes! Students and educators get 30% off annual plans. Email us at support@eureka.study with proof of enrollment or employment.",
        },
        {
          id: "billing-4",
          q: "What happens when my subscription ends?",
          a: "You'll be downgraded to the free plan. Your data remains accessible but you'll lose access to premium features.",
        },
      ],
    },
    {
      title: "Features and Capabilities",
      questions: [
        {
          id: "features-1",
          q: "What's the difference between Free and Pro plans?",
          a: "Free has basic features with limited uploads. Pro includes unlimited uploads, advanced AI summaries, and custom learning paths. See our pricing page for details.",
        },
        {
          id: "features-2",
          q: "Can I export my notes?",
          a: "Yes! Pro and Premium users can export their notes as PDF or text files from the Notes section.",
        },
        {
          id: "features-3",
          q: "Does Eureka have offline mode?",
          a: "Currently, Eureka requires an internet connection. We're exploring offline capabilities for future releases.",
        },
        {
          id: "features-4",
          q: "Can I share notes with classmates?",
          a: "Not yet, but we're working on collaborative features. Stay tuned for updates!",
        },
      ],
    },
    {
      title: "Technical Support",
      questions: [
        {
          id: "support-1",
          q: "What should I do if I encounter a bug?",
          a: "Please report bugs through the app's feedback section or email support@eureka.study with details about what happened.",
        },
        {
          id: "support-2",
          q: "Why is my upload taking so long?",
          a: "Large files may take longer to process. Check your internet connection and ensure your file is in a supported format.",
        },
        {
          id: "support-3",
          q: "How do I contact support?",
          a: "You can reach our support team via email at support@eureka.study, in-app chat, or through our contact form.",
        },
        {
          id: "support-4",
          q: "What are your support hours?",
          a: "We provide 24/7 support. Premium users get priority support with faster response times.",
        },
      ],
    },
  ]

  const toggleQuestion = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Help Center</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Eureka. Can't find what you're looking for? Contact our support team.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-12">
              {categories.map((category, idx) => (
                <div key={idx}>
                  <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                  <div className="space-y-4">
                    {category.questions.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-lg border border-border/50 hover:border-primary/50 transition-colors overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(question.id)}
                          className="w-full p-6 flex items-start justify-between gap-4 text-left hover:bg-accent/50 transition-colors"
                        >
                          <span className="font-semibold text-foreground pr-4">{question.q}</span>
                          <ChevronDown
                            className={`h-5 w-5 text-primary flex-shrink-0 transition-transform ${
                              expandedId === question.id ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expandedId === question.id && (
                          <div className="px-6 pb-6 text-muted-foreground border-t border-border/50">
                            {question.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="px-4 py-16 sm:py-20 border-t border-border/50">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Didn't find what you're looking for?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our support team is here to help. Reach out anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <a
                href="mailto:support@eureka.study"
                className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
