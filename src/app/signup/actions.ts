'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '../../utils/supabase/server';

export async function createAgencyAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const agencyName = formData.get('agencyName') as string;
  const agencyAddress = formData.get('agencyAddress') as string;
  
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

  // 1. WORKSPACE DISCOVERY PRE-FLIGHT
  if (!bypassDiscovery && !joinAgencyId) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Relational Join: Grab the agency AND its associated profiles
    const { data: existingAgencies } = await supabaseAdmin
      .from('agencies')
      .select(`
        id, 
        agency_name, 
        address,
        profiles (
          first_name,
          last_name,
          account_type
        )
      `)
      .eq('email_domain', domain);

    if (existingAgencies && existingAgencies.length > 0) {
      // Map the data to find the Admin (Director) for each agency
      const formattedAgencies = existingAgencies.map((agency: any) => {
        const admin = agency.profiles?.find((p: any) => p.account_type === 'admin' || p.role === 'owner');
        const directorName = admin 
          ? `${admin.first_name || ''} ${admin.last_name || ''}`.trim() 
          : 'Unknown Director';

        return {
          id: agency.id,
          agency_name: agency.agency_name,
          address: agency.address,
          director_name: directorName || 'Unknown Director'
        };
      });

      return { status: 'discovery_required', agencies: formattedAgencies };
    }
  }

  // 2. PROCEED WITH SIGNUP
  const supabase = await createClient();
  
  const userMetadata: any = {
    full_name: fullName,
    email_domain: domain
  };

  // EXPLICIT ROLE ASSIGNMENT
  if (joinAgencyId) {
    userMetadata.agency_id = joinAgencyId; 
    userMetadata.role = 'standard'; // Joining an existing chapter (needs approval)
    userMetadata.account_type = 'standard';
  } else {
    userMetadata.agency_name = agencyName; 
    userMetadata.agency_address = agencyAddress;
    userMetadata.role = 'owner'; // Creating a new chapter gives them the keys
    userMetadata.account_type = 'admin';
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