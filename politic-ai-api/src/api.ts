import Fastify from 'fastify'
import { similaritySearch } from './lib/upstach.ts';

const fastify = Fastify({ logger: true });

fastify.post('/similarity-search', async (request: any, reply) => {
    try {
        const { query, k } = request.body;
        const result = await similaritySearch(query, k);
        reply.send({ similarity: result });
    } catch (error) {
        reply.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

export const start = async () => {
    try {
        await fastify.listen({ port: 8081});
        fastify.log.info(`Server is running at http://localhost:8081`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
