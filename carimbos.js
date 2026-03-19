import stateModule from "./state.js";

function buildTestesRealizados(vars) {
  const parts = [];

  if (vars.interface_status) parts.push(`Interface ${vars.interface_status}`);
  if (vars.ping_loss) parts.push(`Ping perda ${vars.ping_loss}%`);
  if (vars.sinal_dbm) parts.push(`Sinal ${vars.sinal_dbm} dBm`);
  if (vars.porta_status) parts.push(`Porta CPE ${vars.porta_status}`);

  return parts.join(" | ") || "Ping, ARP, Interface";
}

function expandTemplate(tpl) {
  const { state } = stateModule;
  const { infoBd, vars } = state;
  const now = new Date();

  const base = tpl
    .replaceAll("<BD>", infoBd.bd)
    .replaceAll("<CLIENTE>", infoBd.cliente)
    .replace("<SERVICO>", infoBd.servico)
    .replaceAll("<ANALISTA>", infoBd.usuario_responsavel)
    .replaceAll("<DATA>", now.toLocaleString("pt-BR"));

  return base.replace(/<VAR:([a-zA-Z0-9_]+)>/g, (_, k) => vars[k] ?? "");
}

async function finish(tipo) {
  const { state, CARIMBOS } = stateModule;

  if (!state.vars.testes_realizados) {
    state.vars.testes_realizados = buildTestesRealizados(state.vars);
  }

  //TODO validar carimbos e quais variáveis usar
  const tpl = CARIMBOS[tipo] || "";
  const carimboTxt = expandTemplate(tpl);

  document.getElementById("carimbo").textContent = carimboTxt;

  const btnCopy = document.getElementById("btnCopy");
  btnCopy.disabled = false;
  btnCopy.onclick = () =>
    navigator.clipboard
      .writeText(carimboTxt)
      .then(() => alert("Carimbo copiado!"));
}

const carimbo = {
  finish,
};

export default carimbo;
export { finish };
