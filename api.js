import auth from "./auth.js";
import stateModule from "./state.js";
import { renderBdInfo } from "./render.js";

async function consultaBd() {
  const bdInputElement = document.getElementById("bdInput");
  const bdInputValue = bdInputElement.value;

  const url = `/api/consulta_bd/${bdInputValue}`;
  try {
    const response = await fetch(url);
    const infoBd = await response.json();

    stateModule.state.infoBd = infoBd;

    if (Object.values(infoBd).includes("ERRO CONSULTA")) {
      document.getElementById("bdsInfo").innerHTML =
        "<p style='color:red'>Erro na consulta</p>";
      return;
    }

    //TODO terminar aqui
    const usuarioResponsavelBd = infoBd.usuario_responsavel;
    const usuarioLogadoReponse = await auth.getLoggedUser();
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

async function fetchFlows() {
  return await fetch("/api/flow").then((r) => r.json());
}

const api = {
  consultaBd,
  fetchFlows,
};

export default api;
