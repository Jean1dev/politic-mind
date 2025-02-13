SELECT
    dados.ano as ano,
    dados.turno as turno,
    dados.sigla_uf AS sigla_uf,
    diretorio_sigla_uf.nome AS sigla_uf_nome,
    dados.titulo_eleitoral_candidato as titulo_eleitoral_candidato,
    dados.sequencial_candidato as sequencial_candidato,
    dados.numero_candidato as numero_candidato,
    dados.sigla_partido as sigla_partido,
    dados.tipo_despesa as tipo_despesa,
    dados.descricao_despesa as descricao_despesa,
    dados.origem_despesa as origem_despesa,
    dados.valor_despesa as valor_despesa
FROM `basedosdados.br_tse_eleicoes.despesas_candidato` AS dados
LEFT JOIN (SELECT DISTINCT sigla,nome  FROM `basedosdados.br_bd_diretorios_brasil.uf`) AS diretorio_sigla_uf
    ON dados.sigla_uf = diretorio_sigla_uf.sigla
where ano = 2024
and sigla_uf = "SC"
and dados.id_municipio like "4215455"