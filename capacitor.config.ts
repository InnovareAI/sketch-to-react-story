import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bba3997b02894c6baef5aefb7e33e751',
  appName: 'Sam AI',
  webDir: 'dist',
  server: {
    url: 'https://bba3997b-0289-4c6b-aef5-aefb7e33e751.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;