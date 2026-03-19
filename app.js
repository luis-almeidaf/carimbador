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

async function login() {
  const usernameInput = "40418311";
  const passwordInput = "Jurado$558";
  //const usernameInput = document.getElementById("usernameInput").value
  //const passwordInput = document.getElementById("passwordInput").value

  const url = "http://bcri.telefonicassd.com.br:8000/api/login";

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
      })
    });
    const data = await response.json();

    if(data.token) {
      document.cookie = `token=${data.token}; path=/; secure; SameSite=Lax; max-age=3600`;
    } else {
      console.error("Erro ao salvar o token")
    }
  } catch (error) {
    console.error(error.message);
  }
}

// recuperando token do cookie
async function getLoggedUser() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
    
  const response = await fetch("http://bcri.telefonicassd.com.br:8000/api/me", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  return data 
}

async function consultaBd() {
  const bdInputElement = document.getElementById("bdInput");
  const bdInputValue = bdInputElement.value;

  const url = `/api/consulta_bd/${bdInputValue}`;
  try {
    const response = await fetch(url);

    const infoBd = await response.json();
    state.infoBd = infoBd;

    if (Object.values(infoBd).includes("ERRO CONSULTA")) {
      document.getElementById("bdsInfo").innerHTML =
        "<p style='color:red'>Erro na consulta</p>";
      return;
    }
//TODO terminar aqui
    const usuarioResponsavelBd = infoBd.usuario_responsavel;
    const usuarioLogadoReponse = await getLoggedUser();
    const nomeCobadorador = usuarioLogadoReponse.colaborador;

    if (usuarioResponsavelBd !== nomeCobadorador) {
      alert("Só é possível consultar um BD que você já assumiu.");
      return;
    }

    renderBdInfo(infoBd);
  } catch (error) {
    console.error(error.message);
  }
}

function renderBdInfo(apiData) {
  // Mostra todas as seções ocultas
  showContainers();

  renderTableRow(apiData, "#bdsInfo table thead th", "bdsInfoBody");

  renderTableRow(apiData, "#clienteInfo table thead th", "clienteInfoBody");

  renderTableRow(apiData, "#falhaInfo table thead th", "falhaInfoBody");
}

function showContainers() {
  document
    .querySelectorAll(
      ".bdsInfoContainer, .clienteInfoContainer, .falhaInfoContainer",
    )
    .forEach((el) => el.removeAttribute("hidden"));
}

