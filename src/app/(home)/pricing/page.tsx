"use client";

import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const clerk = useClerk();
  const [isLoading, setIsLoading] = useState(false);

  const createMutation = useMutation(
    trpc.subscriptions.create.mutationOptions({
      onMutate: () => setIsLoading(true),
      onSuccess: async (sub) => {
        const loadRazorpay = () =>
          new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });

        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error("Failed to load Razorpay SDK. Please try again.");
          setIsLoading(false);
          return;
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
          subscription_id: sub.id,
          name: "Your App Name",
          description: "Monthly Subscription",
          handler: async (response) => {
            verifyMutation.mutate({
              subscriptionId: sub.id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          },
          theme: { color: "#3E3E3E" }, // Claude-like neutral dark theme
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      onError: (err) => {
        toast.error(err.message);
        if (err.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
      onSettled: () => setIsLoading(false),
    }),
  );

  const verifyMutation = useMutation(
    trpc.subscriptions.verify.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        toast.success("Subscription activated successfully!");
      },
      onError: (err) => {
        toast.error(err.message);
        if (err.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
      },
    }),
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1C1C1C] text-gray-100 p-6">
      <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-white">
        Choose Your Plan
      </h1>
      <p className="text-lg text-gray-400 mb-12 max-w-xl text-center">
        Unlock the best features with our premium plan, or start for free with
        the basic plan.
      </p>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Free Plan */}
        <div className="bg-[#2A2A2A] rounded-2xl shadow-xl p-8 flex flex-col items-center border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-2">Free Plan</h2>
          <p className="text-gray-400 mb-6 text-center">
            Access core features at no cost. Perfect to get started.
          </p>
          <p className="text-3xl font-bold text-white mb-6">$0/month</p>
          <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-xl transition">
            Continue Free
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gradient-to-br from-[#3A3A3A] to-[#1F1F1F] rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Premium Plan
          </h2>
          <p className="text-gray-400 mb-6 text-center">
            Full access to all features, priority support, and more.
          </p>
          <p className="text-3xl font-bold text-[#FACC15] mb-6">₹100/month</p>
          <button
            onClick={() => createMutation.mutate({})}
            disabled={createMutation.isPending || isLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-xl disabled:opacity-50 transition"
          >
            {createMutation.isPending || isLoading
              ? "Processing..."
              : "Subscribe Now"}
          </button>
          {createMutation.isError && (
            <p className="text-red-500 mt-4">
              Error: {createMutation.error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
