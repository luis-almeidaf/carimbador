import auth from "./auth.js";
import api from "./api.js";
import stateModule from "./state.js";
import { startInitialFlow, advance } from "./flow.js";
import { renderNode, renderVars } from "./render.js";

async function init() {
  const fluxoInicial = await api.buscaFluxoInicial();
  stateModule.state.flows = fluxoInicial;
  stateModule.indexFlows();
  startInitialFlow();
}

document.addEventListener("flow:advanced", () => {
  renderNode(advance);
  renderVars();
});

document.getElementById("bdInputBtn").addEventListener("click", api.consultaBd);

auth.login();
init();
