import auth from "./auth.js";
import api from "./api.js";
import stateModule from "./state.js";
import { startInitialFlow, advance } from "./flow.js";
import { renderNode, renderVars } from "./render.js";

async function init() {
  const flows = await api.fetchFlows();

  stateModule.state.flows = flows;
  stateModule.indexFlows();

  startInitialFlow();
}

// main.js conecta flow e render — nenhum dos dois se conhece
document.addEventListener("flow:advanced", () => {
  renderNode(advance);
  renderVars();
});

document.getElementById("bdInputBtn").addEventListener("click", api.consultaBd);

auth.login();
init();
