'use server';

import { createClient as createServerClient } from '../../../utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

type TeamProfileRow = {
  id: string;
  email: string | null;
  agency_id: string | null;
  account_type: string | null;
};

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

// 1. Invite a new Admin (or re-attach a previously removed 'individual' user)
export async function inviteAdmin(formData: FormData): Promise<void> {
  const rawEmail = formData.get('email');
  const email: string = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    throw new Error('Email is required.');
  }

  const { user, profile } = await verifyWorkspaceOwner();

  if (user.email?.toLowerCase() === email) {
    throw new Error('You are already a member of this workspace.');
  }

  const supabaseAdmin = getAdminClient();

  // Check if a profile with this email already exists (e.g., a previously removed admin)
  const { data: matchedProfiles, error: profileLookupError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, agency_id, account_type')
    .ilike('email', email)
    .limit(1);

  if (profileLookupError) {
    throw new Error(profileLookupError.message);
  }

  let existingProfile: TeamProfileRow | null =
    (matchedProfiles?.[0] as TeamProfileRow | undefined) ?? null;
  let targetUserId: string | null = existingProfile?.id ?? null;

  // Brand-new email path: send standard Supabase Auth invitation
  if (!targetUserId) {
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        agency_id: profile.agency_id,
        account_type: 'admin',
      },
      redirectTo: 'https://www.ahani.ai/auth/callback',
    });

    if (!inviteError) {
      revalidatePath('/dashboard/team');
      return;
    }

    // Fallback if auth.users already has this email (e.g., legacy profile row with NULL email)
    if (inviteError.message.toLowerCase().includes('already')) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) {
        throw new Error(listError.message);
      }

      const matchedAuthUser = usersPage.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (!matchedAuthUser) {
        throw new Error(inviteError.message);
      }

      targetUserId = matchedAuthUser.id;

      const { data: profileById, error: byIdError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, agency_id, account_type')
        .eq('id', targetUserId)
        .maybeSingle();

      if (byIdError) {
        throw new Error(byIdError.message);
      }

      existingProfile = (profileById as TeamProfileRow | null) ?? null;
    } else {
      throw new Error(inviteError.message);
    }
  }

  if (!targetUserId) {
    throw new Error('Unable to resolve target user account.');
  }

  // Existing user path: enforce strict tenant isolation before re-attaching
  if (existingProfile?.agency_id === profile.agency_id) {
    throw new Error('This user is already a member of your workspace.');
  }

  if (existingProfile?.agency_id && existingProfile.agency_id !== profile.agency_id) {
    throw new Error('This user already belongs to another workspace.');
  }

  // Re-attach detached ('individual' / null agency_id) user as 'admin'
  if (existingProfile) {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        agency_id: profile.agency_id,
        account_type: 'admin',
        email,
      })
      .eq('id', targetUserId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: targetUserId,
      email,
      agency_id: profile.agency_id,
      account_type: 'admin',
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  // Sync auth.users metadata with restored workspace membership
  const { data: authUserLookup } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  const currentMeta = authUserLookup?.user?.user_metadata || {};

  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    user_metadata: {
      ...currentMeta,
      agency_id: profile.agency_id,
      account_type: 'admin',
    },
  });

  if (metaError) {
    throw new Error(metaError.message);
  }

  // If the user never confirmed their account previously, resend setup invite
  if (
    authUserLookup?.user &&
    !authUserLookup.user.email_confirmed_at &&
    !authUserLookup.user.last_sign_in_at
  ) {
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        agency_id: profile.agency_id,
        account_type: 'admin',
      },
      redirectTo: 'https://www.ahani.ai/auth/callback',
    });
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