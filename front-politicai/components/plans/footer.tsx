'use client';

import { Lock, ShieldCheck, CreditCard } from 'lucide-react';

export function PlansFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <Lock className="size-8 mb-4 text-green-400" />
            <h3 className="text-lg font-semibold mb-2">Secure Transactions</h3>
            <p className="text-gray-400">
              256-bit SSL encryption for maximum security
            </p>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="size-8 mb-4 text-green-400" />
            <h3 className="text-lg font-semibold mb-2">Protected Payments</h3>
            <p className="text-gray-400">
              Your payment information is always safe
            </p>
          </div>
          <div className="flex flex-col items-center">
            <CreditCard className="size-8 mb-4 text-green-400" />
            <h3 className="text-lg font-semibold mb-2">Trusted Platform</h3>
            <p className="text-gray-400">
              PCI DSS compliant payment processing
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>
            © {new Date().getFullYear()} All rights reserved. Secured by
            industry-leading encryption.
          </p>
        </div>
      </div>
    </footer>
  );
}
