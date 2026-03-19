@app.route("/api/fluxo_inicial")
def api_fluxo_inicial():
    path = os.path.join("fluxos", "fluxo_inicial.json")
    with open(path, "r", encoding="utf-8") as f:
        return jsonify(json.load(f)), 200


@app.route("/api/<flow_name>")
def api_flows(flow_name: str):
    path = os.path.join("fluxos", f"{flow_name}.json")

    if not os.path.exitst(path):
        return jsonify({"error": "fluxo não encontrado"}), 404

    with open(path, "r", encoding="utf-8") as f:
        return jsonify(json.load(f)), 200
