import { JSONLoader } from "langchain/document_loaders/fs/json";
import dotenv from "dotenv";

import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { OpenAIEmbeddings } from "@langchain/openai";
import path from 'path'
import { 
    createDocumentsAboutScrapPolitcData,
    createDocumentsAboutDespesasEleicoes2024
} from "../vector-store/enrichment-data-store.js";

dotenv.config();

export async function createAgentJsonLoader() {
    const loader = new JSONLoader(path.resolve('..', 'data', "resultado-scrap-politic-data.json"));
    const documents = await loader.load();

    const embeddings = new OpenAIEmbeddings({
        modelName: "text-embedding-3-large"
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    return chain;
}

export async function createAgentWithDocumentsEmbedding() {
    const scrapPoliticosDocument = createDocumentsAboutScrapPolitcData()
    const despesasDocument = createDocumentsAboutDespesasEleicoes2024()
    const documents = [
        ...scrapPoliticosDocument,
        ...despesasDocument
    ];

    const embeddings = new OpenAIEmbeddings({
        modelName: "text-embedding-3-large"
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);

    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    return chain;
}