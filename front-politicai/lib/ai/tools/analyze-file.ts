import { tool } from 'ai';
import { z } from 'zod';
import type { Message } from 'ai';

interface AnalyzeFileProps {
  messages: Array<Message>;
}

export const analyzeFile = ({ messages }: AnalyzeFileProps) =>
  tool({
    description: 'Analyze uploaded files (PNG images or PDF documents) and provide a brief comment about their content. Use this tool when the user asks to analyze, describe, or comment on an attached file. The tool can analyze images (PNG, JPEG) and PDF documents. IMPORTANT: Always use this tool when there are file attachments in the conversation and the user is asking about file content. If the user mentions analyzing a PDF, file, or asks about content of an uploaded document, immediately use this tool to analyze the attached files.',
    parameters: z.object({
      fileIndex: z.number().optional().describe('Index of the file to analyze (0-based). If not provided, analyzes the last available file.'),
    }),
    execute: async ({ fileIndex }) => {
      try {
        const allUserMessages = messages.filter(msg => msg.role === 'user');
        const allAttachments = allUserMessages.flatMap(msg => msg.experimental_attachments || []);
        
        console.log('AnalyzeFile tool called with messages:', messages.length);
        console.log('User messages:', allUserMessages.length);
        console.log('Total attachments found:', allAttachments.length);
        console.log('Attachments:', allAttachments.map(a => ({ name: a.name, contentType: a.contentType })));
        
        if (allAttachments.length === 0) {
          return {
            success: false,
            error: 'No attachments found in any user message',
            content: 'Nenhum arquivo foi encontrado nas mensagens para análise. Por favor, faça o upload de um arquivo PDF ou imagem primeiro.'
          };
        }

        const actualIndex = fileIndex !== undefined ? fileIndex : allAttachments.length - 1;
        const attachment = allAttachments[actualIndex];
        
        if (!attachment) {
          return {
            success: false,
            error: `No attachment found at index ${actualIndex}`,
            content: `Nenhum arquivo encontrado na posição ${actualIndex + 1}.`
          };
        }

        const { url, name, contentType } = attachment;
        
        if (!url || !name || !contentType) {
          return {
            success: false,
            error: 'Missing required attachment properties',
            content: 'Propriedades do arquivo estão incompletas.'
          };
        }
        
        console.log(`Analyzing file: ${name} (${contentType}) at ${url}`);
        
        const fileType = getFileTypeFromContentType(contentType);
        
        if (fileType === 'png' || fileType === 'jpeg') {
          return await analyzeImage(url, name);
        } else if (fileType === 'pdf') {
          return await analyzePDF(url, name);
        }
        
        throw new Error(`Unsupported file type: ${contentType}`);
      } catch (error) {
        console.error('File analysis error:', error);
        return {
          success: false,
          error: `Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          content: 'Não foi possível analisar o arquivo fornecido.'
        };
      }
    },
  });

function getFileTypeFromContentType(contentType: string): 'png' | 'jpeg' | 'pdf' {
  if (contentType.includes('image/png')) return 'png';
  if (contentType.includes('image/jpeg')) return 'jpeg';
  if (contentType.includes('application/pdf')) return 'pdf';
  throw new Error(`Unsupported content type: ${contentType}`);
}

async function analyzeImage(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e forneça um breve comentário sobre seu conteúdo em português. Inclua informações sobre objetos, pessoas, texto visível, cores principais e contexto geral.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!analysisResponse.ok) {
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    const content = analysisData.choices[0]?.message?.content || 'Não foi possível analisar a imagem.';

    return {
      success: true,
      fileName: fileName,
      fileType: 'png',
      content: content,
      analysis: 'Análise de imagem concluída com sucesso.'
    };
  } catch (error) {
    throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzePDF(pdfUrl: string, fileName: string) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise este documento PDF e forneça um breve resumo do conteúdo em português. Inclua informações sobre o tipo de documento, tópicos principais, estrutura e propósito geral.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 400
      })
    });

    if (!analysisResponse.ok) {
      throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    const content = analysisData.choices[0]?.message?.content || 'Não foi possível analisar o documento PDF.';

    return {
      success: true,
      fileName: fileName,
      fileType: 'pdf',
      content: content,
      analysis: 'Análise de documento PDF concluída com sucesso.'
    };
  } catch (error) {
    throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
