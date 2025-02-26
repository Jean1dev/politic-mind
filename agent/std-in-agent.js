import readline from "readline";
import dotenv from "dotenv";
import { searchSimilar } from "./vector-store/redis-vector-store.js";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config(); 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const chatModel = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
});

async function generateResponse(userQuery) {
    const context = await searchSimilar(userQuery);

    let prompt;
    if (context) {
        prompt = `Baseado nesta informação encontrada no banco de dados: "${context}", responda a esta pergunta: "${userQuery}"`;
    } else {
        prompt = `Responda da melhor forma possível a esta pergunta: "${userQuery}"`;
    }

    const response = await chatModel.invoke(prompt);
    return response.content;
}

async function chat() {
    console.log("\n🤖 Chatbot Inteligente iniciado! Digite sua pergunta ou 'sair' para encerrar.\n");

    rl.setPrompt("Você: ");
    rl.prompt();

    rl.on("line", async (input) => {
        if (input.toLowerCase() === "sair") {
            console.log("👋 Chat encerrado. Até mais!");
            process.exit(0)
        }

        const response = await generateResponse(input);
        console.log(`🤖 Bot: ${response}\n`);
        rl.prompt();
    });
}

chat()