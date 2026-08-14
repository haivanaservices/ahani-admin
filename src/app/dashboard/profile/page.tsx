import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function MasterProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) redirect('/login');

  const { data: agency } = await supabase
    .from('agencies')
    .select('agency_name, master_fingerprint_rules')
    .eq('id', profile.agency_id)
    .single();

  const hasFingerprint = agency?.master_fingerprint_rules !== null && Object.keys(agency?.master_fingerprint_rules || {}).length > 1;

  return (
    <ProfileClient 
      agencyName={agency?.agency_name || 'Agency'} 
      hasFingerprint={hasFingerprint} 
      agencyId={profile.agency_id}
    />
  );
}