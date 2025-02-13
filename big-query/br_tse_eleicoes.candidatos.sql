SELECT
    dados.ano as ano,
    dados.sigla_uf AS sigla_uf,
    diretorio_sigla_uf.nome AS sigla_uf_nome,
    dados.cpf as cpf,
    dados.nome as nome,
    dados.numero_partido as numero_partido,
    dados.titulo_eleitoral as titulo_eleitoral,
    dados.id_municipio as id_municipio
FROM `basedosdados.br_tse_eleicoes.candidatos` AS dados
LEFT JOIN (SELECT DISTINCT sigla,nome  FROM `basedosdados.br_bd_diretorios_brasil.uf`) AS diretorio_sigla_uf
    ON dados.sigla_uf = diretorio_sigla_uf.sigla
where ano = 2024
and sigla_uf = "SC"
and dados.id_municipio like "4215455"