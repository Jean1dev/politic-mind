import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { Annotation, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";

const stateAgent = {
    model: null,
    tools: [],
    workflow: null,
    app: null,
};

async function createTools() {
    return [
        tool(
            async ({ query }) => {
                console.log(query);
                return 'nao sei '
            },
            {
                name: 'politician_search',
                description: 'Search for information about politicians, senators and deputies',
                schema: z.object({
                    query: z.string(),
                }),
            }
        ),
    ];
}

async function callModel(graphState) {
    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `You are a helpful AI assistant, collaborating with other assistants. Use the provided tools to progress towards answering the question. If you are unable to fully answer, that's OK, another assistant with different tools will help where you left off. Execute what you can to make progress. If you or any of the other assistants have the final answer or deliverable, prefix your response with FINAL ANSWER so the team knows to stop. You have access to the following tools: {tool_names}.\n{system_message}\nCurrent time: {time}.`,
        ],
        new MessagesPlaceholder("messages"),
    ]);

    const formattedPrompt = await prompt.formatMessages({
        system_message: "You are helpful Chatbot Agent.",
        time: new Date().toISOString(),
        tool_names: stateAgent.tools.map((tool) => tool.name).join(", "),
        messages: graphState.messages,
    });

    const result = await stateAgent.model.invoke(formattedPrompt);

    return { messages: [result] };
}

function setUpCheckPointer() {
    const checkpointer = new MemorySaver();
    const app = stateAgent.workflow.compile({ checkpointer });
    //const app = stateAgent.workflow.compile();
    stateAgent.app = app;
}

async function setUpTools() {
    const tools = await createTools();
    stateAgent.tools = tools;
}

function shouldContinue(graphState) {
    const messages = graphState.messages;
    const lastMessage = messages[messages.length - 1];

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return "__end__";
}

function setUpWorkflowGraph() {
    const GraphAnnotation = Annotation.Root({
        messages: ({
            reducer: (currentState, updateValue) => currentState.concat(updateValue),
            initialize: () => new Set(),
            default: () => [],
        }),
    });

    const toolNode = new ToolNode(stateAgent.tools);
    const workflow = new StateGraph(MessagesAnnotation)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent");

    stateAgent.workflow = workflow;
}

function setUpAgent() {
    const model = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        temperature: 0.7,
    }).bindTools(stateAgent.tools);

    stateAgent.model = model;
}

export async function callAgent(query, thread_id) {
    const finalState = await stateAgent.app.invoke(
        {
            messages: [new HumanMessage(query)],
        },
        {
            recursionLimit: 15,
            configurable: {
                thread_id,
            },
        }
    );

    console.log(finalState.messages[finalState.messages.length - 1].content);

    return finalState.messages[finalState.messages.length - 1].content;
}

export async function createAgent() {
    await setUpTools();
    setUpAgent();
    setUpWorkflowGraph();
    setUpCheckPointer();
}
