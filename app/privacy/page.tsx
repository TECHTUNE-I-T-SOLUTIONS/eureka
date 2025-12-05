import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { createClient } from "@/lib/supabase/server"

export default async function PrivacyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl prose dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Information We Collect</h2>
          <p>
            Eureka collects information you provide directly, including your email address, display name, and study
            materials you upload. We also collect usage data to improve our service.
          </p>

          <h2>How We Use Your Information</h2>
          <p>
            Your study materials are processed to provide AI-powered summaries, answers, and practice questions. We do
            not share your personal data with third parties except as necessary to provide our services.
          </p>

          <h2>Data Storage</h2>
          <p>
            Your data is stored securely using industry-standard encryption. You can export or delete your data at any
            time from the Settings page.
          </p>

          <h2>Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. Contact us if you have any questions
            about your data.
          </p>

          <h2>Contact</h2>
          <p>For privacy-related inquiries, please contact us through the app.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
