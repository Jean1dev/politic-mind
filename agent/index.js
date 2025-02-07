// import * as dotenv from "dotenv";
// dotenv.config();

import { createAgentWithDocumentsEmbedding } from "./in-memory/agent.js";

// import { searchInVectorStore } from "./redis-vector-store.js";

// import { ChatOpenAI } from "@langchain/openai";

// const model = new ChatOpenAI({
//     modelName: "gpt-3.5-turbo",
//     temperature: 0.7,
// });

// // Função para gerar resposta baseada nos dados do Redis Vector Store
// async function generateResponse(query) {
//     const data = await searchInVectorStore(query);
//     const response = await model.generate({
//         prompt: `Baseado nos seguintes dados: ${JSON.stringify(data)}, responda a pergunta: ${query}`,
//     });
//     return response;
// }

// // Exemplo de uso
// const query = "Me informacoes sobre o parlamentar ARNALDO CALIL PEREIRA JARDIM";
// generateResponse(query).then(response => {
//     console.log("Resposta do agente:", response);
// }).catch(error => {
//     console.error("Erro ao gerar resposta:", error);
// }).finally(() => process.exit(0))

async function test() {
    const agent = await createAgentWithDocumentsEmbedding()
    const resposta = await agent.call({
        question: "Me informacoes sobre o parlamentar ARNALDO CALIL PEREIRA JARDIM",
        chat_history: []
    });
    console.log(resposta)
}

test()