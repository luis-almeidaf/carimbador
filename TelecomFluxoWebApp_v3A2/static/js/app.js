const state = {
  flows: {},
  infoBd: {},
  selectedFlow: null,
  currentNodeId: null,
  vars: {},
  trail: [],
  checklistDone: false,
  sessionId: null,
};

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
  CAMPO: `📌 ENCERRAMENTO – ENVIADO PARA CAMPO (FIELD)
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
};

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

    renderBdInfo(infoBd);
  } catch (error) {
    console.error(error.message);
  }
}

function renderBdInfo(apiData) {
  // Mostra todas as seções ocultas
  showContainers();

  renderTableRow(
    apiData,
    "#bdsInfo table thead th",
    "bdsInfoBody"
  );

  renderTableRow(
    apiData,
    "#clienteInfo table thead th",
    "clienteInfoBody"
  );

  renderTableRow(
    apiData,
    "#falhaInfo table thead th",
    "falhaInfoBody"
  );
}

function showContainers() {
  document
    .querySelectorAll(".bdsInfoContainer, .clienteInfoContainer, .falhaInfoContainer")
    .forEach(el => el.removeAttribute("hidden"));
}

function renderTableRow(apiData, headerSelector, bodyId) {
  const tbody = document.getElementById(bodyId);
  tbody.innerHTML = ""; // limpa corpo

  // Busca a ordem dos <th> da tabela desejada
  const headers = Array.from(document.querySelectorAll(headerSelector))
    .map(th => th.textContent.trim());

  const tr = document.createElement("tr");

  headers.forEach(header => {
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

async function init() {
  const flows = await fetch("/api/flows").then((r) => r.json());
  state.flows = flows;
  renderChecklist();
  renderFlowSelect();
  renderVars();
}

function renderChecklist() {
  const box = document.getElementById("checklist");
  const fields = [
    {
      key: "check_endereco",
      label: "Validou endereço do chamado?",
      type: "select",
      options: [{ v: "Sim" }, { v: "Não" }],
    },
    {
      key: "evidencias_iniciais",
      label: "Coleta inicial com o cliente:",
      type: "textarea",
      ph: "O que já foi coletado?",
    },
  ];
  box.innerHTML = "";
  fields.forEach((f) => {
    const lab = document.createElement("label");
    lab.textContent = f.label;
    box.appendChild(lab);
    if (f.type === "select") {
      const sel = document.createElement("select");
      sel.id = f.key;
      f.options.forEach((o) => {
        const op = document.createElement("option");
        op.value = o.v;
        op.textContent = o.v;
        sel.appendChild(op);
      });
      box.appendChild(sel);
    } else if (f.type === "textarea") {
      const ta = document.createElement("textarea");
      ta.id = f.key;
      ta.placeholder = f.ph || "";
      ta.rows = 3;
      box.appendChild(ta);
    }
  });
  document.getElementById("btnChecklistDone").onclick = () => {
    // validações simples
    const ok = ["check_endereco"].every(
      (k) => document.getElementById(k).value.trim().length > 0,
    );
    if (!ok) {
      alert(
        "Por favor preencha pelo menos os seguintes campos: \n-Validou endereço do chamado?. \n-Detalhes da reclamação.",
      );
      return;
    }
    fields.forEach(
      (f) =>
        (state.vars[f.label] = document.getElementById(f.key).value.trim()),
    );
    state.checklistDone = true;
    document.getElementById("btnStart").disabled = false;
    renderVars();
    alert("Checklist concluído. Selecione o fluxo e clique em Iniciar.");
  };
}

function renderFlowSelect() {
  const sel = document.getElementById("flowSelect");
  sel.innerHTML = "";
  Object.keys(state.flows).forEach((k) => {
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = state.flows[k].title;
    sel.appendChild(opt);
  });
  document.getElementById("btnStart").onclick = () => {
    if (!state.checklistDone) {
      alert("Conclua o checklist primeiro.");
      return;
    }
    state.selectedFlow = sel.value;
    const flow = state.flows[state.selectedFlow];
    state.trail = [];
    state.currentNodeId = flow.start;
    state.vars = Object.assign({}, state.vars, flow.defaults || {});

    renderNode();
    renderVars();
  };
}

function renderNode() {
  const flow = state.flows[state.selectedFlow];
  const node = flow.steps.find((s) => s.id === state.currentNodeId);
  const box = document.getElementById("flowBox");

  if (!node) {
    box.innerHTML = '<div class="card">Nó não encontrado.</div>';
    return;
  }

  const card = document.createElement("div");
  card.className = "card";

  const h = document.createElement("h3");
  h.textContent = node.text;
  card.appendChild(h);

  const controls = document.createElement("div");
  controls.className = "controls";

  // MESSAGE
  if (node.type === "message") {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Continuar";
    b.onclick = () => advance("continue", node.next, {});
    controls.appendChild(b);
  }

  // YES/NO
  if (node.type === "yesno") {
    const by = document.createElement("button");
    by.className = "btn";
    by.textContent = "SIM";
    by.onclick = () => advance("yes", node.yes, node.yes || {});

    const bn = document.createElement("button");
    bn.className = "btn";
    bn.style.background = "var(--danger)";
    bn.textContent = "NÃO";
    bn.onclick = () => advance("no", node.no, node.no || {});

    controls.append(by, bn);
  }

  // INPUT
  if (node.type === "input") {
    const inp = document.createElement("input");
    inp.id = "inp";
    inp.placeholder = node.placeholder || "";

    // Use node.key (ou caia para node.text se key não existir)
    const inputKey = node.key || node.text;

    if (state.vars[inputKey] !== undefined) {
      inp.value = state.vars[inputKey];
    }

    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Salvar";
    b.onclick = () => {
      const val = document.getElementById("inp").value;
      advance("input", node.next, { [inputKey]: val });
    };
    controls.append(inp, b);
  }

  // CHOICE
  if (node.type === "choice") {
    const sel = document.createElement("select");
    sel.id = "sel";

    // Opcional: placeholder
    const placeholderOp = document.createElement("option");
    placeholderOp.value = "";
    placeholderOp.textContent = "— selecione —";
    placeholderOp.disabled = true;
    placeholderOp.selected = true;
    sel.appendChild(placeholderOp);

    // Cada option precisa carregar o 'next' correspondente
    (node.options || []).forEach((o, idx) => {
      const op = document.createElement("option");
      op.value = String(idx);               // index como value
      op.textContent = o.label;             // label visível
      op.dataset.next = o.next || "";       // 'next' da opção
      sel.appendChild(op);
    });

    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Selecionar";
    b.onclick = () => {
      const el = document.getElementById("sel");
      const selectedIndex = el.value;

      if (!selectedIndex) {
        // opcional: UX simples se nada foi selecionado
        el.focus();
        return;
      }

      const selectedOption = node.options[Number(selectedIndex)];
      const nextId = selectedOption.next;

      // Salvar escolha; priorize node.key se existir
      const choiceKey = node.key || node.text;
      const choiceValue = selectedOption.value ?? selectedOption.label;

      advance("select", nextId, { [choiceKey]: choiceValue });
    };

    controls.append(sel, b);
  }

  // NOTE (texto livre)
  if (node.type === "note") {
    const ta = document.createElement("textarea");
    ta.id = "ta";
    ta.placeholder = node.placeholder || "";
    ta.rows = 3;

    const noteKey = node.key || node.text;

    if (state.vars[noteKey] !== undefined) {
      ta.value = state.vars[noteKey];
    }

    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = "Salvar";
    b.onclick = () => {
      const val = document.getElementById("ta").value;
      advance("note", node.next, { [noteKey]: val });
    };
    controls.append(ta, b);
  }

  card.appendChild(controls);
  box.innerHTML = "";
  box.appendChild(card);
}


async function advance(action, nextId, setVars) {
  const flow = state.flows[state.selectedFlow];
  const node = flow.steps.find((s) => s.id === state.currentNodeId);
  state.trail.push({ id: node.id, text: node.text, action, set: setVars });
  Object.assign(state.vars, setVars || {});
  renderVars();

  if (nextId && nextId.startsWith("END:")) {
    const endType = nextId.split(":")[1];
    await finish(endType);
    return;
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

  // salva trilha + carimbo no backend
  const payload = {
    flow: state.selectedFlow,
    bd: state.customer?.chamado?.bd || "BD",
    customer: state.customer,
    vars: state.vars,
    trail: state.trail,
    carimbo: carimboTxt,
  };
  try {
    const r1 = await fetch("/api/save_trail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
    state.sessionId = r1.session_id;
    await fetch("/api/save_carimbo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
    document.getElementById("btnDownloadTrail").disabled = false;
    document.getElementById("btnDownloadTrail").onclick = () => {
      window.location = `/api/sessions/${state.sessionId}`;
    };
  } catch (e) {
    console.error(e);
    alert("Erro ao salvar sessão/carimbo");
  }

  document.getElementById("btnCopy").onclick = () =>
    navigator.clipboard
      .writeText(carimboTxt)
      .then(() => alert("Carimbo copiado!"));
}

init();