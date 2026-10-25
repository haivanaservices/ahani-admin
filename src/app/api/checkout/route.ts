import { NextResponse } from 'next/server';
import Stripe from 'stripe';
// Adjust this path if your utils folder is located elsewhere
import { createClient } from '../../../utils/supabase/server'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia',
});

export async function POST(req: Request) {
  try {
    // 1. We only take the priceId from the frontend now.
    // We ignore any agencyId they try to send us.
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    // 2. Securely identify the user via their encrypted cookies
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Fetch their true agency_id directly from the database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.agency_id) {
      return NextResponse.json({ error: 'Agency profile not found' }, { status: 403 });
    }

    const secureAgencyId = profile.agency_id;

    // Dynamically determine the base URL to prevent localhost redirects in production
    const origin = req.headers.get('origin');
    const baseUrl = origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.ahani.ai';

    // 4. Generate the Stripe Checkout Session using the verified ID
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      // Attach the verified agency ID so the webhook knows who paid
      metadata: { agency_id: secureAgencyId },
      // THIS FORCES THEM DIRECTLY TO THE BILLING DASHBOARD WITH THE SUCCESS/CANCEL FLAG
      success_url: `${baseUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/billing?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}