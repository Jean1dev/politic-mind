'use client';

import { useEffect, useState, useCallback, type SetStateAction } from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Plans } from '@/lib/db/schema';
import { PlansFooter } from '@/components/plans/footer';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { fetchPlans, subcribeAction } from '../actions';

type PlansResponse = Plans & {
  featured?: boolean;
  fullWidth?: boolean;
};

export default function PaymentPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlansResponse[]>([]);
  const [billingType, setBillingType] = useState<'Cartao de credito' | 'Pix'>(
    'Cartao de credito',
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    fetchPlans((data: SetStateAction<PlansResponse[]>) => setPlans(data));
  }, []);

  const handleSubscribe = useCallback(
    async (planName: string, planId: string) => {
      setLoadingStates((prev) => ({ ...prev, [planName]: true }));

      try {
        const url = await subcribeAction(planId);
        window.open(url, '_blank');
        router.push(`/success?plan=${planName}&type=${billingType}`);
      } catch (error) {
        console.error('Error subscribing to plan:', error);
        toast.error('Error subscribing to plan');
      }
      setLoadingStates((prev) => ({ ...prev, [planName]: false }));
    },
    [billingType],
  );

  return (
    <main className="min-h-screen bg-black text-white py-16 px-4 relative">
      <button
        onClick={() => (window.location.href = '/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-5" />
        <span>Back</span>
      </button>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Pricing Plans</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start building for free, then add a site plan to go live. Account
            plans unlock additional features.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-900 rounded-lg p-1 inline-flex">
            <button
              className={cn(
                'px-6 py-2 rounded-md transition-colors',
                billingType === 'Pix' ? 'bg-gray-800' : 'hover:bg-gray-800/50',
              )}
              onClick={() => setBillingType('Pix')}
            >
              Pix
            </button>
            <button
              className={cn(
                'px-6 py-2 rounded-md transition-colors',
                billingType === 'Cartao de credito'
                  ? 'bg-gray-800'
                  : 'hover:bg-gray-800/50',
              )}
              onClick={() => setBillingType('Cartao de credito')}
            >
              Cartao de credito
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'bg-gray-900 rounded-2xl p-8',
                plan.featured && 'ring-2 ring-pink-500',
                plan.fullWidth && 'lg:col-span-3 lg:max-w-2xl lg:mx-auto',
              )}
            >
              <h3 className="text-2xl font-semibold mb-4">{plan.name}</h3>
              <p className="text-gray-400 mb-8">{plan.description}</p>
              <div className="mb-8">
                <span className="text-5xl font-bold">R$ {plan.price}</span>
                <span className="text-gray-400">/Just one time</span>
              </div>
              <button
                onClick={() => handleSubscribe(plan.name, plan.id)}
                disabled={loadingStates[plan.name]}
                className={cn(
                  'w-full bg-white text-black py-3 rounded-lg font-semibold transition-colors flex items-center justify-center',
                  loadingStates[plan.name]
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:bg-gray-200',
                )}
              >
                {loadingStates[plan.name] ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      <PlansFooter />
    </main>
  );
}
