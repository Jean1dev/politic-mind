import { JSONLoader } from "langchain/document_loaders/fs/json";
import dotenv from "dotenv";

import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory"
import { OpenAIEmbeddings } from "@langchain/openai";
import path from 'path'

dotenv.config();

async function createAgent() {

    const loader = new JSONLoader(path.resolve('..', 'data', "result.json"));
    const documents = await loader.load();

    const vectorStore = await MemoryVectorStore.fromDocuments(documents, new OpenAIEmbeddings());

    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    return chain;
}

export { createAgent };