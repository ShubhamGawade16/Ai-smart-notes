// Production notification configuration for Firebase and APNs

interface NotificationConfig {
  fcm: {
    serverKey: string;
    senderId: string;
    enabled: boolean;
  };
  apns: {
    keyPath: string;
    keyId: string;
    teamId: string;
    bundleId: string;
    environment: 'production' | 'sandbox';
    enabled: boolean;
  };
  web: {
    vapidPublicKey: string;
    vapidPrivateKey: string;
    enabled: boolean;
  };
}

export const notificationConfig: NotificationConfig = {
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || '',
    senderId: process.env.FCM_SENDER_ID || '',
    enabled: !!(process.env.FCM_SERVER_KEY && process.env.FCM_SENDER_ID)
  },
  apns: {
    keyPath: process.env.APNS_KEY_PATH || './apns_cert.pem',
    keyId: process.env.APNS_KEY_ID || '',
    teamId: process.env.APNS_TEAM_ID || '',
    bundleId: process.env.APNS_BUNDLE_ID || 'com.aismartnotes.app',
    environment: (process.env.APNS_ENVIRONMENT as 'production' | 'sandbox') || 'production',
    enabled: !!(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID)
  },
  web: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    enabled: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
  }
};

// Log configuration status on startup
console.log('📱 Notification Configuration:');
console.log(`  FCM (Android): ${notificationConfig.fcm.enabled ? '✅ Enabled' : '❌ Disabled - Missing FCM_SERVER_KEY or FCM_SENDER_ID'}`);
console.log(`  APNs (iOS): ${notificationConfig.apns.enabled ? '✅ Enabled' : '❌ Disabled - Missing APNS_KEY_ID or APNS_TEAM_ID'}`);
console.log(`  Web Push: ${notificationConfig.web.enabled ? '✅ Enabled' : '❌ Disabled - Missing VAPID keys'}`);

export default notificationConfig;