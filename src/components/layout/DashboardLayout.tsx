import Sidebar from './Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/contexts/ThemeContext';
import { useAIPersonality } from '@/hooks/useAIPersonality';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Volume2, VolumeX } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleMute, isMuted } = useAIPersonality();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64">
        {/* Header with notification bell and theme toggle */}
        <header className="bg-card border-b border-border px-6 py-3 lg:px-8">
          <div className="flex justify-between items-center">
            <img
              src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmIzeng0Z2NnbzhjdWd5YnZscncxdHBybjVxcHEzcnNyODVkdHB1diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/8VlHDlVE7XFkmhSJzZ/giphy.gif"
              alt="Animated GIF"
              className="w-59 h-12 rounded"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                title={isMuted ? "Unmute AI voice" : "Mute AI voice"}
              >
                {isMuted ? <VolumeX className="h-5 w-5 dark:text-white" /> : <Volume2 className="h-5 w-5 dark:text-white" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
              >
                {theme === "light" ? <Moon className="h-5 w-5 dark:text-white" /> : <Sun className="h-5 w-5 dark:text-white" />}
              </Button>
              <NotificationBell />
            </div>
          </div>
        </header>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
