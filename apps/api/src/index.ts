import app, { WebSocketService } from './app';
import { config } from './config';
import { networkInterfaces } from 'os';

const PORT = config.port;

// Utility function to get local network IP
function getLocalNetworkIP(): string {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          return alias.address;
        }
      }
    }
  }
  return 'localhost';
}

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  const localIP = getLocalNetworkIP();
  
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`📱 Mobile App Connection: http://${localIP}:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/ws/notifications`);
  
  // Initialize WebSocket service after server starts
  try {
    console.log('🔌 Initializing WebSocket service...');
    const wsService = WebSocketService.getInstance();
    wsService.initialize(server);
    console.log('✅ WebSocket service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize WebSocket service:', error);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
