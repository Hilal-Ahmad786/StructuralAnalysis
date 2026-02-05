/**
 * Settings Page
 * 
 * User preferences for the application.
 */

import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login?redirect=/settings');
  }

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
      }}
    />
  );
}
