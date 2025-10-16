'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  ServerIcon,
  DatabaseIcon,
  CloudIcon,
  KeyIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  Settings,
  Bell,
  Shield,
  Server,
  Database,
  Cloud,
  Key,
  Globe,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SystemSettings {
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: 'weak' | 'medium' | 'strong';
    twoFactorAuth: boolean;
    ipWhitelist: string[];
  };
  system: {
    maintenanceMode: boolean;
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  integrations: {
    cloudinaryApiKey: string;
    firebaseConfig: string;
    mlServiceUrl: string;
    webhookUrl: string;
  };
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationFrequency: 'immediate',
    },
    security: {
      sessionTimeout: 30,
      passwordPolicy: 'medium',
      twoFactorAuth: false,
      ipWhitelist: [],
    },
    system: {
      maintenanceMode: false,
      autoBackup: true,
      backupFrequency: 'daily',
      logLevel: 'info',
    },
    integrations: {
      cloudinaryApiKey: '',
      firebaseConfig: '',
      mlServiceUrl: '',
      webhookUrl: '',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      // Here you would typically save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    // Reset to default settings
    setSettings({
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notificationFrequency: 'immediate',
      },
      security: {
        sessionTimeout: 30,
        passwordPolicy: 'medium',
        twoFactorAuth: false,
        ipWhitelist: [],
      },
      system: {
        maintenanceMode: false,
        autoBackup: true,
        backupFrequency: 'daily',
        logLevel: 'info',
      },
      integrations: {
        cloudinaryApiKey: '',
        firebaseConfig: '',
        mlServiceUrl: '',
        webhookUrl: '',
      },
    });
    setHasChanges(true);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure system settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleResetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveSettings} disabled={!hasChanges || isLoading}>
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure notification preferences and delivery methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <Select
                    value={settings.notifications.emailNotifications ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('notifications', 'emailNotifications', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Push Notifications</label>
                  <Select
                    value={settings.notifications.pushNotifications ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('notifications', 'pushNotifications', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SMS Notifications</label>
                  <Select
                    value={settings.notifications.smsNotifications ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('notifications', 'smsNotifications', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notification Frequency</label>
                  <Select
                    value={settings.notifications.notificationFrequency}
                    onValueChange={(value) => handleSettingChange('notifications', 'notificationFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security
              </CardTitle>
              <CardDescription>
                Manage security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout (minutes)</label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password Policy</label>
                  <Select
                    value={settings.security.passwordPolicy}
                    onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Two-Factor Authentication</label>
                  <Select
                    value={settings.security.twoFactorAuth ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('security', 'twoFactorAuth', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System
              </CardTitle>
              <CardDescription>
                Configure system behavior and maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maintenance Mode</label>
                  <Select
                    value={settings.system.maintenanceMode ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('system', 'maintenanceMode', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto Backup</label>
                  <Select
                    value={settings.system.autoBackup ? 'enabled' : 'disabled'}
                    onValueChange={(value) => handleSettingChange('system', 'autoBackup', value === 'enabled')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enabled">Enabled</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Backup Frequency</label>
                  <Select
                    value={settings.system.backupFrequency}
                    onValueChange={(value) => handleSettingChange('system', 'backupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Log Level</label>
                  <Select
                    value={settings.system.logLevel}
                    onValueChange={(value) => handleSettingChange('system', 'logLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cloud className="h-5 w-5 mr-2" />
                Integrations
              </CardTitle>
              <CardDescription>
                Configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cloudinary API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter Cloudinary API key"
                    value={settings.integrations.cloudinaryApiKey}
                    onChange={(e) => handleSettingChange('integrations', 'cloudinaryApiKey', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Firebase Configuration</label>
                  <Input
                    type="password"
                    placeholder="Enter Firebase config"
                    value={settings.integrations.firebaseConfig}
                    onChange={(e) => handleSettingChange('integrations', 'firebaseConfig', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ML Service URL</label>
                  <Input
                    placeholder="Enter ML service URL"
                    value={settings.integrations.mlServiceUrl}
                    onChange={(e) => handleSettingChange('integrations', 'mlServiceUrl', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    placeholder="Enter webhook URL"
                    value={settings.integrations.webhookUrl}
                    onChange={(e) => handleSettingChange('integrations', 'webhookUrl', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                System Status
              </CardTitle>
              <CardDescription>
                Monitor system health and service status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="success">Online</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium">API Server</span>
                  <Badge variant="success">Online</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-warning-600" />
                  <span className="text-sm font-medium">ML Service</span>
                  <Badge variant="warning">Degraded</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-600" />
                  <span className="text-sm font-medium">File Storage</span>
                  <Badge variant="success">Online</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}