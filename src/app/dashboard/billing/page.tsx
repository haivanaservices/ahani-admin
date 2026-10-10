import { Check, Shield, Zap, Calendar, CreditCard, Building } from 'lucide-react';
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import CheckoutButton from './CheckoutButton'; // Adjust import path as needed

// Add export const instant = false if you are using Next.js 15+ and getting the pre-rendering error here too
export const instant = false; 

export default async function BillingTiers() {
  const supabase = await createClient();
  
  // 1. Fetch User & Profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) redirect('/login');

  // 2. Fetch Real Wallet Balance
  const { data: subscription } = await supabase
    .from('annual_subscriptions')
    .select('plan_tier, max_scans, scans_used, expires_at')
    .eq('agency_id', profile.agency_id)
    .single();

  const currentPlan = subscription?.plan_tier || "free_pilot";
  const balance = (subscription?.max_scans || 0) - (subscription?.scans_used || 0);
  
  // Format the expiration date nicely
  const expirationDate = subscription?.expires_at 
    ? new Date(subscription.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  const tiers = [
    {
      id: "free_pilot",
      priceId: null, // No Stripe ID for free tier
      name: "Self-Serve Pilot",
      sessions: "1,000",
      price: "$0",
      description: "Zero friction. Upload your baseline documents and test with real citizens today.",
      features: ["1,000 Document Assist Sessions", "Unlimited Document Fingerprints", "Unlimited QR Routing", "Title VI Analytics"],
      buttonText: "Active Plan",
      procurement: "No PO Required",
      highlight: false,
      icon: <Shield className="text-slate-400" size={20} />
    },
    {
      id: "top_off",
      priceId: "price_1U7gEgF94hMxkhyPLoqTR6RF", // Replace with a Stripe Price ID when you create this one!
      name: "Standard Top-Off",
      sessions: "+30,000",
      price: "$4,900",
      description: "Micro-purchase friendly. Instantly add capacity and extend your account expiration by 365 days.",
      features: ["Adds 30,000 Sessions", "Extends Expiration 1 Year", "Instant Access", "Pay via P-Card (Stripe)"],
      buttonText: "Top Off Balance",
      procurement: "Under $5k Limit",
      highlight: true,
      icon: <CreditCard className="text-blue-500" size={20} />
    },
    {
      id: "department",
      priceId: "price_1U7NnLF94hMxkhyPlOLK97Vo", // Real $9,900 ID
      name: "Department Tier",
      sessions: "+100,000",
      price: "$9,900",
      description: "Standard P-Card Purchase. Best for high-traffic city or county departments.",
      features: ["Adds 100,000 Sessions", "Extends Expiration 1 Year", "Invoice Provided", "Pay via ACH or Card"],
      buttonText: "Purchase via Stripe",
      procurement: "Under $10k Limit",
      highlight: false,
      icon: <Zap className="text-slate-400" size={20} />
    },
    {
      id: "enterprise",
      priceId: "price_1U7NofF94hMxkhyPI4uw5PBC", // Real $24,500 ID
      name: "Enterprise Tier",
      sessions: "+250,000",
      price: "$24,500",
      description: "Bypasses formal RFP. Built for transit authorities, state agencies, and sprawling networks.",
      features: ["Adds 250,000 Sessions", "Extends Expiration 1 Year", "Enterprise Invoicing", "Pay via ACH or Wire"],
      buttonText: "Generate Invoice / Pay",
      procurement: "Under $25k Limit",
      highlight: false,
      icon: <Building className="text-slate-400" size={20} />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Page Header with Real Database Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Billing & Capacity</h1>
          <p className="text-slate-500 mt-1">Manage your session quota, top-offs, and procurement.</p>
        </div>
        
        <div className="flex items-center gap-6 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-3xl font-extrabold text-blue-600 leading-none">
              {balance.toLocaleString()} <span className="text-sm text-slate-500 font-medium">sessions</span>
            </p>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={14} /> Valid Until
            </p>
            <p className="text-lg font-bold text-slate-800 leading-none mt-1.5">
              {expirationDate}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {tiers.map((tier) => {
          const isActive = tier.id === currentPlan;
          
          return (
            <div 
              key={tier.id} 
              className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                isActive 
                  ? 'border-slate-300 shadow-sm' 
                  : tier.highlight 
                    ? 'border-blue-500 shadow-lg ring-1 ring-blue-500/50 relative overflow-hidden' 
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {tier.highlight && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-500"></div>
              )}

              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm border border-slate-300">
                  ACTIVE PLAN
                </div>
              )}
              
              <div className="mb-6 mt-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {tier.icon}
                    {tier.name}
                  </h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md mb-3 inline-block ${
                  tier.highlight ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tier.procurement}
                </span>
                <p className="text-slate-500 text-sm h-16">{tier.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-3xl font-extrabold text-slate-900">{tier.price}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {tier.price === "$0" ? "free forever" : "one-time payment"}
                </p>
                <p className={`text-sm font-bold mt-2 inline-block px-2 py-1 rounded ${
                  tier.highlight ? 'bg-blue-100 text-blue-800' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {tier.sessions} sessions
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <Check size={18} className="text-green-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* The New Interactive Client Component */}
              <CheckoutButton 
                agencyId={profile.agency_id}
                priceId={tier.priceId}
                buttonText={tier.buttonText}
                isActive={isActive}
                highlight={tier.highlight}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}