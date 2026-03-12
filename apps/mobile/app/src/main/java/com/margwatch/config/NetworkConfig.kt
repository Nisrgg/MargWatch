package com.margwatch.config

/**
 * Network Configuration for MargWatch
 * 
 * Update this file whenever you change WiFi networks
 * This centralizes all IP address management
 */
object NetworkConfig {
    
    // Current WiFi IP Address - UPDATE THIS WHEN YOU CHANGE NETWORKS
    const val CURRENT_WIFI_IP = "172.25.166.92"
    
    // Development URLs
    const val DEV_BASE_URL_EMULATOR = "http://10.0.2.2:5000/api/"
    const val DEV_BASE_URL_PHYSICAL = "http://$CURRENT_WIFI_IP:5000/api/"
    
    // Production URL (when you deploy)
    const val PROD_BASE_URL = "https://api.margwatch.com/api/"
    
    // Choose the appropriate URL based on your setup
    const val BASE_URL = DEV_BASE_URL_PHYSICAL
    
    // SSE URL for notifications
    const val SSE_BASE_URL = "http://$CURRENT_WIFI_IP:5000/api/"
    
    // WebSocket URL for notifications
    const val WS_BASE_URL = "ws://$CURRENT_WIFI_IP:5000/ws/notifications"
    
    // Allowed domains for network security
    val ALLOWED_DOMAINS = listOf(
        CURRENT_WIFI_IP,
        "10.0.2.2",
        "localhost",
        "127.0.0.1",
        "192.168.1.100",
        "172.25.219.222"
    )
}
