import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./_components/app-sidebar"
import InstructorGuard from "@/components/auth/instructor-guard"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <InstructorGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="min-h-full w-screen">
          <SidebarTrigger />
          <div className="md:px-20 py-4 w-full min-h-screen overflow-y-hidden">
              {children}
          </div>
        </main>
      </SidebarProvider>
    </InstructorGuard>
  )
}
