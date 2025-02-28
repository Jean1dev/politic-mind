import * as dotenv from "dotenv";
dotenv.config();

import { callAgent, createAgent } from './agent.js';
import express from 'express'

const app = express();
const port = 8081;

app.use(express.json());

app.post('/chat', async (req, res) => {
    const initialMessage = req.body.message;
    const threadId = Date.now().toString(); 
    try {
        const response = await callAgent(initialMessage, threadId);
        res.json({ threadId, response });
    } catch (error) {
        console.error('Error starting conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/chat/:threadId', async (req, res) => {
    const { threadId } = req.params;
    const { message } = req.body;
    try {
        const response = await callAgent(message, threadId);
        res.json({ response });
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, async () => {
    await createAgent();
    console.log(`Server running on port ${port}`);
});