"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Mail, MessageCircle, MapPin, Clock, Send, Github, Linkedin, Twitter } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        setFormData((prev) => ({
          ...prev,
          name: user.user_metadata?.display_name || "",
          email: user.email || "",
        }))
      }
    }
    getUser()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.")
        setFormData({
          name: user?.user_metadata?.display_name || "",
          email: user?.email || "",
          subject: "",
          message: "",
        })
      } else {
        toast.error("Failed to send message. Please try again.")
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const contacts = [
    {
      icon: Mail,
      title: "Email",
      value: "support@eureka.study",
      description: "Send us an email and we'll get back to you within 24 hours.",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      value: "Available in-app",
      description: "Get instant support directly from the Eureka app.",
    },
    {
      icon: Clock,
      title: "Support Hours",
      value: "24/7 Available",
      description: "Our support team is always here to help you.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Get in Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Reach out to our team and we'll get back to you as soon
              as possible.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Ways to Reach Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {contacts.map((contact, idx) => {
                const Icon = contact.icon
                return (
                  <div key={idx} className="p-6 rounded-lg border border-border/50 text-center hover:border-primary/50 transition-colors">
                    <div className="mb-4 p-3 w-fit mx-auto rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{contact.title}</h3>
                    <p className="text-primary font-semibold text-sm mb-2">{contact.value}</p>
                    <p className="text-muted-foreground text-sm">{contact.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold mb-8 text-center">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-2">How quickly will I get a response?</h3>
                <p className="text-muted-foreground">We typically respond to all inquiries within 24 hours. For urgent matters, you can use our in-app chat support.</p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-2">What should I do if I found a bug?</h3>
                <p className="text-muted-foreground">Please report bugs through the app's feedback section or email us directly at support@eureka.study with details about the issue.</p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-2">Can I request a feature?</h3>
                <p className="text-muted-foreground">Absolutely! We love hearing feature suggestions from our users. Submit your ideas through the feedback section in your account settings.</p>
              </div>
              <div className="p-6 rounded-lg border border-border/50">
                <h3 className="font-bold mb-2">How can I provide feedback?</h3>
                <p className="text-muted-foreground">You can share feedback directly through the app, via email to support@eureka.study, or through this contact form.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Links */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-8">Follow Us</h2>
            <p className="text-muted-foreground mb-8">Stay connected with Eureka on social media for updates, tips, and announcements.</p>
            <div className="flex justify-center gap-6">
              <a href="#" title="GitHub" className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Github className="h-6 w-6" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" title="Twitter" className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" title="LinkedIn" className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Linkedin className="h-6 w-6" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
