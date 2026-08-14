'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../utils/supabase/server';

export async function createAgencyAccount(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const agencyName = formData.get('agencyName') as string;

  if (!email || !password) {
    redirect('/signup?error=Email and password are required.');
  }

  // 1. The Enterprise Freemail Blacklist
  const bannedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  
  if (bannedDomains.includes(domain)) {
    redirect('/signup?error=Ahani requires an official agency or corporate email to register.');
  }

  const supabase = await createClient();

  // We pass the agencyName into the metadata. 
  // The Postgres Trigger catches this and automatically builds the workspace in the background.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        full_name: fullName,
        agency_name: agencyName 
      },
    }
  });

  if (authError || !authData.user) {
    redirect(`/signup?error=${encodeURIComponent(authError?.message || 'Auth failed')}`);
  }

  // Once the signup succeeds, we instantly redirect them to check their email. 
  // The trigger has already done its job, and the AI Investigator Edge Function is running in the background!
  redirect('/signup?message=Success! Please check your email to verify your organization address.');
}