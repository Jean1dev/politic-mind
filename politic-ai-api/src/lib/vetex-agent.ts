import https from 'https';
import http from 'http';

async function downloadText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });

      response.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export async function getTextFromGuiaUsoVotext(): Promise<string> {
  const url_guia_uso_votext = 'https://binnoroteirizacao.s3.amazonaws.com/66dde043-a1c8-4ffa-bc46-f707ac8c2abffile';
  try {
    return await downloadText(url_guia_uso_votext);
  } catch (error) {
    console.error(`Error downloading text from ${url_guia_uso_votext}:`, error);
    return '';
  }
}

export async function getTextFromEstrategias(): Promise<string> {
  const url_estrategias = 'https://binnoroteirizacao.s3.amazonaws.com/33bbeb85-d1b5-40be-9105-4dfa5831d3d6file';
  try {
    return await downloadText(url_estrategias);
  } catch (error) {
    console.error(`Error downloading text from ${url_estrategias}:`, error);
    return '';
  }
}

