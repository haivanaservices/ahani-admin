'use server';

import { createClient } from '../../../utils/supabase/server';

export async function sendAccessRequest(formData: FormData) {
  const agencyId = formData.get('agencyId') as string;
  const requesterEmail = formData.get('requesterEmail') as string;
  const requesterName = formData.get('requesterName') as string;

  if (!agencyId || !requesterEmail || !requesterName) {
    throw new Error("Please provide your name and email.");
  }

  const supabase = await createClient();

  // 1. Securely find the Owner of the existing agency
  const { data: owner } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('agency_id', agencyId)
    .eq('account_type', 'owner')
    .single();

  if (!owner || !owner.email) {
    throw new Error("Could not locate the workspace owner for this organization.");
  }

  // 2. Dispatch the Email Notification
  // Wire this into your existing automated email delivery (Resend / SES / etc.)
  const emailPayload = {
    to: owner.email,
    subject: `Workspace Access Request: ${requesterName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hello ${owner.first_name || 'Admin'},</h2>
        <p><strong>${requesterName}</strong> (${requesterEmail}) is trying to create an Ahani account for your organization.</p>
        <p>To keep your organization's data unified, we paused their registration.</p>
        <p>If you would like to grant them access to your workspace, please log in and send them an invite from your Team Access dashboard:</p>
        <br/>
        <a href="https://yourdomain.com/dashboard/team" style="padding: 12px 24px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Manage Team Access</a>
      </div>
    `
  };

  // Replace with your actual email sending function
  console.log("Mock Email Dispatch:", emailPayload); 
  // await myEmailService.send(emailPayload);

  return { success: true };
}