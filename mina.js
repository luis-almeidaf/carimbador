import auth from "./auth.js";
import api from "./api.js";
import stateModule from "./state.js";
import { startInitialFlow, advance, loadflow } from "./flow.js";
import { renderBdInfo, renderNode, renderVars } from "./render.js";

async function init() {
  const user = await auth.getLoggedUser();

  if (!user) {
    window.location.href = "/login";
    return;
  }

  const fluxoInicial = await api.buscaFluxoInicial();
  Object.assign(stateModule.state.flows, fluxoInicial);
  stateModule.indexFlows();
  startInitialFlow();
}

async function processaBd() {
  const infoBd = await api.consultaBd();
  if (!infoBd) return;

  const fluxoNome = api.segmentaFluxoBd(infoBd);
  await loadflow(fluxoNome);
  renderBdInfo(infoBd);
}


document.addEventListener("flow:advanced", () => {
  renderNode(advance);
  renderVars();
});

document.getElementById("logoutBtn").addEventListener("click", auth.logout);
document.getElementById("bdInputBtn").addEventListener("click", api.consultaBd);

init();
