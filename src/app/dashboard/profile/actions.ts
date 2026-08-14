'use server';

import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';

const openai = new OpenAI();

export async function establishBaselineFingerprint(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No agency found");

  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) throw new Error("No files uploaded");

  const uploadedUrls: string[] = [];
  const openaiContent: any[] = [{ type: "text", text: "Generate the JSON fingerprint matrix for these documents." }];

  for (const file of files) {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const filePath = `${profile.agency_id}/${Math.random()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('agency_baselines')
      .upload(filePath, buffer, { contentType: file.type });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('agency_baselines').getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }

    if (file.type.startsWith('image/')) {
      const base64Image = buffer.toString('base64');
      openaiContent.push({
        type: "image_url",
        image_url: { url: `data:${file.type};base64,${base64Image}` }
      });
    }
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a forensic document analysis AI extracting structural fingerprint rules for a government agency.
        Analyze the provided sample documents and return a strict JSON object with the following exact keys:
        - "primary_markers": An array of EXACTLY 5 strings representing high-weight identifiers (e.g., exact agency name, specific return address, unique program titles).
        - "contextual_clues": An array of EXACTLY 10 strings representing optional/low-weight identifiers (e.g., boilerplate compliance phrases, standard form footers, barcode locations).
        
        Do NOT extract Personally Identifiable Information (PII). Focus only on the immutable document templates.`
      },
      {
        role: "user",
        content: openaiContent
      }
    ]
  });

  const aiContent = response.choices[0].message.content || '{}';
  const aiMatrix = JSON.parse(aiContent);

  await supabase
    .from('agencies')
    .update({ 
      master_fingerprint_rules: {
        status: "active",
        processed_files: uploadedUrls.length,
        primary_markers: aiMatrix.primary_markers || ["Unidentified"], 
        contextual_clues: aiMatrix.contextual_clues || ["Unidentified"], 
        passing_score: 40, 
        total_score: 100,  
        baseline_urls: uploadedUrls
      } 
    })
    .eq('id', profile.agency_id);

  // Clear cache and redirect
  revalidatePath('/dashboard/profile');
  redirect('/dashboard/profile');
}

// NEW: Function to revoke the profile
export async function revokeProfileFingerprint() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) throw new Error("No agency found");

  await supabase
    .from('agencies')
    .update({ 
      master_fingerprint_rules: null 
    })
    .eq('id', profile.agency_id);

  revalidatePath('/dashboard/profile');
  redirect('/dashboard/profile');
}