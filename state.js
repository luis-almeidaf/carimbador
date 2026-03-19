const state = {
  flows: {},
  infoBd: {},
  selectedFlow: null,
  currentNodeId: null,
  vars: {},
  checklistDone: false,
  sessionId: null,
};

const nodeIndex = {};

const CARIMBOS = {
  NORMALIZADO: `📌 ENCERRAMENTO – NORMALIZADO COM CLIENTE
Cliente: <CLIENTE>
Serviço: <SERVICO>
BD: <BD>

Status Final: NORMALIZADO
Ação Técnica: <VAR:acao_tecnica>
Testes Executados: <VAR:testes_realizados>
Validação: Cliente confirmou pleno funcionamento

Responsável: <ANALISTA>
Data: <DATA>`,
  DIAGNOSTICO: `📌 ENCERRAMENTO – ENVIADO AO DIAGNÓSTICO
Cliente: <CLIENTE>
Serviço: <SERVICO>
BD: <BD>

Falha Identificada: <VAR:falha_identificada>
Conclusão Técnica: <VAR:conclusao_tecnica>
Testes Executados: <VAR:testes_realizados>

Encaminhamento: Diagnóstico N2
Responsável: <ANALISTA>
Data: <DATA>`,
  CAMPO: `📌 ENCERRAMENTO – ENVIADO PARA CAMPO
Cliente: <CLIENTE>
Serviço: <SERVICO>
BD: <BD>

Motivo: <VAR:motivo_campo>
Testes Realizados: <VAR:testes_realizados>

Encaminhamento: GTD / Parceiro
Responsável: <ANALISTA>
Data: <DATA>`,
  PRE_MASSIVA: `📌 ENCERRAMENTO – PRÉ-MASSIVA
Cliente: <CLIENTE>
Serviço: <SERVICO>
BD: <BD>

Indicador: Possível falha coletiva
Evidências: <VAR:evidencias_massiva>

Encaminhamento: Pré-Massiva
Responsável: <ANALISTA>
Data: <DATA>`,
  SEM_CONTATO: `criar carimbo`,
  AGENDADO_RETORNO: `criar carimbo`,
};

function indexFlows() {
  Object.entries(state.flows).forEach(([flowName, flow]) => {
    flow.steps.forEach((step) => {
      nodeIndex[step.id] = flowName;
    });
  });
}

export default { state, nodeIndex, CARIMBOS, indexFlows };
