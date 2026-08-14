'use server';

import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createFirstCampaign(formData: FormData) {
  const agencyId = formData.get('agencyId') as string;
  const campaignName = formData.get('campaignName') as string;

  const supabase = await createClient();

  // 1. Create the new campaign row
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      agency_id: agencyId,
      name: campaignName,
      status: 'Active',
      total_scans: 0
    })
    .select()
    .single();

  if (error || !campaign) {
    redirect(`/setup/qr?error=${encodeURIComponent(error?.message || 'Failed to create campaign')}`);
  }

  // 2. Generate the Universal Deep Link using the new row's UUID
  const qrUrl = `https://ahani.app/scan/${campaign.id}`;

  // 3. Update the row with its permanent URL
  await supabase
    .from('campaigns')
    .update({ qr_code_url: qrUrl })
    .eq('id', campaign.id);

  // 4. Setup is officially complete. Release them to the Dashboard!
  redirect('/dashboard');
}