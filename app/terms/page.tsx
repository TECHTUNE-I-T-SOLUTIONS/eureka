import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/landing/footer"
import { createClient } from "@/lib/supabase/server"

export default async function TermsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl prose dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Acceptance of Terms</h2>
          <p>
            By using Eureka, you agree to these terms of service. If you do not agree, please do not use our service.
          </p>

          <h2>Use of Service</h2>
          <p>
            Eureka is a personal study assistant. You may use it for educational purposes. You are responsible for the
            content you upload and must ensure you have the right to use such content.
          </p>

          <h2>User Content</h2>
          <p>
            You retain ownership of content you upload. By uploading content, you grant Eureka a license to process it
            for the purpose of providing our services.
          </p>

          <h2>Limitations</h2>
          <p>
            Eureka is provided &quot;as is&quot; without warranties. We are not responsible for the accuracy of
            AI-generated content. Always verify important information.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service constitutes acceptance of updated
            terms.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
