import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { formatDespesasEleicoes, formatParlamentarDocument } from "../agent/vector-store/enrichment-data-store.js";

import { Index } from "@upstash/vector";

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
});

const indexWithCredentials = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

const vectorStore = new UpstashVectorStore(embeddings, {
    index: indexWithCredentials,
    namespace: "dense-vector",
});

async function addDocumentsCandidatosXDespesas() {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'big-query', "relacao-candidatos-x-despesas.json"))
    )

    const documentos = parlamentaresJSON.map(formatDespesasEleicoes)
        .map(doc => new Document(doc));

    await vectorStore.addDocuments(documentos);
    console.log("Documentos adicionados ao Vector!");
}

async function addDocumentsScrapPoliticData() {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'data', "resultado-scrap-politic-data.json"))
    )

    const documentos = parlamentaresJSON.map(formatParlamentarDocument)
        .map(doc => new Document(doc));

    await vectorStore.addDocuments(documentos);
    console.log("Documentos adicionados ao Vector!");
}

async function consulta() {
    const similaritySearchResults = await vectorStore.similaritySearch(
        "biology",
        2,
    );

    for (const doc of similaritySearchResults) {
        console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`);
    }
}
