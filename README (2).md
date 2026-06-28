# 🛡️ REVA-Pro

## Reverse Engineering & Vulnerability Assessment Platform


```
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web_App-000000?style=for-the-badge&logo=flask)
![YARA](https://img.shields.io/badge/YARA-Static_Analysis-red?style=for-the-badge)
![MITRE](https://img.shields.io/badge/MITRE-ATT%26CK-darkred?style=for-the-badge)
![VirusTotal](https://img.shields.io/badge/VirusTotal-Reputation-blue?style=for-the-badge)
![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-purple?style=for-the-badge)

```{=html}
</p>
```
> **Enterprise-inspired static malware analysis platform** for reverse
> engineering, malware triage and vulnerability assessment. REVA-Pro
> combines static binary inspection, YARA detection, MITRE ATT&CK
> mapping, VirusTotal reputation and explainable risk scoring into a
> single analyst dashboard.

------------------------------------------------------------------------

# ✨ Features

  Feature                      Description
  ---------------------------- ---------------------------------------
  🔍 Static Binary Analysis    PE parsing, hashes, imports, metadata
  🧬 YARA Engine               Signature-based malware detection
  📈 Explainable Risk Engine   Transparent weighted scoring
  🛡️ MITRE ATT&CK              Automatic technique mapping
  🌐 VirusTotal                Hash-only reputation lookup
  🤖 AI Reports                OpenRouter / Groq / Ollama
  📄 PDF Reports               Professional export
  📊 JSON Export               Machine-readable analysis
  📝 Analyst Notes             Stored locally in SQLite

------------------------------------------------------------------------

# 🏗️ Detection Workflow

``` text
Upload File
    │
    ▼
Hashes & Metadata
    │
    ▼
PE Analysis
    │
    ▼
Entropy Analysis
    │
    ▼
YARA Matching
    │
    ▼
IOC & String Extraction
    │
    ▼
MITRE ATT&CK Mapping
    │
    ▼
VirusTotal Reputation (Optional)
    │
    ▼
Explainable Risk Engine
    │
    ▼
AI Summary (Optional)
    │
    ▼
Dashboard + PDF + JSON
```

------------------------------------------------------------------------

# 🚀 Installation

``` bash
git clone https://github.com/<YOUR_USERNAME>/REVA-Pro.git
cd REVA-Pro

python -m venv venv

# Linux / WSL
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

------------------------------------------------------------------------

# ⚙️ Environment Configuration

Create the environment file.

**Linux / WSL**

``` bash
cp .env.example .env
```

**Windows PowerShell**

``` powershell
copy .env.example .env
```

Edit `.env`:

``` env
# Flask
FLASK_SECRET_KEY=change-me-to-a-long-random-string
FLASK_ENV=development
FLASK_DEBUG=1
HOST=127.0.0.1
PORT=5000
MAX_UPLOAD_MB=64

# Threat Intelligence
NVD_API_KEY=
VIRUSTOTAL_API_KEY=

# AI
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
AI_MODEL=meta-llama/llama-3.1-8b-instruct:free

GROQ_API_KEY=
OLLAMA_HOST=http://127.0.0.1:11434
```

### 🔑 Optional API Keys

  Provider     Purpose                     Free
  ------------ --------------------------- ------
  VirusTotal   SHA-256 reputation lookup   ✅
  NVD          Live CVE enrichment         ✅
  OpenRouter   AI-generated summaries      ✅
  Groq         Alternative AI provider     ✅
  Ollama       Local offline AI            ✅

> **No API keys are required.** REVA-Pro automatically falls back to
> built-in rule-based analysis if AI or online services are unavailable.

------------------------------------------------------------------------

# ▶️ Running

``` bash
python app.py
```

Open:

``` text
http://localhost:5000
```

------------------------------------------------------------------------

# 🧪 Validation Samples

  Sample                          Expected
  ------------------------------- ---------------
  📝 Text File                    CLEAN
  📘 PDF                          CLEAN
  🖥️ notepad.exe                  Trusted
  🔐 PuTTY                        Likely Benign
  📦 7-Zip                        Likely Benign
  🧪 EICAR                        Suspicious
  🦠 Educational Malware Sample   High Risk

------------------------------------------------------------------------

# 📂 Project Structure

``` text
REVA-Pro/
├── analysis/
├── threatintel/
├── risk/
├── database/
├── templates/
├── static/
├── uploads/
├── reports/
├── generated_reports/
├── validation/
├── yara_rules/
├── tests/
├── app.py
├── requirements.txt
├── .env.example
└── README.md
```

------------------------------------------------------------------------

# 🔒 Before Uploading to GitHub

**Do NOT upload your real `.env` file.**

✅ Keep:

``` text
.env.example
```

❌ Delete before pushing:

``` text
.env
```

Ensure `.env.example` contains **only empty placeholders** for API keys.

------------------------------------------------------------------------

# 🛠️ Technology Stack

Python • Flask • SQLite • YARA • pefile • LIEF • Plotly • ReportLab •
VirusTotal API • OpenRouter • MITRE ATT&CK

------------------------------------------------------------------------

# ⚠️ Security Notice

-   Static analysis only
-   Uploaded binaries are **never executed**
-   VirusTotal integration performs **hash lookups only**
-   External integrations are optional

------------------------------------------------------------------------

# 📜 Disclaimer

This project is intended for **educational, research and defensive
cybersecurity purposes only**.