function renderTableRow(apiData, headerSelector, bodyId) {
  const tbody = document.getElementById(bodyId);
  tbody.innerHTML = "";

  const headers = Array.from(document.querySelectorAll(headerSelector)).map(
    (th) => th.textContent.trim(),
  );

  const tr = document.createElement("tr");

  headers.forEach((header) => {
    const key = convertHeaderToKey(header);
    const td = document.createElement("td");
    td.textContent = apiData[key] ?? "";
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function convertHeaderToKey(header) {
  return header
    .toLowerCase()
    .replaceAll(" ", "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos
}

function indexFlows() {
  Object.entries(state.flows).forEach(([flowName, flow]) => {
    flow.steps.forEach((step) => {
      nodeIndex[step.id] = flowName;
    });
  });
}

async function init() {
  const flows = await fetch("/api/flow").then((r) => r.json());
  state.flows = flows;
  startInitialFlow();
  indexFlows();
  renderVars();
}

function startInitialFlow() {
  const defaultFlowKey = "fluxo_inicial"; // nome dentro do seu JSON

  state.selectedFlow = defaultFlowKey;
  const flow = state.flows[defaultFlowKey];

  state.currentNodeId = flow.start;
  state.vars = Object.assign({}, flow.defaults || {});

  renderNode();
  renderVars();
}

function renderNode() {
  const flow = state.flows[state.selectedFlow];
  const node = flow.steps.find((s) => s.id === state.currentNodeId);
  const box = document.getElementById("flowBox");

  if (!node) {
    box.innerHTML = '<div class="card">Nó não encontrado.</div>';
    return;
  }

  box.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  const h = document.createElement("h3");
  h.textContent = node.text;
  card.appendChild(h);

  const controls = document.createElement("div");
  controls.className = "controls";

  switch (node.type) {
    case "message":
      renderMessageNode(node, controls);
      break;
    case "yesno":
      renderYesNoNode(node, controls);
      break;
    case "input":
      renderInputNode(node, controls);
      break;
    case "choice":
      renderChoiceNode(node, controls);
      break;
  }

  if (node.prev) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.style.background = "gray";
    backBtn.textContent = "Voltar";
    backBtn.onclick = () => {
      state.currentNodeId = node.prev;
      renderNode();
    };
    controls.appendChild(backBtn);
  }

  card.appendChild(controls);
  box.appendChild(card);
}

function renderMessageNode(node, controls) {
  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Continuar";
  b.onclick = () => advance(node.next, {});
  controls.appendChild(b);
}

function renderYesNoNode(node, controls) {
  const by = document.createElement("button");
  by.className = "btn";
  by.textContent = "SIM";
  by.onclick = () => advance(node.yes, { [node.id]: "Sim" });

  const bn = document.createElement("button");
  bn.className = "btn";
  bn.style.background = "var(--danger)";
  bn.textContent = "NÃO";
  bn.onclick = () => advance(node.no, { [node.id]: "Não" });

  controls.append(by, bn);
}

function renderInputNode(node, controls) {
  const inp = document.createElement("input");
  inp.id = "inp";
  inp.placeholder = node.placeholder || "";

  const inputKey = node.text;

  if (state.vars[inputKey] !== undefined) {
    inp.value = state.vars[inputKey];
  }

  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Salvar";
  b.onclick = () => {
    const val = document.getElementById("inp").value;
    advance(node.next, { [inputKey]: val });
  };

  controls.append(inp, b);
}

function renderChoiceNode(node, controls) {
  const sel = document.createElement("select");
  sel.id = "sel";

  const placeholderOp = document.createElement("option");
  placeholderOp.value = "";
  placeholderOp.textContent = "Selecione uma opção";
  placeholderOp.disabled = true;
  placeholderOp.selected = true;
  sel.appendChild(placeholderOp);

  (node.options || []).forEach((o, idx) => {
    const op = document.createElement("option");
    op.value = String(idx);
    op.textContent = o.label;
    op.dataset.next = o.next || "";
    sel.appendChild(op);
  });

  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Selecionar";

  b.onclick = () => {
    const el = document.getElementById("sel");
    const selectedIndex = el.value;

    if (!selectedIndex) {
      el.focus();
      return;
    }

    const selectedOption = node.options[Number(selectedIndex)];
    const nextId = selectedOption.next;

    const choiceKey = node.text;
    const choiceValue = selectedOption.value ?? selectedOption.label;

    advance(nextId, { [choiceKey]: choiceValue });
  };

  controls.append(sel, b);
}

async function advance(nextId, setVars) {
  Object.assign(state.vars, setVars || {});
  renderVars();

  if (nextId && nextId.startsWith("END:")) {
    const endType = nextId.split(":")[1];
    await finish(endType);
    return;
  }

  // descobrir qual fluxo contém o node
  const flowName = nodeIndex[nextId];

  if (flowName) {
    state.selectedFlow = flowName;
  }

  state.currentNodeId = nextId;
  renderNode();
}

function formatVarName(key) {
  const hidden = ["ping_loss", "acao_tecnica"];
  if (hidden.includes(key)) return null;

  let result = key.replace(/_/g, " ");
  result = result.charAt(0).toUpperCase() + result.slice(1);

  return result;
}

function renderVars() {
  const box = document.getElementById("vars");
  const entries = Object.entries(state.vars || {});
  if (entries.length === 0) {
    box.innerHTML = '<p class="muted">Sem variáveis.</p>';
    return;
  }
  let html =
    "<table><thead><tr><th>Pergunta</th><th>Resposta</th></tr></thead><tbody>";

  entries.forEach(([key, v]) => {
    const label = formatVarName(key);
    if (!label) return;

    html += `<tr><td>${label}</td><td>${String(v)}</td></tr>`;
  });

  box.innerHTML = html;
}

function expandTemplate(tpl) {
  const infoBd = state.infoBd;
  const now = new Date();
  const base = tpl
    .replaceAll("<BD>", infoBd.bd)
    .replaceAll("<CLIENTE>", infoBd.cliente)
    .replace("<SERVICO>", infoBd.servico)
    .replaceAll("<ANALISTA>", infoBd.usuario_responsavel)
    .replaceAll("<DATA>", now.toLocaleString("pt-BR"));
  return base.replace(/<VAR:([a-zA-Z0-9_]+)>/g, (_, k) => state.vars[k] ?? "");
}

async function finish(tipo) {
  if (!state.vars.testes_realizados) {
    const parts = [];
    if (state.vars.interface_status)
      parts.push(`Interface ${state.vars.interface_status}`);

    if (state.vars.ping_loss) parts.push(`Ping perda ${state.vars.ping_loss}%`);

    if (state.vars.sinal_dbm) parts.push(`Sinal ${state.vars.sinal_dbm} dBm`);

    if (state.vars.porta_status)
      parts.push(`Porta CPE ${state.vars.porta_status}`);

    state.vars.testes_realizados = parts.join(" | ") || "Ping, ARP, Interface";
  }
  const tpl = CARIMBOS[tipo] || "";
  const carimboTxt = expandTemplate(tpl);
  document.getElementById("carimbo").textContent = carimboTxt;
  document.getElementById("btnCopy").disabled = false;
  //TODO validar carimbos e quais variaveis usar

  document.getElementById("btnCopy").onclick = () =>
    navigator.clipboard
      .writeText(carimboTxt)
      .then(() => alert("Carimbo copiado!"));
}

login();
init();
