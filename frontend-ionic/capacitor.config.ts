import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'li.lippke.s20',
  appName: 'Todo',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: false,
      launchShowDuration: 0,
      splashImmersive: false,
      showSpinner: true,
      backgroundColor: '#000000', // YOUR SPLASH SCREEN MAIN COLOR
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
};

export default config;
