import { Server } from 'http';

interface GracefulShutdownOptions {
  timeout?: number;
  signals?: string[];
  cleanup?: () => Promise<void>;
}

export function setupGracefulShutdown(
  server: Server,
  options: GracefulShutdownOptions = {}
) {
  const {
    timeout = 10000,
    signals = ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    cleanup
  } = options;

  let shutdownInProgress = false;

  const shutdown = async (signal: string) => {
    if (shutdownInProgress) {
      console.log('Shutdown already in progress...');
      return;
    }

    shutdownInProgress = true;
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    // Set a timeout to force shutdown if graceful shutdown takes too long
    const forceShutdownTimer = setTimeout(() => {
      console.error('❌ Graceful shutdown timed out. Forcing shutdown.');
      process.exit(1);
    }, timeout);

    try {
      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
        } else {
          console.log('✅ Server stopped accepting new connections');
        }

        try {
          // Run custom cleanup if provided
          if (cleanup) {
            console.log('🧹 Running cleanup tasks...');
            await cleanup();
            console.log('✅ Cleanup completed');
          }

          // Clear the force shutdown timer
          clearTimeout(forceShutdownTimer);
          
          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (cleanupError) {
          console.error('❌ Error during cleanup:', cleanupError);
          process.exit(1);
        }
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  };

  // Register signal handlers
  signals.forEach(signal => {
    process.on(signal, () => shutdown(signal));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });

  console.log('🛡️ Graceful shutdown handlers registered');
}