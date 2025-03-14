import { tool } from 'ai';
import { z } from 'zod';

function format(similarity: any[]) {
  return similarity.map(i => i.pageContent).join('\n\n');
}

export const requestParliamentarians = tool({
  description:
    'Search for information about politicians, senators and deputies',
  parameters: z.object({
    question: z.string(),
  }),
  execute: async ({ question }) => {
    const response = await fetch(`http://localhost:8081/similarity-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: question,
        k: 2
      }),
    });

    const resultJson = await response.json();
    return {
      content: `Essas foram as informacoes que eu encontrei ${format(resultJson.similarity)}`
    }
  },
});
