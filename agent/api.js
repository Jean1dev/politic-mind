import express from 'express'
import { createAgentWithDocumentsEmbedding } from './in-memory/agent.js';

const app = express();
const port = 8081;
let agent

app.use(express.json());

app.post('/message', async (req, res) => {
    const message = req.body.message;
    if (message) {
        const resposta = await agent.call({
            question: message,
            chat_history: []
        })

        console.log(resposta)
        res.status(200).send({ received: resposta.text });
    } else {
        res.status(400).send({ error: 'Message is required' });
    }
});

app.listen(port, async () => {
    agent = await createAgentWithDocumentsEmbedding()
    console.log(`Server is running on port ${port}`);
});