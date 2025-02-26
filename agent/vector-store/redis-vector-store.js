import { RedisVectorStore } from "@langchain/redis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "redis";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
});

const client = createClient({
    url: process.env.REDIS_URL
});

export const vectorStore = new RedisVectorStore(embeddings, {
    redisClient: client,
    indexName: "langchainjs-testing",
});

export const searchInVectorStore = async (query) => {
    const retriever = vectorStore.asRetriever({
        k: 2,
    });
    const result = await retriever.invoke(query);
    return result
}