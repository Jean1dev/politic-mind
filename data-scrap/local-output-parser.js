import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createLocalFile(contentArray) {
    const dir = path.resolve(__dirname, '..', 'data')
    fs.mkdirSync(dir)
    fs.writeFileSync(path.resolve(dir, 'result.json'), JSON.stringify(contentArray))
}
