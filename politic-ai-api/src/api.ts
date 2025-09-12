import Fastify from 'fastify';
import { similaritySearch } from './lib/upstach';
import { getTextFromEstrategias, getTextFromGuiaUsoVotext } from './lib/vetex-agent';
import { processCSVFromUrl } from './lib/csv-processor';

const fastify = Fastify({ logger: true });
const port = parseInt(process.env.PORT || '8081');

fastify.get('/vertex-info', async (request, reply) => {
    try {
        const estrategias = await getTextFromEstrategias();
        const guiaUsoVotext = await getTextFromGuiaUsoVotext();
        reply.send({ estrategias, guiaUsoVotext });
    } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'An error occurred while processing your request.' });
    }
});

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

fastify.post('/process-csv', async (request: any, reply) => {
    try {
        const { url } = request.body;
        
        if (!url) {
            return reply.status(400).send({ error: 'URL do CSV é obrigatória' });
        }

        if (!url.toLowerCase().endsWith('.csv')) {
            return reply.status(400).send({ error: 'URL deve apontar para um arquivo CSV' });
        }

        const result = await processCSVFromUrl(url);
        
        reply.send({
            success: true,
            data: {
                totalChunks: result.totalChunks,
                originalFileName: result.originalFileName,
                chunks: result.chunks.map(chunk => ({
                    pageContent: chunk.pageContent,
                    metadata: chunk.metadata
                }))
            }
        });
    } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ 
            error: 'Erro ao processar CSV', 
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
});

export const start = () => {
    fastify.listen({ port, host: '0.0.0.0' })
        .catch(err => {
            fastify.log.error(err);
            process.exit(1);
        });
};
