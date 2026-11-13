'use server';

import { createClient as createServerClient } from '../../../utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment configuration.');
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyWorkspaceOwner() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, agency_id, account_type')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.agency_id || profile.account_type !== 'owner') {
    throw new Error('Only the Workspace Owner can perform this action.');
  }

  return { supabase, user, profile };
}

// 1. Invite a new Admin
export async function inviteAdmin(formData: FormData): Promise<void> {
  const rawEmail = formData.get('email');
  const email: string = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email) {
    throw new Error('Email is required.');
  }

  const { user, profile } = await verifyWorkspaceOwner();

  if (user.email?.toLowerCase() === email) {
    throw new Error('You are already a member of this workspace.');
  }

  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      agency_id: profile.agency_id,
      account_type: 'admin',
    },
    redirectTo: 'https://www.ahani.ai/auth/callback',
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/team');
}

// 2. Transfer Ownership
export async function transferOwnership(formData: FormData): Promise<void> {
  const rawUserId = formData.get('userId');
  const newOwnerId: string = typeof rawUserId === 'string' ? rawUserId.trim() : '';

  if (!newOwnerId) {
    throw new Error('Target user ID is required.');
  }

  const { supabase, user, profile } = await verifyWorkspaceOwner();

  if (newOwnerId === user.id) {
    throw new Error('You are already the Workspace Owner.');
  }

  const supabaseAdmin = getAdminClient();
  const { data: targetProfile, error: targetError } = await supabaseAdmin
    .from('profiles')
    .select('id, agency_id')
    .eq('id', newOwnerId)
    .eq('agency_id', profile.agency_id)
    .single();

  if (targetError || !targetProfile) {
    throw new Error('Target user does not belong to your workspace.');
  }

  const { error } = await supabase.rpc('transfer_workspace_ownership', {
    p_new_owner_id: newOwnerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/team');
}

// 3. Remove an Admin
export async function removeAdmin(formData: FormData): Promise<void> {
  const rawUserId = formData.get('userId');
  const adminId: string = typeof rawUserId === 'string' ? rawUserId.trim() : '';

  if (!adminId) {
    throw new Error('Target user ID is required.');
  }

  const { user, profile } = await verifyWorkspaceOwner();

  if (adminId === user.id) {
    throw new Error('Transfer ownership before removing yourself from the workspace.');
  }

  const supabaseAdmin = getAdminClient();

  const { data: targetProfile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, agency_id, account_type')
    .eq('id', adminId)
    .eq('agency_id', profile.agency_id)
    .single();

  if (fetchError || !targetProfile) {
    throw new Error('Admin not found in your workspace.');
  }

  if (targetProfile.account_type === 'owner') {
    throw new Error('Cannot remove the Workspace Owner.');
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ agency_id: null, account_type: 'individual' })
    .eq('id', adminId)
    .eq('agency_id', profile.agency_id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/team');
}

// 4. Revoke a Pending Invite
export async function revokeInvite(formData: FormData): Promise<void> {
  const rawUserId = formData.get('userId');
  const userId: string = typeof rawUserId === 'string' ? rawUserId.trim() : '';

  if (!userId) {
    throw new Error('User ID is required.');
  }

  const { user, profile } = await verifyWorkspaceOwner();

  if (userId === user.id) {
    throw new Error('Cannot revoke your own account.');
  }

  const supabaseAdmin = getAdminClient();

  const { data: targetAuth, error: authLookupError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (authLookupError || !targetAuth?.user) {
    throw new Error('Pending invite not found.');
  }

  const targetUser = targetAuth.user;
  const metadataAgencyId = targetUser.user_metadata?.agency_id;

  const { data: targetProfile } = await supabaseAdmin
    .from('profiles')
    .select('agency_id, account_type')
    .eq('id', userId)
    .maybeSingle();

  const belongsToAgency =
    targetProfile?.agency_id === profile.agency_id || metadataAgencyId === profile.agency_id;

  if (!belongsToAgency) {
    throw new Error('Unauthorized: Invite does not belong to your workspace.');
  }

  if (targetProfile?.account_type === 'owner') {
    throw new Error('Cannot revoke a Workspace Owner.');
  }

  if (targetUser.last_sign_in_at || targetUser.email_confirmed_at) {
    throw new Error('User has already accepted the invite. Use Remove instead.');
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard/team');
}