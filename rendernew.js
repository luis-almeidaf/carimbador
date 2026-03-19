import stateModule from "./state.js";

// ── BD Info ───────────────────────────────────────────────────────────────────

function showContainers() {
  document
    .querySelectorAll(".bdsInfoContainer, .clienteInfoContainer, .falhaInfoContainer")
    .forEach((el) => el.removeAttribute("hidden"));
}

function convertHeaderToKey(header) {
  return header
    .toLowerCase()
    .replaceAll(" ", "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function renderBdInfo(apiData) {
  showContainers();
  renderTableRow(apiData, "#bdsInfo table thead th", "bdsInfoBody");
  renderTableRow(apiData, "#clienteInfo table thead th", "clienteInfoBody");
  renderTableRow(apiData, "#falhaInfo table thead th", "falhaInfoBody");
}

// ── Vars ──────────────────────────────────────────────────────────────────────

function formatVarName(key) {
  const hidden = ["ping_loss", "acao_tecnica"];
  if (hidden.includes(key)) return null;

  let result = key.replace(/_/g, " ");
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

function renderVars() {
  const { state } = stateModule;
  const box = document.getElementById("vars");
  const entries = Object.entries(state.vars || {});

  if (entries.length === 0) {
    box.innerHTML = '<p class="muted">Sem variáveis.</p>';
    return;
  }

  let html = "<table><thead><tr><th>Pergunta</th><th>Resposta</th></tr></thead><tbody>";
  entries.forEach(([key, v]) => {
    const label = formatVarName(key);
    if (!label) return;
    html += `<tr><td>${label}</td><td>${String(v)}</td></tr>`;
  });
  html += "</tbody></table>";
  box.innerHTML = html;
}

// ── Flow nodes ────────────────────────────────────────────────────────────────
// advance é injetado via parâmetro — render.js não precisa conhecer flow.js

function renderMessageNode(node, controls, advance) {
  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Continuar";
  b.onclick = () => advance(node.next, {});
  controls.appendChild(b);
}

function renderYesNoNode(node, controls, advance) {
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

function renderInputNode(node, controls, advance) {
  const inp = document.createElement("input");
  inp.id = "inp";
  inp.placeholder = node.placeholder || "";

  const { state } = stateModule;
  if (state.vars[node.text] !== undefined) {
    inp.value = state.vars[node.text];
  }

  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "Salvar";
  b.onclick = () => {
    const val = document.getElementById("inp").value;
    advance(node.next, { [node.text]: val });
  };

  controls.append(inp, b);
}

function renderChoiceNode(node, controls, advance) {
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
    if (!selectedIndex) { el.focus(); return; }

    const selectedOption = node.options[Number(selectedIndex)];
    advance(selectedOption.next, {
      [node.text]: selectedOption.value ?? selectedOption.label,
    });
  };

  controls.append(sel, b);
}

function renderNode(advance) {
  const { state } = stateModule;
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
    case "message": renderMessageNode(node, controls, advance); break;
    case "yesno":   renderYesNoNode(node, controls, advance);   break;
    case "input":   renderInputNode(node, controls, advance);   break;
    case "choice":  renderChoiceNode(node, controls, advance);  break;
  }

  if (node.prev) {
    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.style.background = "gray";
    backBtn.textContent = "Voltar";
    backBtn.onclick = () => {
      state.currentNodeId = node.prev;
      renderNode(advance);
    };
    controls.appendChild(backBtn);
  }

  card.appendChild(controls);
  box.appendChild(card);
}

const render = { renderBdInfo, renderVars, renderNode };

export default render;
export { renderBdInfo, renderVars, renderNode };
