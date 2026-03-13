import json
import os
import re
from datetime import datetime

from cross_lib.conexao.api.sigitmti.bd import consulta_bd
from flask import Flask, jsonify, render_template, request, send_from_directory

app = Flask(__name__)

# Ensure dirs
os.makedirs("data/carimbos", exist_ok=True)
OsErr = None
os.makedirs("data/sessions", exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/flows")
def api_flows():
    with open(os.path.join("data", "flows.json"), "r", encoding="utf-8") as f:
        flows = json.load(f)
    return jsonify(flows)


@app.route("/api/consulta_bd/<int:bd>", methods=["GET"])
def consulta_bd_api(bd: int):
    dados_bd = consulta_bd(bd)

    return jsonify(dados_bd)


# Save Trail (JSON)
@app.route("/api/save_trail", methods=["POST"])
def save_trail():
    data = request.get_json(force=True, silent=True) or {}
    bd = str(data.get("bd", "BD"))
    flow = str(data.get("flow", "FLOW"))
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", f"{ts}_{bd}_{flow}")
    path = os.path.join("data", "sessions", safe + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"ok": True, "session_id": safe})


# Save Carimbo (TXT)
@app.route("/api/save_carimbo", methods=["POST"])
def save_carimbo():
    data = request.get_json(force=True, silent=True) or {}
    carimbo = str(data.get("carimbo", "")).strip()
    bd = str(data.get("bd", "BD"))
    flow = str(data.get("flow", "FLOW"))
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", f"{ts}_{bd}_{flow}")
    path = os.path.join("data", "carimbos", safe + ".txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write(carimbo)
    return jsonify({"ok": True, "file": safe + ".txt"})


# Download session JSON
@app.route("/api/sessions/<sid>")
def download_session(sid):
    return send_from_directory(
        os.path.join("data", "sessions"), sid + ".json", as_attachment=True
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
