import Fastify from 'fastify';
import { routes } from './routes.ts';

const fastify = Fastify({ logger: true });
const port = parseInt(process.env.PORT || '8081');

export const start = () => {
    routes(fastify);
    fastify.listen({ port, host: '0.0.0.0' })
        .catch(err => {
            fastify.log.error(err);
            process.exit(1);
        });
};
