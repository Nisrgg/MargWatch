import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  userId?: string;
  message?: string;
  timestamp?: string;
}

export class WebSocketService {
    private static instance: WebSocketService;
    private wss: WebSocketServer | null = null;
    private clients: Map<string, WebSocket> = new Map();

    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    initialize(server: any): void {
        console.log('🚀 Initializing WebSocket server...');
        
        this.wss = new WebSocketServer({
            server,
            path: '/ws/notifications'
        });

        this.wss.on('connection', (ws: WebSocket, req: any) => {
            console.log('🔌 New WebSocket connection attempt from:', {
                url: req.url,
                headers: req.headers,
                remoteAddress: req.socket.remoteAddress,
                userAgent: req.headers['user-agent']
            });
            
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            
            console.log('🔍 Token extraction:', {
                fullUrl: req.url,
                searchParams: url.searchParams.toString(),
                tokenPresent: !!token,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
            });
            
            if (!token) {
                console.log('❌ No token provided, closing connection');
                ws.close(1008, 'Authentication required');
                return;
            }

            try {
                console.log('🔐 Attempting JWT verification...');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required'); })()) as JWTPayload;
                console.log(`✅ WebSocket authenticated for user:`, {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    iat: decoded.iat,
                    exp: decoded.exp
                });
                
                // Store client connection
                this.clients.set(decoded.id, ws);
                
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'WebSocket connection established',
                    userId: decoded.id
                }));

                // Handle messages from client
                ws.on('message', (data: Buffer) => {
                    try {
                        const message: WebSocketMessage = JSON.parse(data.toString());
                        console.log('📨 Received WebSocket message:', message);
                        
                        // Echo back the message
                        ws.send(JSON.stringify({
                            type: 'echo',
                            originalMessage: message,
                            timestamp: new Date().toISOString()
                        }));
                    } catch (error) {
                        console.error('❌ Error processing WebSocket message:', error);
                    }
                });

                // Handle disconnection
                ws.on('close', () => {
                    console.log(`🔌 WebSocket disconnected for user: ${decoded.email}`);
                    this.clients.delete(decoded.id);
                });

                // Handle errors
                ws.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.clients.delete(decoded.id);
                });

            } catch (error) {
                console.log('❌ JWT verification failed:', {
                    error: error instanceof Error ? error.message : error,
                    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
                    jwtSecret: process.env.JWT_SECRET ? 'present' : 'missing'
                });
                ws.close(1008, 'Invalid token');
            }
        });

        console.log('✅ WebSocket server initialized on /ws/notifications');
    }

    // Send notification to specific user
    sendToUser(userId: string, message: WebSocketMessage): boolean {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify({
                    type: 'notification',
                    data: message,
                    timestamp: new Date().toISOString()
                }));
                console.log(`📤 Sent WebSocket notification to user: ${userId}`);
                return true;
            } catch (error) {
                console.error('❌ Error sending WebSocket message:', error);
                this.clients.delete(userId);
                return false;
            }
        }
        return false;
    }

    // Send notification to multiple users
    sendToMultipleUsers(userIds: string[], message: WebSocketMessage): number {
        let sentCount = 0;
        userIds.forEach(userId => {
            if (this.sendToUser(userId, message)) {
                sentCount++;
            }
        });
        console.log(`📤 Sent WebSocket notification to ${sentCount}/${userIds.length} users`);
        return sentCount;
    }

    // Broadcast to all connected users
    broadcast(message: WebSocketMessage): number {
        let sentCount = 0;
        this.clients.forEach((client, userId) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify({
                        type: 'broadcast',
                        data: message,
                        timestamp: new Date().toISOString()
                    }));
                    sentCount++;
                } catch (error) {
                    console.error('❌ Error broadcasting message:', error);
                    this.clients.delete(userId);
                }
            }
        });
        console.log(`📢 Broadcasted message to ${sentCount} users`);
        return sentCount;
    }

    // Get connected users count
    getConnectedUsersCount(): number {
        return this.clients.size;
    }

    // Get connected users list
    getConnectedUsers(): string[] {
        return Array.from(this.clients.keys());
    }
}
