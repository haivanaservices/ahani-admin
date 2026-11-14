import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '../../../utils/supabase/server';

const ALLOWED_PRICE_TIERS: Record<string, string> = {
  price_1U7gEgF94hMxkhyPLoqTR6RF: 'top_off',
  price_1U7NnLF94hMxkhyPlOLK97Vo: 'department',
  price_1U7NofF94hMxkhyPI4uw5PBC: 'enterprise',
};

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }

  return new Stripe(secretKey, {
    apiVersion: '2026-08-26.dahlia',
  });
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return 'https://www.ahani.ai';
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const priceId = typeof body?.priceId === 'string' ? body.priceId.trim() : '';

    if (!priceId || !ALLOWED_PRICE_TIERS[priceId]) {
      return NextResponse.json({ error: 'Invalid or unsupported price tier.' }, { status: 400 });
    }

    // Verify authenticated user via encrypted session cookies
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's profile without hardcoding optional columns that may live on agencies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Checkout profile lookup error:', profileError);
      return NextResponse.json({ error: 'Failed to load workspace profile.' }, { status: 500 });
    }

    if (
      !profile?.agency_id ||
      (profile.account_type !== 'owner' && profile.account_type !== 'admin')
    ) {
      return NextResponse.json({ error: 'Agency profile not found.' }, { status: 403 });
    }

    // Confirm workspace exists and check verification status safely if present
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', profile.agency_id)
      .single();

    if (agencyError || !agency) {
      console.error('Checkout agency lookup error:', agencyError);
      return NextResponse.json({ error: 'Agency workspace not found.' }, { status: 403 });
    }

    if (
      profile.is_verified_enterprise === false ||
      agency.is_verified_enterprise === false
    ) {
      return NextResponse.json(
        { error: 'Workspace pending verification review.' },
        { status: 403 }
      );
    }

    const stripe = getStripeClient();
    const baseUrl = getBaseUrl();
    const planTier = ALLOWED_PRICE_TIERS[priceId];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'us_bank_account'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      customer_email: user.email || undefined,
      metadata: {
        agency_id: profile.agency_id,
        plan_tier: planTier,
        purchased_by: user.id,
      },
      success_url: `${baseUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/billing?checkout=canceled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to generate Stripe Checkout URL.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Stripe Checkout Error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}