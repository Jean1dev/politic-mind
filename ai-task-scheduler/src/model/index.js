import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import * as chrono from 'chrono-node/pt';

const SYSTEM_PROMPT_TEMPLATE = [
    "Answer the user's query. You must return your answer as JSON that matches the given schema:",
    "```json\n{schema}\n```.",
    "Make sure to wrap the answer in ```json and ``` tags. Conform to the given schema exactly.",
].join("\n");

export function createModel() {
    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.9,
    });

    return model;
}

function createSchema() {
    const schema = z.object({
        operationType: z.string().describe('The type of operation to perform. Must be one of "add", "remove", or "list".'),
        task: z.string().optional().describe('The task to add or remove. Required for "add" and "remove" operations.'),
        time: z.string().optional().describe('The time to schedule the task. Required for "add" operations.'),
    });

    return schema;
}

function extractDataOutput(message) {
    const when = message.time;

    const parsedDate = chrono.parseDate(when);

    if (!parsedDate) {
        throw new Error(`Unable to parse date from input: ${when}`);
    }

    return {
        ...message,
        time: parsedDate,
    };
}

export function extractJsonFromInput(inputMessage, model) {
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT_TEMPLATE],
        ["human", "{query}"],
    ]);

    const schema = createSchema();
    const outputParser = StructuredOutputParser.fromZodSchema(schema);

    const chain = prompt
        .pipe(model)
        .pipe(outputParser)
        .pipe(extractDataOutput);

    return chain.invoke({ 
        query: inputMessage,
        schema: outputParser.getFormatInstructions(),
    });
}

export function responseToString(response) {
    return JSON.stringify(response, null, 2);
}