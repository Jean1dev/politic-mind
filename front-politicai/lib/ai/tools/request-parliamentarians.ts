import { tool } from 'ai';
import { z } from 'zod';

export const requestParliamentarians = tool({
  description:
    'Search for information about politicians, senators and deputies',
  parameters: z.object({
    question: z.string(),
  }),
  execute: async ({ question }) => {
    const response = await fetch(`http://localhost:8081/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: question }),
    });

    const resultJson = await response.json();
    return resultJson.received;
  },
});
