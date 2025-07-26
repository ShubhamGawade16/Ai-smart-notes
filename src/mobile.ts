// Mobile-specific functionality for AI Smart Notes
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class MobileUtils {
  static async initializeMobileApp() {
    // Hide splash screen after app loads
    await SplashScreen.hide();
    
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark });
    
    // Listen for app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });

    // Handle deep links
    App.addListener('appUrlOpen', (event) => {
      console.log('Deep link opened:', event.url);
      // Handle navigation based on deep link
      // e.g., navigate to specific task or note
    });

    // Keyboard handling for better UX
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`;
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px';
    });
  }

  static async provideFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      const impactStyle = type === 'light' ? ImpactStyle.Light : 
                         type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }

  static async vibrate(duration: number = 100) {
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.log('Vibration not available:', error);
    }
  }

  static isNativeApp(): boolean {
    return typeof window !== 'undefined' && 
           window.location.protocol === 'capacitor:';
  }

  static async getAppInfo() {
    try {
      const info = await App.getInfo();
      return {
        name: info.name,
        id: info.id,
        version: info.version,
        build: info.build
      };
    } catch (error) {
      console.log('Could not get app info:', error);
      return null;
    }
  }

  // PWA install prompt for web version
  static setupPWAInstall() {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install button
      const installButton = document.getElementById('pwa-install-button');
      if (installButton) {
        installButton.style.display = 'block';
        installButton.onclick = async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA install outcome:', outcome);
            deferredPrompt = null;
            installButton.style.display = 'none';
          }
        };
      }
    });
  }

  // Handle network connectivity
  static setupNetworkHandling() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);
      
      // Show offline indicator
      const offlineIndicator = document.getElementById('offline-indicator');
      if (offlineIndicator) {
        offlineIndicator.style.display = isOnline ? 'none' : 'block';
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Initial check
  }
}