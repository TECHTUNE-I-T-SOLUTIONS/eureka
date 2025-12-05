import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Sparkles className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Button asChild className="rounded-xl gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          Go Home
        </Link>
      </Button>
    </div>
  )
}
