import { 
    getPendingPlanForUser, 
    getPlans, 
    saveUserLimit, 
    updateSubscribePlanToPayed
 } from "@/lib/db/queries";
import { Plans } from "@/lib/db/schema";

async function searchPlan(id: string): Promise<Plans> {
    const plans = await getPlans();
    const finded = plans.find(i => i.id === id);

    if (!finded)
        throw new Error('Plan not found')

    return finded
}

export async function completeSubscriptionForUser(userId: string) {
    const subscribePlan = await getPendingPlanForUser(userId);
    const plan = await searchPlan(subscribePlan.planId);

    const planRefToUpgradeMap: { [key: string]: number } = {
        'prod_RwC7RoAOM1YfqG': 50,
        'prod_RwC7v0U239A49T': 500,
        'prod_RwC7tLRZo8abjj': 1500,
    };

    const iteractionsUpgrade = planRefToUpgradeMap[plan.planRef] || 0;

    await updateSubscribePlanToPayed(subscribePlan.id)
    await saveUserLimit(userId, 0, iteractionsUpgrade);
}