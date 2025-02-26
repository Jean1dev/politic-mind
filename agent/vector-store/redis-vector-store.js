import { RedisVectorStore } from "@langchain/redis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "redis";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
});

const client = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

const vectorStore = new RedisVectorStore(embeddings, {
    redisClient: client,
    indexName: "langchainjs-testing",
});

//https://js.langchain.com/docs/integrations/vectorstores/redis/
export async function searchSimilar(query, topK = 2) {
    if (!client.isOpen) {
        console.log('conectando no redis')
        await client.connect();
    }

    const results = await vectorStore.similaritySearch(query, topK);

    if (results.length > 0) {
        return results[0].pageContent;  // Retorna a resposta mais relevante
    } else {
        return null;
    }
}