import { createClient } from 'redis';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = createClient({
    url: 'redis://localhost:6379'
});

client.on('connect', () => {
    console.log('Conectado ao Redis');
});

client.on('error', (err) => {
    console.error('Erro ao conectar ao Redis:', err);
});

async function inserirRegistro(chave, valor) {
    try {
        await client.set(chave, JSON.stringify(valor));
        console.log('Registro inserido:', chave);
    } catch (err) {
        console.error('Erro ao inserir registro:', err);
    }
}

async function start() {
    const pathFiles = resolve(__dirname, '..', 'data', 'result.json');
    const fileJson = JSON.parse(readFileSync(pathFiles));
    for (const element of fileJson) {
        await inserirRegistro(String(element.parliamentarianId), element);
    }
    await client.quit();
}

client.connect().then(start).catch(console.error);