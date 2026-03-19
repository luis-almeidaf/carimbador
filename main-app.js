import auth from "./auth.js";
import api from "./api.js";
import stateModule from "./state.js";
import { startInitialFlow } from "./flow.js";
import { renderVars } from "./render.js";

async function init() {
  const flows = await api.fetchFlows();

  stateModule.state.flows = flows;
  stateModule.indexFlows();

  startInitialFlow();
  renderVars();
}

auth.login();
init();
