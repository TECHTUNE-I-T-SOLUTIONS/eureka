"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  notes: "Notes",
  chat: "Chat",
  settings: "Settings",
  notifications: "Notifications",
}

export function DashboardHeader() {
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/")
      const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLast = index === segments.length - 1
      return { name, path, isLast }
    })
  }, [pathname])

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.path}>
              {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.path} className="hidden md:block">
                  {crumb.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
