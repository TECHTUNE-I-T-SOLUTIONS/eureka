"use client"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, AlertCircle, Lock, Gavel, RotateCcw, Mail, CheckCircle2 } from "lucide-react"

export default function TermsPage() {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar user={user} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:py-20 border-b border-border/50">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Gavel className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Our Terms</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully. By accessing and using Eureka, you accept and agree to be bound by and
              comply with these terms and conditions.
            </p>
            <p className="text-sm text-muted-foreground mt-6">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="space-y-8">
              {/* Agreement to Terms */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-3">1. Agreement to Terms</h2>
                    <p className="text-muted-foreground mb-3">
                      By accessing and using Eureka, you agree to be bound by these Terms of Service. If you do not agree
                      to abide by the above, please do not use this service.
                    </p>
                    <p className="text-muted-foreground">
                      These terms may be updated from time to time. Your continued use of the service constitutes acceptance
                      of the updated terms. We recommend reviewing this page periodically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligibility and Account */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">2. Eligibility and Account Registration</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    To use Eureka, you must be at least 13 years old and have the legal capacity to enter into contracts.
                    Parents or guardians of children under 18 are responsible for monitoring and supervising their child's
                    use of the service.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm">
                      <strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of
                      your account credentials and for all activities that occur under your account. You agree to notify us
                      immediately of any unauthorized access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Use License */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">3. Use License</h2>
                <p className="text-muted-foreground mb-4">
                  We grant you a limited, non-exclusive, non-transferable license to use Eureka for lawful educational
                  purposes. You agree not to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Reproduce, duplicate, or copy material from Eureka for commercial purposes</span>
                  </li>
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Use Eureka for any illegal or unauthorized purpose</span>
                  </li>
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Attempt to hack, reverse engineer, or gain unauthorized access</span>
                  </li>
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Upload malware, viruses, or any harmful code</span>
                  </li>
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Harass, abuse, or threaten other users</span>
                  </li>
                  <li className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>Violate any applicable laws or regulations</span>
                  </li>
                </ul>
              </div>

              {/* User Content */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">4. User Content and Ownership</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    You retain full ownership of any content you upload to Eureka (User Content). By uploading content,
                    you grant us a worldwide, non-exclusive license to process and use it to provide our services.
                  </p>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm">
                      <strong>Warranty:</strong> You represent and warrant that you own or have the necessary rights to all
                      User Content and that uploading it does not violate any third-party rights.
                    </p>
                  </div>
                  <p>
                    You are solely responsible for any User Content you upload. We do not endorse or verify the accuracy of
                    User Content or AI-generated responses.
                  </p>
                </div>
              </div>

              {/* AI-Generated Content */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">5. AI-Generated Content and Disclaimers</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Eureka uses artificial intelligence to generate summaries, answers, and practice questions. While we
                    strive for accuracy, AI-generated content may contain errors or inaccuracies.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm mb-2 font-semibold">Important Disclaimers:</p>
                    <ul className="space-y-2 text-sm">
                      <li>Always verify AI-generated content independently</li>
                      <li>Do not rely solely on Eureka for critical academic work</li>
                      <li>We are not responsible for any consequences of using AI-generated content</li>
                      <li>AI responses are for learning assistance only</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Limitation of Liability */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">6. Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-semibold">EUREKA IS PROVIDED AS IS WITHOUT WARRANTIES OF ANY KIND.</p>
                  <p>
                    We do not warrant that our service will be uninterrupted, error-free, or that defects will be corrected.
                    To the fullest extent permitted by law, we are not liable for:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li>Any indirect, incidental, special, or consequential damages</li>
                    <li>Loss of data, profits, or business interruption</li>
                    <li>Accuracy or availability of AI-generated content</li>
                    <li>Your inability to use the service</li>
                  </ul>
                </div>
              </div>

              {/* Indemnification */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">7. Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify, defend, and hold harmless Eureka and its owners, employees, and agents from any
                  claims, damages, or expenses arising from your use of the service, violation of these terms, or
                  infringement of any third-party rights.
                </p>
              </div>

              {/* Account Termination */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">8. Account Suspension and Termination</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    We reserve the right to suspend or terminate your account at any time if we believe you have violated
                    these terms or engaged in prohibited conduct.
                  </p>
                  <p>
                    Upon termination, your right to use the service immediately ceases. You may request deletion of your
                    account data, which will be processed according to our Privacy Policy.
                  </p>
                </div>
              </div>

              {/* Intellectual Property */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">9. Intellectual Property Rights</h2>
                <p className="text-muted-foreground">
                  All content on Eureka, including text, graphics, logos, and software, is the property of Eureka or its
                  content suppliers and is protected by copyright and other intellectual property laws. You may not reproduce,
                  distribute, or transmit any content without our prior written permission.
                </p>
              </div>

              {/* Third-Party Links */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">10. Third-Party Links and Content</h2>
                <p className="text-muted-foreground">
                  Eureka may contain links to third-party websites. We are not responsible for the content, accuracy, or
                  practices of external sites. Your use of third-party services is governed by their terms of service.
                </p>
              </div>

              {/* Modifications to Service */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">11. Modifications to Service</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify, suspend, or discontinue Eureka at any time without notice. We are not
                  liable for any modification, suspension, or discontinuation of the service.
                </p>
              </div>

              {/* Governing Law */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">12. Governing Law</h2>
                <p className="text-muted-foreground">
                  These terms are governed by and construed in accordance with applicable law. Any legal action or proceeding
                  arising from these terms shall be conducted exclusively in the appropriate courts with jurisdiction.
                </p>
              </div>

              {/* Entire Agreement */}
              <div className="space-y-4 pb-8 border-b border-border/50">
                <h2 className="text-2xl font-bold">13. Entire Agreement</h2>
                <p className="text-muted-foreground">
                  These Terms of Service, along with our Privacy Policy, constitute the entire agreement between you and
                  Eureka regarding your use of the service. Any prior agreements are superseded.
                </p>
              </div>

              {/* Contact and Support */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
                <p className="text-muted-foreground mb-6">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <p>support@eureka.study</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gavel className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Legal Inquiries</p>
                      <p>legal@eureka.study</p>
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
