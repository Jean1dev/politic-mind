import axios from 'axios'
import { createLocalFile } from './local-output-parser.js';

function sleep(ms = 2000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAll() {
    const url = 'https://apirest.politicos.org.br/api/parliamentarianranking?Include=Parliamentarian.State&Include=Parliamentarian.Party&Include=Parliamentarian.Organ&Include=Parliamentarian&take=700&StatusId=1&OrderBy=scoreRanking&Year=2024'
    const response = await axios.get(url)
    return response.data.data.map((parliamentarian) => {
        return parliamentarian.parliamentarianId
    })
}

async function getOne(parliamentarianId) {
    const url = `https://apirest.politicos.org.br/api/parliamentarianranking/parliamentarian?ParliamentarianId=${parliamentarianId}&IsParliamentarianPage=true&Year=2024&Include=Parliamentarian.LawVotes.Law,Parliamentarian.LawVotes.LawStatus,Parliamentarian.Processes,Parliamentarian.Quotas,Parliamentarian.Staffs,Parliamentarian.Comments.Visitor,Parliamentarian.AssiduityCommissions,Parliamentarian.InternalScores,Parliamentarian.State,Parliamentarian.Party,Parliamentarian.BallinBallouts,Parliamentarian.Page,Parliamentarian.LawVotes.Law.CounselorLawStatus,Parliamentarian.Awards.Type`
    try {
        const { data } = await axios.get(url)
        if (data.success) {
            return {
                success: true,
                data: mapParliamentarian(data.data.parliamentarianRanking)
            }
        }
    } catch (error) {
        console.log('falha ao buscar parlamentar', parliamentarianId)
        await sleep()
        return {
            success: false,
            data: null
        }
    }
}

function formatDesct(description) {
    if (!description)
        return ''

    const regex = /(<([^>]+)>)/ig;
    return description.replace(regex, '').replace(/\r?\n|\r/g, ' ').trim();
}

function extractScore(ranking) {
    const optOne = ranking[0]
    return {
        presenca: optOne.scorePresence,
        processos: optOne.scoreProcess,
        privilegios: optOne.scorePrivileges,
        disperdicio: optOne.scoreWastage,
        total: optOne.scoreTotal
    }
}

function mapParliamentarian(parliamentarian) {
    return {
        externalId: parliamentarian.id,
        parliamentarianId: parliamentarian.parliamentarianId,
        estado: parliamentarian.parliamentarian.state.name,
        estadoInfo: {
            prefix: parliamentarian.parliamentarian.state.prefix,
            photo: parliamentarian.parliamentarian.state.photo
        },
        partido: parliamentarian.parliamentarian.party.name,
        partidoInfo: {
            photo: parliamentarian.parliamentarian.party.photo,
            active: parliamentarian.parliamentarian.party.active,
            id: parliamentarian.parliamentarian.party.id
        },
        nome: parliamentarian.parliamentarian.name,
        nomeAbreviado: parliamentarian.parliamentarian.nickname,
        photo: parliamentarian.parliamentarian.photo,
        email: parliamentarian.parliamentarian.email,
        cargo: parliamentarian.parliamentarian.position,
        afiliacaoPartido: parliamentarian.parliamentarian.partyAffiliation,
        informacao: parliamentarian.parliamentarian.otherInformations,
        descricao: formatDesct(parliamentarian.parliamentarian.summary),
        profissao: parliamentarian.parliamentarian.profession,
        ensino: parliamentarian.parliamentarian.academic,
        dataNascimento: parliamentarian.parliamentarian.birthDate,
        quantidadeVotos: parliamentarian.parliamentarian.quantityVote,
        reeleito: parliamentarian.parliamentarian.reelected,
        telefone: parliamentarian.parliamentarian.phone,
        instagram: parliamentarian.parliamentarian.instagram,
        twitter: parliamentarian.parliamentarian.twitter,
        facebook: parliamentarian.parliamentarian.facebook,
        youtube: parliamentarian.parliamentarian.youtube,
        metaKeywords: parliamentarian.parliamentarian.page.metaKeywords,
        metaDescription: parliamentarian.parliamentarian.page.metaDescription,
        score: extractScore(parliamentarian.parliamentarian.ranking),
    }
}

async function scrape() {
    const parliamentarians = await getAll()
    const remapedData = []
    for (let i = 0; i < parliamentarians.length; i++) {
        const parliamentarianId = parliamentarians[i]
        const result = await getOne(parliamentarianId)
        if (result.success) {
            console.log('Parlamentar:', i, result.data.nome)
            remapedData.push(result.data)
            continue
        }

        console.log('Falha ao buscar parlamentar', parliamentarianId)
        i--
    }

    return remapedData
}

scrape()
    .then(remapedData => createLocalFile(remapedData))