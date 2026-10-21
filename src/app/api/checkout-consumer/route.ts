import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '../../../utils/supabase/server'; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia',
});

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();

    if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Prevent checkout if they haven't verified their email via OTP
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      customer_email: user.email, 
      metadata: { 
        // THIS IS THE FLAG THE WEBHOOK LOOKS FOR
        consumer_email: user.email 
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/scan?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/scan?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Consumer Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}