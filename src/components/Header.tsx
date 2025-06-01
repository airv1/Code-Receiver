import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, MessageCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <header className="sticky top-0 border-b border-muted/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">短信转发系统</h1>
        </div>
        
        <nav className="flex items-center gap-4">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `rounded-lg px-3 py-2 transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/10'
              }`
            }
          >
            消息
          </NavLink>
          
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-muted/10"
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="rounded-full p-2 text-error hover:bg-error/10"
            aria-label="退出登录"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;