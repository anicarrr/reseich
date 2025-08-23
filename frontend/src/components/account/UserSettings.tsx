'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserIcon, Bell, Shield, Globe, Save, Loader2, AlertCircle } from 'lucide-react';
import type { User } from '@/lib/types';

const settingsSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  email_notifications: z.boolean(),
  research_results_email: z.boolean(),
  marketplace_updates: z.boolean(),
  privacy_level: z.enum(['public', 'private', 'friends']),
  default_research_type: z.enum(['public', 'private']),
  auto_download_results: z.boolean(),
  language: z.enum(['en', 'es', 'fr', 'de', 'zh']),
  timezone: z.string()
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface UserSettingsProps {
  user: User;
  onSaveSettings: (data: SettingsFormData) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  isLoading?: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'zh', label: '中文' }
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' }
];

export const UserSettings: React.FC<UserSettingsProps> = ({ user, onSaveSettings, onDeleteAccount, isLoading = false }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      display_name: user.display_name || '',
      email: user.email || '',
      email_notifications: false, // Default value since User interface doesn't have this
      research_results_email: true, // Default value since User interface doesn't have this
      marketplace_updates: false, // Default value since User interface doesn't have this
      privacy_level: 'private' as const, // Default value since User interface doesn't have this
      default_research_type: 'private' as const, // Default value since User interface doesn't have this
      auto_download_results: false, // Default value since User interface doesn't have this
      language: 'en' as const, // Default value since User interface doesn't have this
      timezone: 'UTC' // Default value since User interface doesn't have this
    }
  });

  const handleSaveSettings = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      await onSaveSettings(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (showDeleteConfirm) {
      await onDeleteAccount();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <UserIcon className="h-5 w-5 text-[#3b82f6]" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your profile information and display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input id="display_name" {...form.register('display_name')} placeholder="Enter your display name" />
              {form.formState.errors.display_name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.display_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...form.register('email')} placeholder="Enter your email" />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={form.watch('language')}
                onValueChange={(value) => form.setValue('language', value as SettingsFormData['language'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={form.watch('timezone')} onValueChange={(value) => form.setValue('timezone', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5 text-[#10b981]" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive general platform updates via email</p>
            </div>
            <Switch
              id="email_notifications"
              checked={form.watch('email_notifications')}
              onCheckedChange={(checked) => form.setValue('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="research_results_email">Research Results Email</Label>
              <p className="text-sm text-muted-foreground">Automatically email research results when completed</p>
            </div>
            <Switch
              id="research_results_email"
              checked={form.watch('research_results_email')}
              onCheckedChange={(checked) => form.setValue('research_results_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketplace_updates">Marketplace Updates</Label>
              <p className="text-sm text-muted-foreground">Notify about marketplace activity and new listings</p>
            </div>
            <Switch
              id="marketplace_updates"
              checked={form.watch('marketplace_updates')}
              onCheckedChange={(checked) => form.setValue('marketplace_updates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Research Settings */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-[#e9407a]" />
            Privacy & Research Settings
          </CardTitle>
          <CardDescription>Control your privacy level and default research preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="privacy_level">Default Privacy Level</Label>
            <Select
              value={form.watch('privacy_level')}
              onValueChange={(value) => form.setValue('privacy_level', value as SettingsFormData['privacy_level'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privacy level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Visible to everyone
                  </div>
                </SelectItem>
                <SelectItem value="selective">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Selective - Choose who can see
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Private - Visible only to you
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="default_research_type">Default Research Type</Label>
            <Select
              value={form.watch('default_research_type')}
              onValueChange={(value) =>
                form.setValue('default_research_type', value as SettingsFormData['default_research_type'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default research type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public Research</SelectItem>
                <SelectItem value="private">Private Research</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_download_results">Auto-download Results</Label>
              <p className="text-sm text-muted-foreground">Automatically download research results when completed</p>
            </div>
            <Switch
              id="auto_download_results"
              checked={form.watch('auto_download_results')}
              onCheckedChange={(checked) => form.setValue('auto_download_results', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={form.handleSubmit(handleSaveSettings)}
          disabled={isSaving || !form.formState.isDirty}
          className="min-w-[120px]"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Account Deletion */}
      <Card className="border-[#ef4444]/30 bg-[#ef4444]/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#ef4444]">
            <AlertCircle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-[#ef4444]/80">Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#ef4444]">Delete Account</p>
              <p className="text-sm text-[#ef4444]/80 mt-1">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive" onClick={handleDeleteAccount} className="min-w-[120px]">
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete Account'}
            </Button>
          </div>

          {showDeleteConfirm && (
            <Alert className="mt-4 border-[#ef4444]/30 bg-[#ef4444]/20">
              <AlertCircle className="h-4 w-4 text-[#ef4444]" />
              <AlertDescription className="text-[#ef4444]">
                This action cannot be undone. All your research, transactions, and account data will be permanently deleted.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
