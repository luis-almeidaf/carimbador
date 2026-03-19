import stateModule from "./state.js";
import { finish } from "./carimbo.js";
import api from "./api.js";

function startInitialFlow() {
  const { state } = stateModule;
  const defaultFlowKey = "fluxo_inicial";

  state.selectedFlow = defaultFlowKey;
  const flow = state.flows[defaultFlowKey];

  state.currentNodeId = flow.start;
  state.vars = Object.assign({}, flow.defaults || {});

  document.dispatchEvent(new CustomEvent("flow:advanced"));
}

async function loadflow(fluxoNome) {
  const { state } = stateModule;
  const flows = await api.buscaFlow(fluxoNome);
  Object.assign(state.flows, flows);
  stateModule.indexFlows();
}

async function advance(nextId, setVars) {
  const { state, nodeIndex } = stateModule;

  Object.assign(state.vars, setVars || {});

  if (nextId.startsWith("FLOW:")) {
    const flowName = nextId.split(":")[1];
    await loadflow(flowName);
    const flow = stateModule.state.flows[flowName];
    nextId = flow.start;
  }

  if (nextId && nextId.startsWith("END:")) {
    const endType = nextId.split(":")[1];
    await finish(endType);
    return;
  }

  const flowName = nodeIndex[nextId];
  if (flowName) {
    state.selectedFlow = flowName;
  }

  state.currentNodeId = nextId;

  document.dispatchEvent(new CustomEvent("flow:advanced"));
}

const flow = { startInitialFlow, advance };

export default flow;
export { startInitialFlow, advance };
