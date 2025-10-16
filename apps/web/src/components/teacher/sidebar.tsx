import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'My Courses', href: '/teacher/courses', icon: BookOpen },
  { name: 'Students', href: '/teacher/students', icon: Users },
  { name: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
  { name: 'Resources', href: '/teacher/resources', icon: FileText },
  { name: 'Settings', href: '/teacher/settings', icon: Settings },
];

export function TeacherSidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      )}
      aria-label="Teacher navigation sidebar"
    >
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <Link to="/teacher/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Bibliology</span>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" aria-label="Primary">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus-ring',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center',
              )}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        {user && (
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <Avatar className="h-10 w-10">
              {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => void handleLogout()}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors focus-ring"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}
