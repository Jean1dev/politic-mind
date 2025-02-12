import csv from 'csv-parser'
import fs from 'fs'
import path from 'path'

const canditados = []
const despesas = []

async function loadCSVFiles() {
    await new Promise((resolve, reject) => {
        fs.createReadStream(path.resolve('csv', 'candidatos_sangao.csv'))
            .pipe(csv())
            .on('data', (data) => canditados.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    await new Promise((resolve, reject) => {
        fs.createReadStream(path.resolve('csv', 'despesas_candidato.csv'))
            .pipe(csv())
            .on('data', (data) => despesas.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

}

function associarDespesasECandidatos() {
    return canditados.map(canditado => {
        const despesasDoCandidato = despesas.filter(despesa => {
            return despesa.titulo_eleitoral_candidato == canditado.titulo_eleitoral
        })

        return {
            canditado,
            despesasDoCandidato
        }
    })
}

function formatarResultado(data) {
    return data.map(candidatoComDespesas => {
        const totalDespesas = candidatoComDespesas.despesasDoCandidato
            .map(i => Number(i.valor_despesa))
            .reduce((acc, curr) => acc + curr, 0)

        const descricao_despesas = candidatoComDespesas.despesasDoCandidato
            .map(i => i.descricao_despesa)
            
        return {
            nome: candidatoComDespesas.canditado.nome,
            titulo_eleitoral: candidatoComDespesas.canditado.titulo_eleitoral,
            cpf: candidatoComDespesas.canditado.cpf,
            quantidade_despesas: candidatoComDespesas.despesasDoCandidato.length,
            total: totalDespesas,
            descricao_despesas
        }
    })
}

async function start() {
    await loadCSVFiles()
    let data = associarDespesasECandidatos()
    data = formatarResultado(data)
    fs.writeFileSync('relacao-candidatos-x-despesas.json', JSON.stringify(data))
}

start()