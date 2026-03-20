import auth from "./auth.js";
import stateModule from "./state.js";
import { startInitialFlow, advance, loadflow } from "./flow.js";
import { renderBdInfo } from "./render.js";

async function consultaBd() {
  const user = await auth.getLoggedUser();

  if (!user) {
    window.location.href = "/login";
    return;
  }

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
    const usuarioLogado = await auth.getLoggedUser().colaborador;

    if (usuarioResponsavelBd !== usuarioLogado) {
      alert("Só é possível consultar um BD que você já assumiu.");
      return;
    }

    const fluxoBdNome = segmentaFluxoBd(infoBd);
    loadflow(fluxoBdNome);

    renderBdInfo(infoBd);
  } catch (error) {
    console.error(error.message);
  }
}

async function segmentaFluxoBd(infoBd) {
  //TODO validar nomes corretamente
  const segmento = infoBd.rede;
  const produto = infoBd.produto;

  if (segmento === "VIVO 1" && produto === "DADOS")
    return "fluxo_inicial_dados_v1";
  if (segmento === "VIVO 2" && produto === "DADOS")
    return "fluxo_inicial_dados_v2";
  if (segmento === "VIVO 1" && produto === "SIP") return "fluxo_inicial_sip_v1";
  if (segmento === "VIVO 1" && produto === "SIP") return "fluxo_inicial_sip_v2";
  if (segmento === "VIVO 1" && produto === "DDR") return "fluxo_inicial_ddr_v1";
  if (segmento === "VIVO 1" && produto === "DDR") return "fluxo_inicial_ddr_v1";
}

async function buscaFluxoInicial() {
  return await fetch("/api/fluxo_inicial").then((r) => r.json());
}

async function buscaFlow(nomeFluxo) {
  return await fetch(`/api/${nomeFluxo}`).then((r) => r.json());
}

const api = {
  consultaBd,
  buscaFluxoInicial,
  buscaFlow,
};

export default api;
