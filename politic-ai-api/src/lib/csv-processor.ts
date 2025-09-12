import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface CSVProcessingResult {
    chunks: any[];
    totalChunks: number;
    originalFileName: string;
}

export async function downloadCSVFromUrl(url: string): Promise<string> {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000
        });

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `csv_${Date.now()}.csv`;
        const filePath = path.join(tempDir, fileName);

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } catch (error) {
        throw new Error(`Erro ao baixar CSV: ${error}`);
    }
}

export async function processCSV(filePath: string): Promise<CSVProcessingResult> {
    try {
        const loader = new CSVLoader(filePath);
        const docs = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 100,
        });

        const splitDocs = await textSplitter.splitDocuments(docs);

        const fileName = path.basename(filePath);

        return {
            chunks: splitDocs,
            totalChunks: splitDocs.length,
            originalFileName: fileName
        };
    } catch (error) {
        throw new Error(`Erro ao processar CSV: ${error}`);
    }
}

export async function cleanupTempFile(filePath: string): Promise<void> {
    try {
        fs.unlinkSync(filePath);
    } catch (error) {
        console.warn(`Erro ao remover arquivo temporário: ${error}`);
    }
}

export async function processCSVFromUrl(url: string): Promise<CSVProcessingResult> {
    let tempFilePath: string | null = null;
    
    try {
        tempFilePath = await downloadCSVFromUrl(url);
        const result = await processCSV(tempFilePath);
        return result;
    } finally {
        if (tempFilePath) {
            await cleanupTempFile(tempFilePath);
        }
    }
}