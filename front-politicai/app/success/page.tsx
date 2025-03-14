"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const type = searchParams.get("type");

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="py-16 px-4 relative">
        <Link 
          href="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          
          <h1 className="text-4xl font-bold mb-6">Thank You for Subscribing!</h1>
          
          <div className="bg-gray-900 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Plan:</span>
                <span className="font-semibold">{plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Billing Period:</span>
                <span className="font-semibold capitalize">{type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="font-semibold">informacao</span>
              </div>
            </div>
          </div>

          <p className="text-gray-400 mb-8">
            To complete your subscription, please proceed to the payment page. You will receive a confirmation email once the payment is processed.
          </p>

          <a 
            href="#" 
            className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert("This is a demo. In a real application, this would redirect to a payment processor.");
            }}
          >
            Proceed to Payment
          </a>
        </div>
      </main>
    </div>
  );
}