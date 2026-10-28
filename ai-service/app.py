from __future__ import annotations

import os

from flask import Flask, jsonify, render_template, request

from services.facial_service import list_registered_employees, recognize_employee, register_employee

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB max payload


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Requested-With"
    return response


@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return "", 200


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "face-recognition",
        "registeredEmployees": list_registered_employees(),
    })



@app.get("/employees")
def employees():
    return jsonify({"employees": list_registered_employees()})


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    employee_id = str(payload.get("employeeId", "")).strip()
    employee_name = str(payload.get("employeeName", "")).strip()
    images = payload.get("images") or []

    if not employee_id or not employee_name or not images:
        return jsonify({"success": False, "message": "Employee ID, name, and at least one face sample are required."}), 400

    try:
        result = register_employee(employee_id, employee_name, images)
        return jsonify({"success": True, **result}), 200
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    except Exception as exc:  # pragma: no cover
        return jsonify({"success": False, "message": f"Registration failed: {exc}"}), 500


@app.post("/api/recognize")
def recognize():
    payload = request.get_json(silent=True) or {}
    image_data = payload.get("imageData")

    if not image_data:
        return jsonify({
            "match": False,
            "employeeId": None,
            "employeeName": "Unknown Employee",
            "confidence": 0.0,
            "message": "No recognition input provided",
        }), 400

    result = recognize_employee(image_data)
    return jsonify(result), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
