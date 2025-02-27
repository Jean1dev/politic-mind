import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "redis";
import { Redis } from "@upstash/redis";
import { RedisVectorStore } from "@langchain/redis";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { formatDespesasEleicoes } from "../agent/vector-store/enrichment-data-store.js";

const getClient = () => {
    if (
        !process.env.UPSTASH_REDIS_REST_URL ||
        !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
        throw new Error(
            "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in the environment"
        );
    }
    const client = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return client;
};

async function addDocuments(vectorStore) {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'big-query', "relacao-candidatos-x-despesas.json"))
    )

    const documentos = parlamentaresJSON.map(formatDespesasEleicoes)
        .map(doc => new Document(doc));

    await vectorStore.addDocuments(documentos);
    console.log("Documentos adicionados ao Redis!");
}

async function setUp() {
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
    });

    const client = createClient({
        url: process.env.REDIS_URL ?? "redis://localhost:6379",
      });
      await client.connect();

    const vectorStore = new RedisVectorStore(embeddings, {
        redisClient: client,
        indexName: "langchainjs-testing",
    });

    await addDocuments(vectorStore)
}

setUp()