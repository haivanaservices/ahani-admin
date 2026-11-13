'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '../utils/supabase/server';
import OpenAI from 'openai';
import { Resend } from 'resend';
import { Buffer } from 'buffer';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://ai.ahani.app';
}

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

  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return redirect('/login?error=Email+and+password+are+required');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/// --- QR CAMPAIGN LOGIC ---
export async function createCampaign(formData: FormData) {
  const campaignName = (formData.get('campaignName') as string)?.trim();
  if (!campaignName) throw new Error('Campaign name is required');

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error('No agency found');

  // 1. Create the campaign row
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      agency_id: profile.agency_id,
      name: campaignName,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (error || !campaign) {
    throw new Error(error?.message || 'Failed to create campaign');
  }

  // 2. Generate the Universal Deep Link for Flutter
  const deepLinkUrl = `https://ahani.app/scan/${campaign.id}`;

  // 3. Save the URL back to the campaign
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ qr_code_url: deepLinkUrl })
    .eq('id', campaign.id)
    .eq('agency_id', profile.agency_id);

  if (updateError) {
    console.error('Failed to save QR deep link URL:', updateError);
  }

  // 4. Fire the Resend email notification
  try {
    const resend = getResendClient();
    if (resend && user.email) {
      await resend.emails.send({
        from: 'Ahani Admin <notifications@ahani.ai>',
        to: user.email,
        subject: `Touchpoint Created: ${campaignName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a;">New Campaign Initiated</h2>
            <p style="color: #475569; font-size: 16px;">
              You have successfully generated the routing link for <strong>${campaignName}</strong>.
            </p>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">Routing ID:</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; color: #0f172a; font-size: 16px;">${campaign.id}</p>
            </div>
            <p style="color: #ef4444; font-weight: bold; font-size: 14px;">
              Action Required: Please complete the AI baseline fingerprinting in your dashboard to activate this touchpoint.
            </p>
          </div>
        `,
      });
      console.log(`Notification email sent for campaign: ${campaignName}`);
    }
  } catch (emailError) {
    console.error('Failed to send notification email:', emailError);
  }

  // 5. Return the explicit data object so TypeScript knows 'id' exists
  return {
    id: campaign.id,
    name: campaign.name,
    qr_code_url: deepLinkUrl,
  };
}

/// --- CAMPAIGN FINGERPRINT AI LOGIC ---
export async function setupCampaignFingerprint(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error('No agency found');

  const campaignId = formData.get('campaignId') as string;
  const files = formData.getAll('files') as File[];

  if (!campaignId) throw new Error('Campaign ID is required');
  if (!files || files.length === 0) throw new Error('No files uploaded');

  console.log(`Starting fingerprint process for campaign: ${campaignId}`);

  const uploadedUrls: string[] = [];
  const openaiContent: any[] = [
    {
      type: 'text',
      text: 'Analyze these agency sample documents and generate the Contextual Document DNA Profile.',
    },
  ];
  let validImagesCount = 0;

  for (const file of files) {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filePath = `${profile.agency_id}/${campaignId}/${crypto.randomUUID()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Catch storage errors
    const { error: uploadError } = await supabase.storage
      .from('agency_baselines')
      .upload(filePath, buffer, { contentType: file.type });

    if (uploadError) {
      console.error('SUPABASE STORAGE ERROR:', uploadError);
      throw new Error(`Storage Upload Failed: ${uploadError.message}`);
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from('agency_baselines').getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }

    // 2. Only attach valid images to OpenAI
    if (file.type.startsWith('image/')) {
      const base64Image = buffer.toString('base64');
      openaiContent.push({
        type: 'image_url',
        image_url: { url: `data:${file.type};base64,${base64Image}` },
      });
      validImagesCount++;
    }
  }

  // 3. Anti-hallucination shield
  if (validImagesCount === 0) {
    throw new Error(
      'You must upload at least one IMAGE file (JPG/PNG). PDFs cannot be visually analyzed by this endpoint.'
    );
  }

  console.log(
    `Successfully uploaded ${uploadedUrls.length} files. Contacting OpenAI with ${validImagesCount} images...`
  );

  // 4. Contextual DNA extraction prompt
  let aiMatrix;
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a forensic document profiler for a government language access platform. 
          Analyze the provided sample documents and synthesize an aligned "Contextual Document DNA Profile".
          Look closely at the text, headers, legal phrasing, typography, and subject matter across all samples.
          
          You must return a strict JSON object with the following exact keys:
- "core_entities": Array of strings (Explicit names, department divisions, addresses, phone numbers, form codes).
- "linguistic_markers": Array of strings (Recurring statutory codes, mandatory clauses, legal jargon, specific boilerplate phrases, and tone).
- "contextual_spirit": A concise 2-3 sentence summary defining the exact domain, purpose, and types of mail this campaign issues.`,
        },
        {
          role: 'user',
          content: openaiContent,
        },
      ],
    });

    const aiContent = response.choices[0].message.content || '{}';
    aiMatrix = JSON.parse(aiContent);
    console.log('OpenAI successfully generated Contextual DNA fingerprint:', aiMatrix);
  } catch (openaiError: any) {
    console.error('OPENAI ERROR:', openaiError);
    throw new Error(`OpenAI Processing Failed: ${openaiError.message}`);
  }

  // 5. Catch database update errors (scoped to agency_id)
  const { error: dbError } = await supabase
    .from('campaigns')
    .update({
      fingerprint_rules: {
        status: 'active',
        processed_files: uploadedUrls.length,
        core_entities: aiMatrix.core_entities || [],
        linguistic_markers: aiMatrix.linguistic_markers || [],
        contextual_spirit: aiMatrix.contextual_spirit || 'No context extracted.',
        passing_score: 75,
        total_score: 100,
        baseline_urls: uploadedUrls,
      },
      samples_count: uploadedUrls.length,
    })
    .eq('id', campaignId)
    .eq('agency_id', profile.agency_id);

  if (dbError) {
    console.error('SUPABASE DATABASE ERROR:', dbError);
    throw new Error(`Database Update Failed: ${dbError.message}`);
  }

  console.log('Campaign successfully updated! Redirecting to dashboard...');
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function deleteCampaign(formData: FormData) {
  const campaignId = formData.get('campaignId') as string;
  if (!campaignId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error('No agency found');

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('agency_id', profile.agency_id);

  if (error) {
    console.error('Error deleting campaign:', error);
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
}

export async function resetCampaignFingerprint(formData: FormData) {
  const campaignId = formData.get('campaignId') as string;
  if (!campaignId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error('No agency found');

  const { error } = await supabase
    .from('campaigns')
    .update({
      fingerprint_rules: null,
      samples_count: 0,
    })
    .eq('id', campaignId)
    .eq('agency_id', profile.agency_id);

  if (error) {
    console.error('Error resetting campaign:', error);
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
}

/// --- PASSWORD MANAGEMENT LOGIC ---
export async function resetPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim();

  if (!email) {
    redirect('/forgot-password?error=Email+is+required');
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/update-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/forgot-password?message=Success!+Check+your+email+for+the+password+reset+link.');
}

export async function updateUserPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password !== confirmPassword) {
    redirect('/update-password?error=Passwords+do+not+match');
  }

  if (password.length < 6) {
    redirect('/update-password?error=Password+must+be+at+least+6+characters');
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=Session+expired.+Please+open+your+invite+or+reset+link+again.');
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard');
}