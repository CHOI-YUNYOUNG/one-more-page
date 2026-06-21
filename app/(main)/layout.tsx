import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-56 min-h-screen overflow-auto pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
