import { Check, Shield, Zap, CreditCard, ArrowRight, Rocket } from 'lucide-react';

export default function BillingTiers() {
  // Placeholder for the agency's current active plan
  const currentPlan = "free_pilot"; // Simulating a brand new agency exploring the dashboard

  const tiers = [
    {
      id: "free_pilot",
      name: "Self-Serve Pilot",
      scans: "1,000",
      price: "$0",
      description: "Zero friction. Generate your first QR code and test with real citizens today.",
      features: ["1,000 Audio Scans", "1 Master Fingerprint", "Basic Analytics", "Community Support"],
      buttonText: "Active Plan",
      procurement: "No PO Required",
      highlight: true
    },
    {
      id: "clinic",
      name: "Single Clinic",
      scans: "30,000",
      price: "$4,900",
      description: "Micro-purchase friendly. Ideal for local clinics or single-office deployments.",
      features: ["Up to 30,000 Audio Scans", "3 Master Fingerprints", "Title VI Analytics", "Standard Support"],
      buttonText: "Upgrade to Clinic",
      procurement: "Under $5k Limit",
      highlight: false
    },
    {
      id: "department",
      name: "Department",
      scans: "100,000",
      price: "$11,900",
      description: "Standard Purchase Order. Best for high-traffic city or county departments.",
      features: ["Up to 100,000 Audio Scans", "10 Master Fingerprints", "Title VI Analytics", "Priority Support"],
      buttonText: "Upgrade to Dept",
      procurement: "Under $15k Limit",
      highlight: false
    },
    {
      id: "county",
      name: "County Agency",
      scans: "250,000",
      price: "$24,500",
      description: "Bypasses formal RFP. Built for agencies mailing hundreds of thousands of notices.",
      features: ["Up to 250,000 Audio Scans", "Unlimited Fingerprints", "API Access", "Dedicated Manager"],
      buttonText: "Upgrade to County",
      procurement: "Under $25k Limit",
      highlight: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Billing & Capacity</h1>
          <p className="text-slate-500 mt-1">Manage your annual scan quota and procurement tiers.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">Current Balance</p>
          <p className="text-2xl font-extrabold text-blue-600">1,000 <span className="text-sm text-slate-500 font-medium">scans remaining</span></p>
        </div>
      </div>

      {/* Active Subscription Banner - Tailored for the Free Pilot */}
      <div className="bg-slate-900 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-400/30 text-blue-400">
            <Rocket size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Self-Serve Pilot Active</h2>
            <p className="text-slate-400 text-sm">You are currently testing Ahani. No credit card required.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm">
            Generate First QR Code
          </button>
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
                  ? 'border-blue-600 shadow-lg ring-1 ring-blue-600' 
                  : tier.highlight 
                    ? 'border-slate-300 shadow-md' 
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-sm">
                  ACTIVE PLAN
                </div>
              )}
              
              <div className="mb-6 mt-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md mb-3 inline-block">
                  {tier.procurement}
                </span>
                <p className="text-slate-500 text-sm h-16">{tier.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-3xl font-extrabold text-slate-900">{tier.price}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {tier.price === "$0" ? "free forever" : "per year, billed annually"}
                </p>
                <p className="text-sm font-bold text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
                  {tier.scans} total scans
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

              <button 
                disabled={isActive}
                className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition ${
                  isActive 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                }`}
              >
                {tier.buttonText}
                {!isActive && <ArrowRight size={16} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enterprise Catch-all */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col md:flex-row items-center justify-between mt-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} />
            Need state-wide capacity?
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            State-level deployments starting at 500,000+ scans ($48,900/yr). Includes custom domain routing.
          </p>
        </div>
        <button className="mt-4 md:mt-0 bg-white border border-slate-300 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition shadow-sm">
          Contact Enterprise Sales
        </button>
      </div>

    </div>
  );
}