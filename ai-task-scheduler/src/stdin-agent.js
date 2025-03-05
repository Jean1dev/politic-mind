import readline from "readline";
import dotenv from "dotenv";
import { 
    createModel, 
    extractJsonFromInput,
    responseToString
 } from "./model/index.js";

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const model = createModel();

async function generateResponse(input) {
    return extractJsonFromInput(input, model);
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
        console.log(`🤖 Bot: ${responseToString(response)}\n`);
        rl.prompt();
    });
}

chat()