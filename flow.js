import stateModule from "./state.js";
import { renderNode, renderVars } from "./render.js";
import { finish } from "./carimbo.js";

function startInitialFlow() {
  const { state } = stateModule;
  const defaultFlowKey = "fluxo_inicial";

  state.selectedFlow = defaultFlowKey;
  const flow = state.flows[defaultFlowKey];

  state.currentNodeId = flow.start;
  state.vars = Object.assign({}, flow.defaults || {});

  renderNode();
  renderVars();
}

async function advance(nextId, setVars) {
  const { state, nodeIndex } = stateModule;

  Object.assign(state.vars, setVars || {});
  renderVars();

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
  renderNode();
}

const flow = {
  startInitialFlow,
  advance,
};

export default flow;
export { startInitialFlow, advance };
