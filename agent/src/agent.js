import * as dotenv from "dotenv";
dotenv.config();

import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { BufferMemory } from "langchain/memory";
import { UpstashRedisChatMessageHistory } from "@langchain/community/stores/message/upstash_redis";

const activeSessions = new Map();

function setUpPrompt() {
    return ChatPromptTemplate.fromMessages([
        ("system", "You are a helpful assistant."),
        new MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
        new MessagesPlaceholder("agent_scratchpad"),
    ]);
}

function setUpTools() {
    return [];
}

function createModel() {
    return new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
    });
}

async function getAgentForUser(sessionId) {
    if (activeSessions.has(sessionId)) {
        return activeSessions.get(sessionId);
    }

    const model = createModel()
    const prompt = setUpPrompt()
    const tools = setUpTools()
    const memory = createNewSessionMemoryHistory(sessionId)

    const agent = createToolCallingAgent({
        llm: model,
        prompt,
        tools,
    });

    const executor = new AgentExecutor({
        agent,
        tools,
        //memory,
    });


    activeSessions.set(sessionId, executor);
    return executor;
}

function createNewSessionMemoryHistory(sessionId) {
    return new BufferMemory({
        memoryKey: `chat_history`,
        chatHistory: new UpstashRedisChatMessageHistory({
            sessionId,
            sessionTTL: 300, // 5 minutes, omit this parameter to make sessions never expire
            config: {
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            },
        }),
    });
}

async function processUserMessage(sessionId = 'jeanluca', userMessage = 'hi, how can you help me? my name is jean') {
    console.log(`📝 Mensagem recebida de ${sessionId}: ${userMessage}`);

    const agent = await getAgentForUser(sessionId);
    const response = await agent.invoke({ 
        input: userMessage,
        chat_history: [],
    });

    // Log the response object to inspect the available keys
    console.log('Response:', response);

    // Specify the output key you want to use
    const outputKey = 'output'; // Change this to the appropriate key if needed
    console.log(`💬 Resposta para ${sessionId}: ${response[outputKey]}`);
}

processUserMessage();