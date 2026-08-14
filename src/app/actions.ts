"use server";

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '../utils/supabase/server'; 

export async function submitContactForm(formData: FormData) {
  const supabase = await createClient();

  const data = {
    first_name: formData.get('firstName'),
    last_name: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    agency_name: formData.get('agencyName'),
    message: formData.get('message'),
  };

  const { error } = await supabase.from('contact_inquiries').insert(data);

  if (error) {
    console.error('Error submitting contact form:', error);
  }

  redirect('/contact?status=success');
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?error=Invalid credentials');
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

// --- NEW QR CAMPAIGN LOGIC ---
export async function createCampaign(formData: FormData) {
  const campaignName = formData.get('campaignName') as string;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No agency found");

  // 1. Create the campaign row
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      agency_id: profile.agency_id,
      name: campaignName,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // 2. Generate the Universal Deep Link for Flutter
  const deepLinkUrl = `https://ahani.app/scan/${campaign.id}`;

  // 3. Save the URL back to the campaign
  await supabase
    .from('campaigns')
    .update({ qr_code_url: deepLinkUrl })
    .eq('id', campaign.id);

  // 4. Refresh the dashboard data
  revalidatePath('/dashboard');
  
  return { ...campaign, qr_code_url: deepLinkUrl };
}