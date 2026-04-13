"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import {
  LayoutDashboard,
  Briefcase,
  Columns3,
  User,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { signOut, useSession } from "@/lib/auth-client"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Jobs", href: "/jobs", icon: Briefcase },
  { title: "Tracker", href: "/tracker", icon: Columns3 },
]

function AppSidebar({ current }: { current?: string }) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleSignOut() {
    await signOut()
    router.replace("/")
    router.refresh()
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex size-8 items-center justify-center bg-[var(--amber)]">
                  <span className="font-mono text-xs font-bold text-[var(--amber-foreground)]">
                    E
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-mono text-sm font-semibold tracking-tight">
                    EMPLOIFY
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 font-mono text-[0.65rem] font-semibold tracking-widest uppercase">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const active = current === item.title.toLowerCase()
                return (
                  <SidebarMenuItem
                    key={item.href}
                    className={cn(
                      "border-l-2 transition-colors",
                      active ? "border-[var(--amber)]" : "border-transparent"
                    )}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(isMobile && "h-11 text-base")}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem
            className={cn(
              "border-l-2 transition-colors",
              current === "profile"
                ? "border-[var(--amber)]"
                : "border-transparent"
            )}
          >
            <SidebarMenuButton
              asChild
              tooltip="Profile"
              isActive={current === "profile"}
              className={cn(isMobile && "h-11 text-base")}
            >
              <Link href="/profile">
                <User className="size-4" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => void handleSignOut()}
              tooltip="Sign out"
              className={cn(isMobile && "h-11 text-base")}
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function SidebarLayout({
  children,
  current,
}: {
  children: React.ReactNode
  current?: string
}) {
  return (
    <SidebarProvider>
      <AppSidebar current={current} />
      <SidebarInset>
        {/* Top bar with trigger */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1 size-7" />
          <div
            className="h-4 w-px bg-border"
            aria-hidden="true"
          />
          <span className="font-mono text-xs font-semibold tracking-widest text-[var(--amber)] uppercase">
            {current}
          </span>
        </header>

        <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
