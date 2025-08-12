import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    if (initialTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      updateCSSVariables('light');
    } else {
      document.documentElement.classList.remove('light');
      updateCSSVariables('dark');
    }
  };

  const updateCSSVariables = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    if (theme === 'light') {
      // Light theme colors
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 6.7%');
      root.style.setProperty('--card', '0 0% 97.3%');
      root.style.setProperty('--card-foreground', '0 0% 6.7%');
      root.style.setProperty('--popover', '0 0% 97.3%');
      root.style.setProperty('--popover-foreground', '0 0% 6.7%');
      root.style.setProperty('--primary', '265 73% 60%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 97.3%');
      root.style.setProperty('--secondary-foreground', '0 0% 12.2%');
      root.style.setProperty('--muted', '0 0% 94.5%');
      root.style.setProperty('--muted-foreground', '0 0% 42%');
      root.style.setProperty('--accent', '265 73% 60%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--destructive', '0 71% 61%');
      root.style.setProperty('--destructive-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 0% / 0.08');
      root.style.setProperty('--input', '0 0% 0% / 0.12');
      root.style.setProperty('--ring', '265 73% 60%');
    } else {
      // Dark theme colors
      root.style.setProperty('--background', '0 0% 4.3%');
      root.style.setProperty('--foreground', '0 0% 96%');
      root.style.setProperty('--card', '0 0% 7.8%');
      root.style.setProperty('--card-foreground', '0 0% 96%');
      root.style.setProperty('--popover', '0 0% 7.8%');
      root.style.setProperty('--popover-foreground', '0 0% 96%');
      root.style.setProperty('--primary', '265 73% 60%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 7.8%');
      root.style.setProperty('--secondary-foreground', '0 0% 90%');
      root.style.setProperty('--muted', '0 0% 10.2%');
      root.style.setProperty('--muted-foreground', '0 0% 63%');
      root.style.setProperty('--accent', '265 73% 60%');
      root.style.setProperty('--accent-foreground', '0 0% 100%');
      root.style.setProperty('--destructive', '0 71% 61%');
      root.style.setProperty('--destructive-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 100% / 0.1');
      root.style.setProperty('--input', '0 0% 100% / 0.1');
      root.style.setProperty('--ring', '265 73% 60%');
    }
  };

  return (
    <div className="flex gap-1 p-1 bg-card rounded-lg border border-border">
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => theme === 'light' && toggleTheme()}
        className="h-8 px-3"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => theme === 'dark' && toggleTheme()}
        className="h-8 px-3"
      >
        <Sun className="h-4 w-4" />
      </Button>
    </div>
  );
}