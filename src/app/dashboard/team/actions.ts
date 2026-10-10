'use server';

import { createClient as createServerClient } from '../../../utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// 1. Invite a new Admin
export async function inviteAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) throw new Error('Email is required');

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Verify the person sending the invite is an Owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, account_type')
    .eq('id', user.id)
    .single();

  if (!profile || profile.account_type !== 'owner') {
    throw new Error('Only the Workspace Owner can invite team members.');
  }

  // Instantiate the Supabase Admin Client to bypass security rules and send the invite
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  // Send the invite and automatically attach them to the current agency
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { 
      agency_id: profile.agency_id, 
      account_type: 'admin' 
    }
  });

  if (error) throw new Error(error.message);
  
  // Refresh the page data
  revalidatePath('/dashboard/team');
}

// 2. Transfer Ownership
export async function transferOwnership(formData: FormData) {
  const newOwnerId = formData.get('userId') as string;
  const supabase = await createServerClient();
  
  // Call the secure database RPC you created in step 4
  const { error } = await supabase.rpc('transfer_workspace_ownership', { 
    p_new_owner_id: newOwnerId 
  });
  
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/team');
}

// 3. Remove an Admin
export async function removeAdmin(formData: FormData) {
  const adminId = formData.get('userId') as string;
  const supabase = await createServerClient();
  
  // To remove them from the workspace, we simply nullify their agency_id and revert to individual
  const { error } = await supabase
    .from('profiles')
    .update({ agency_id: null, account_type: 'individual' })
    .eq('id', adminId);
    
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/team');
}