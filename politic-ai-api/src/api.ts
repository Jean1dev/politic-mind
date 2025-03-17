import Fastify from 'fastify';
import { similaritySearch } from './lib/upstach.ts';

const fastify = Fastify({ logger: true });
const port = parseInt(process.env.PORT || '8081');

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

export const start = () => {
    fastify.listen({ port, host: '0.0.0.0' })
        .catch(err => {
            fastify.log.error(err);
            process.exit(1);
        });
};
