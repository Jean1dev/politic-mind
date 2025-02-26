import path from 'path'
import fs from 'fs'

export const formatDespesasEleicoes = (despesaCandidato) => ({
    pageContent: `
      Nome: ${despesaCandidato.nome}
      Título Eleitoral: ${despesaCandidato.titulo_eleitoral}
      CPF: ${despesaCandidato.cpf}
      Quantidade de Despesas: ${despesaCandidato.quantidade_despesas}
      Total de Despesas: R$ ${despesaCandidato.total.toFixed(2)}
      
      📌 Descrição das Despesas:
      ${despesaCandidato.descricao_despesas.map(despesa => `- ${despesa}`).join('\n')}
    `.trim(),
    metadata: {
        nome: despesaCandidato.nome,
        titulo_eleitoral: despesaCandidato.titulo_eleitoral,
        cpf: despesaCandidato.cpf,
        quantidade_despesas: despesaCandidato.quantidade_despesas,
        total: despesaCandidato.total
    }
})

export const formatParlamentarDocument = (parlamentar) => ({
    pageContent: `
      Nome: ${parlamentar.nome} (${parlamentar.nomeAbreviado})
      Cargo: ${parlamentar.cargo}
      Estado: ${parlamentar.estado} (${parlamentar.estadoInfo.prefix})
      Partido: ${parlamentar.partido} (ID: ${parlamentar.partidoInfo.id})
      Afiliação Partidária: ${parlamentar.afiliacaoPartido}
      Número de Votos: ${parlamentar.quantidadeVotos}
      Reeleito: ${parlamentar.reeleito ? "Sim" : "Não"}
      
      📌 História Política:
      ${parlamentar.descricao.replace(/<\/?[^>]+(>|$)/g, "")}
  
      📜 Atuação no Congresso:
      - ${parlamentar.metaDescription}
      
      🏆 Reconhecimentos:
      - Presença no Congresso: ${parlamentar.score.presenca}/10
      - Processos: ${parlamentar.score.processos}
      - Privilégios: ${parlamentar.score.privilegios}/10
      - Desperdício de Recursos: ${parlamentar.score.disperdicio}
      - Nota Geral: ${parlamentar.score.total}
  
      📞 Contato:
      - Email: ${parlamentar.email}
      - Telefone: ${parlamentar.telefone}
  
      🔗 Redes Sociais:
      - Instagram: ${parlamentar.instagram}
      - Twitter: ${parlamentar.twitter}
      - Facebook: ${parlamentar.facebook}
      - YouTube: ${parlamentar.youtube}
      
      🏛️ Informações Oficiais:
      ${parlamentar.informacao}
    `.trim(),
    metadata: {
        id: parlamentar.parliamentarianId,
        nome: parlamentar.nome,
        estado: parlamentar.estado,
        partido: parlamentar.partido,
        cargo: parlamentar.cargo,
        votos: parlamentar.quantidadeVotos
    }
});

export function createDocumentsAboutScrapPolitcData() {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'data', "resultado-scrap-politic-data.json"))
    )

    const documentos = parlamentaresJSON.map(formatParlamentarDocument);
    return documentos
}

export function createDocumentsAboutDespesasEleicoes2024() {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'big-query', "relacao-candidatos-x-despesas.json"))
    )

    const documentos = parlamentaresJSON.map(formatDespesasEleicoes);
    return documentos
}
