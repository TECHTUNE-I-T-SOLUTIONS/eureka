"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield, Lock, Eye, Download, Mail, AlertCircle, CheckCircle2 } from "lucide-react"

export default function PrivacyPage() {
  const [user, setUser] = useState<any>(null)

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

  const sections = [
    {
      icon: Eye,
      title: "Information We Collect",
      items: [
        { label: "Account Information", desc: "Email address, display name, and authentication details" },
        { label: "Study Materials", desc: "Documents, notes, and files you upload" },
        { label: "Usage Data", desc: "How you interact with our service, timestamps, and feature usage" },
        { label: "Device Information", desc: "Browser type, IP address, and device identifiers" },
      ],
    },
    {
      icon: Mail,
      title: "How We Use Your Information",
      items: [
        { desc: "Providing and personalizing our AI-powered study assistance" },
        { desc: "Processing your study materials to generate summaries and answers" },
        { desc: "Improving our service through analytics and user feedback" },
        { desc: "Sending important notifications about your account and service updates" },
        { desc: "Ensuring compliance with legal obligations" },
      ],
    },
    {
      icon: Lock,
      title: "Data Storage and Security",
      items: [
        { desc: "Data encrypted in transit using TLS/SSL" },
        { desc: "Database encryption at rest" },
        { desc: "Regular security audits and penetration testing" },
        { desc: "Limited access to personal data restricted to essential staff" },
      ],
    },
    {
      icon: Download,
      title: "Your Privacy Rights",
      items: [
        { label: "Right to Access", desc: "Request a copy of your personal data" },
        { label: "Right to Correct", desc: "Request correction of inaccurate data" },
        { label: "Right to Delete", desc: "Request deletion of your data (\"right to be forgotten\")" },
        { label: "Right to Export", desc: "Download your data in a portable format" },
        { label: "Right to Opt-Out", desc: "Opt out of marketing communications" },
      ],
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
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Privacy Matters</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We are committed to protecting your personal information and your right to privacy. If you have any
              questions or concerns about this privacy notice, or our privacy practices, please contact us.
            </p>
            <p className="text-sm text-muted-foreground mt-6">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-12">
              {sections.map((section, idx) => {
                const Icon = section.icon
                return (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-3">{section.title}</h2>
                        <ul className="space-y-3 text-muted-foreground">
                          {section.items.map((item: any, itemIdx) => (
                            <li key={itemIdx} className="flex gap-3">
                              <span className="text-primary font-bold flex-shrink-0">•</span>
                              <span>
                                {item.label && <strong>{item.label}: </strong>}
                                {item.desc}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Cookies and Tracking */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience. You can control cookie
                  settings through your browser preferences. Our service requires some cookies for essential functionality
                  like session management and security.
                </p>
              </div>

              {/* Data Retention */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal data for as long as your account is active. You can delete your account and all
                  associated data at any time through your Settings. Certain data may be retained for legal compliance
                  purposes as required by law.
                </p>
              </div>

              {/* Third-Party Sharing */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">Third-Party Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We do not sell your personal data to third parties. We share data with third parties only in these
                  circumstances:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-4">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Service providers who assist us (with confidentiality agreements)</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Legal requirements or court orders</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>Business transfers or acquisitions</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span>With your explicit consent</span>
                  </li>
                </ul>
              </div>

              {/* Children's Privacy */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">Children's Privacy</h2>
                <div className="flex gap-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    Eureka is not intended for children under 13. We do not knowingly collect personal data from children
                    under 13. If we become aware of such collection, we will delete the information promptly. Parents
                    concerned about their child's data should contact us immediately.
                  </p>
                </div>
              </div>

              {/* GDPR Compliance */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">GDPR and International Compliance</h2>
                <p className="text-muted-foreground mb-3">
                  We comply with the General Data Protection Regulation (GDPR) and similar data protection laws worldwide.
                  Your data may be transferred to and processed in countries other than your country of residence. We
                  ensure appropriate safeguards are in place when transferring data internationally.
                </p>
              </div>

              {/* Policy Changes */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy to reflect changes in our practices or legal requirements. We will
                  notify you of significant changes via email or prominent notice on our service. Your continued use of
                  Eureka constitutes acceptance of the updated policy.
                </p>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Questions About Our Privacy Practices?</h2>
                <p className="text-muted-foreground mb-6">
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please
                  contact us:
                </p>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                        <p>
                        <span className="select-none">privacy@eureka.study</span>
                        <a
                          href="mailto:techtune.it.solutions@gmail.com"
                          className="sr-only"
                          tabIndex={-1}
                        >
                          techtune.it.solutions@gmail.com
                        </a>
                        </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Data Subject Request</p>
                      <p>Submit through your account settings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
