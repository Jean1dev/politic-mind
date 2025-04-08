import { similaritySearch } from './lib/upstach.ts';
import { getTextFromEstrategias, getTextFromGuiaUsoVotext } from './lib/vetex-agent.ts';

export function routes(fastify: any) {
    
    fastify.get('/vertex-info', async (request: any, reply: any) => {
        try {
            const [estrategias, guiaUsoVotext] = await Promise.all([
                getTextFromEstrategias(),
                getTextFromGuiaUsoVotext()
            ]);
            reply.send({ estrategias, guiaUsoVotext });
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: 'An error occurred while processing your request.' });
        }
    });

    fastify.post('/similarity-search', async (request: any, reply: any) => {
        try {
            const { query, k } = request.body;
            const result = await similaritySearch(query, k);
            reply.send({ similarity: result });
        } catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: 'An error occurred while processing your request.' });
        }
    });
}