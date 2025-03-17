import Fastify from 'fastify'
import { similaritySearch } from './lib/upstach.ts';

const fastify = Fastify({ logger: true });
const port = process.env.PORT || 8081;

fastify.post('/similarity-search', async (request: any, reply) => {
    try {
        const { query, k } = request.body;
        const result = await similaritySearch(query, k);
        reply.send({ similarity: result });
    } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

export const start = async () => {
    try {
        await fastify.listen({ port });
        fastify.log.info(`Server is running at http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
