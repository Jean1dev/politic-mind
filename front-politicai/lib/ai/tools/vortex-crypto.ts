import { getCache } from '@/lib/cache/redis';
import { tool } from 'ai';
import { z } from 'zod';

const CACHE_KEY = 'vortex-strategies';

function extractResultFromJson(json: any) {
    const {
        estrategias,
        guiaUsoVotext
    } = json;

    return `
        Estratégias: ${estrategias}
        Guia de Uso: ${guiaUsoVotext}
    `
}

export const requestTradingStrategies = tool({
  description:
    'Fornece informações sobre estratégias de trading e indicadores técnicos baseados na documentacao do vortex.',
  parameters: z.object({
    question: z.string(),
  }),
  execute: async () => {
    const cache = getCache();
    const cachedData = await cache.get(CACHE_KEY);
    if (cachedData) {
      return extractResultFromJson(cachedData);
    }

    const response = await fetch(`https://similarity-search-api-dc504ca1e6e3.herokuapp.com/vertex-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });


    const resultJson = await response.json();
    await cache.set(CACHE_KEY, resultJson, 3 * 24 * 60 * 60); // Cache for 3 days
    
    return extractResultFromJson(resultJson);
  },
});
