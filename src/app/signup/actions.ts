'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '../../utils/supabase/server';

export async function createAgencyAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const agencyName = formData.get('agencyName') as string;
  const agencyAddress = formData.get('agencyAddress') as string;
  
  // NEW: Catch the user's decision from the discovery UI
  const bypassDiscovery = formData.get('bypassDiscovery') === 'true';
  const joinAgencyId = formData.get('joinAgencyId') as string | null;

  const bannedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
  ];
  const domain = email.split('@')[1].toLowerCase();
  
  if (bannedDomains.includes(domain)) {
    return { error: 'Ahani requires an official agency or corporate email to register.' };
  }

  // 1. WORKSPACE DISCOVERY PRE-FLIGHT (Only runs if they haven't made a choice yet)
  if (!bypassDiscovery && !joinAgencyId) {
    // Use the Service Role Key to safely look past RLS for the domain check
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingAgencies } = await supabaseAdmin
      .from('agencies')
      .select('id, agency_name, address')
      .eq('email_domain', domain);

    if (existingAgencies && existingAgencies.length > 0) {
      // 🛑 PAUSE: Send the list back to the frontend to ask the user what they want to do
      return { status: 'discovery_required', agencies: existingAgencies };
    }
  }

  // 2. PROCEED WITH SIGNUP (They made a choice, or no domain existed)
  const supabase = await createClient();
  
  // Build the metadata payload. If they clicked "Join", inject the agency_id so the trigger catches it.
  const userMetadata: any = {
    full_name: fullName,
    email_domain: domain
  };

  if (joinAgencyId) {
    userMetadata.agency_id = joinAgencyId; // Trigger: Scenario A (Employee/Member)
  } else {
    userMetadata.agency_name = agencyName; // Trigger: Scenario B (Solo Founder/New Chapter)
    userMetadata.agency_address = agencyAddress;
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userMetadata }
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Auth failed' };
  }

  return { success: true };
}