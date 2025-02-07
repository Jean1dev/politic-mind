import path from 'path'
import fs from 'fs'

const formatParlamentarDocument = (parlamentar) => ({
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

export function createDocuments() {
    const parlamentaresJSON = JSON.parse(
        fs.readFileSync(path.resolve('..', 'data', "result.json"))
    )

    const documentos = parlamentaresJSON.map(formatParlamentarDocument);
    return documentos
}
