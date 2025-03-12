import { getPlans, saveUserLimit } from "@/lib/db/queries";
import { Plans } from "@/lib/db/schema";

async function createOneLink() {
    const apiKey = process.env.API_FINANCE_KEY || 'none'
    const response = await fetch('https://caixinha-financeira-9a2031b303cc.herokuapp.com/stripe/payment-link', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            quantity: 1,
            priceId: 'price_1QtwdmG7OpCiJ6QLVBXrO7fn'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to create payment link');
    }

    const data = await response.json();
    return data;
}

async function subscribeUserToPlan(userId: string, plan: Plans) {
    const planRefToUpgradeMap: { [key: string]: number } = {
        'prod_Rvjw1xg0YAJ8Ye': 50,
        'prod_RvjwP9WwOX23rA': 500,
        'prod_RvjwluWOXhqI8m': 1500,
    };

    const iteractionsUpgrade = planRefToUpgradeMap[plan.planRef] || 0;

    const oneLink = await createOneLink()
    await saveUserLimit(userId, 0, iteractionsUpgrade);

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