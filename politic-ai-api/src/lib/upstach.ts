import { UpstashVectorStore } from "@langchain/community/vectorstores/upstash";
import { OpenAIEmbeddings } from "@langchain/openai";
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

type SimilaritySearchOutput = {
    pageContent: string;
    metadata: Record<string, any>;
}

export async function similaritySearch(query: string, k = 2): Promise<SimilaritySearchOutput[]> {
    const similaritySearchResults = await vectorStore.similaritySearch(
        query,
        k,
    );

    return similaritySearchResults.map(result => ({
        pageContent: result.pageContent,
        metadata: result.metadata
    }))
}