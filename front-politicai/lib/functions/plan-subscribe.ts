import { createSubscribePlan, getPlans } from "@/lib/db/queries";
import { Plans } from "@/lib/db/schema";

const apiKey = process.env.API_FINANCE_KEY || 'none'
const clientId = process.env.API_FINANCE_CLIENT_ID || 'none'

async function retrievePriceId(productId: string): Promise<string> {
    const response = await fetch(
        `https://caixinha-financeira-9a2031b303cc.herokuapp.com/stripe/products/${productId}`,
        {
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
        }
    );

    if (!response.ok) {
        throw new Error('Failed to get price id');
    }

    const data = await response.json();
    return data.associatedPrice;
}

async function createOneLink(priceId: string, userId: string) {
    const response = await fetch('https://caixinha-financeira-9a2031b303cc.herokuapp.com/stripe/payment-link', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
            'client-id': clientId
        },
        body: JSON.stringify({
            quantity: 1,
            priceId,
            externalReferenceId: userId
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create payment link');
    }

    const data = await response.json();
    return data;
}

async function subscribeUserToPlan(userId: string, plan: Plans) {
    const priceId = await retrievePriceId(plan.planRef);
    const oneLink = await createOneLink(priceId, userId);
    await createSubscribePlan(plan.id, userId);

    return oneLink
}

async function checkIfPlanExists(planId: string): Promise<Plans | undefined> {
    const plans = await getPlans();
    return plans.find(i => i.id === planId);
}

export async function subscribeOnPlan(
    userId: string,
    planId: string): Promise<{ url: string, id: string }> {
    if (!userId || !planId) {
        throw new Error("User ID and Plan ID are required");
    }

    const planExists = await checkIfPlanExists(planId);
    if (!planExists) {
        throw new Error("Plan does not exist");
    }

    const infoPayment = await subscribeUserToPlan(userId, planExists);
    return infoPayment;
}