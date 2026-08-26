"""
knowledge_base.py — Statutory German Financial Law Knowledge Corpus & RAG Retrieval
===================================================================================
Provides structured statutory provisions, legal precedents, and semantic search
for explainable German financial consulting (EStG, SGB, InvStG, BGB, BetrAVG).
"""

from typing import List, Dict, Any
import re

STATUTORY_CORPUS: List[Dict[str, Any]] = [
    {
        "id": "estg_32a",
        "statute": "§ 32a EStG",
        "title": "Einkommensteuertarif 2026 (Progressive Income Tax Formula)",
        "keywords": ["tax", "income tax", "bracket", "steuertarif", "grundfreibetrag", "grenzsteuersatz", "spitzensteuersatz", "zve"],
        "content": (
            "§ 32a EStG specifies the 5-zone progressive income tax tariff. For 2026, the Grundfreibetrag is €12,348 "
            "(Zone 1: €0 tax). Zone 2 starts at €12,349 to €17,799 with entry marginal rate 14%. Zone 3 spans €17,800 "
            "to €69,878 with marginal rates scaling to 42%. Zone 4 applies a flat 42% from €69,879 to €277,825. Zone 5 "
            "(Reichensteuer) taxes taxable income above €277,825 at 45%."
        ),
        "citation": "§ 32a Abs. 1 EStG (BGBl. I 2025/2026)"
    },
    {
        "id": "estg_9",
        "statute": "§ 9 EStG",
        "title": "Werbungskosten & Pendlerpauschale (Employment Deductions)",
        "keywords": ["commute", "pendlerpauschale", "werbungskosten", "home office", "homeoffice", "arbeitstage", "anlage n"],
        "content": (
            "§ 9 EStG governs income-related expenses. Under § 9 Abs. 1 Nr. 4 EStG, commuting expenses are deductible "
            "at €0.38 per kilometer of distance from the first kilometer for 2026. Homeoffice-Pauschale under § 4 Abs. 5 "
            "Nr. 6b EStG allows €6.00 per day worked exclusively from home (capped at €1,260 or 210 days). The lump-sum "
            "Arbeitnehmer-Pauschbetrag (§ 9a Nr. 1 EStG) is €1,230 annually."
        ),
        "citation": "§ 9 Abs. 1 Satz 3 Nr. 4 EStG, § 9a Nr. 1 EStG"
    },
    {
        "id": "estg_10",
        "statute": "§ 10 EStG",
        "title": "Sonderausgaben & Vorsorgeaufwendungen (Insurance & Pension Deductions)",
        "keywords": ["sonderausgaben", "vorsorgeaufwendungen", "krankenversicherung", "pflegeversicherung", "rentenversicherung", "altersvorsorge"],
        "content": (
            "§ 10 EStG allows full deduction of statutory health (KV) and long-term care (PV) basic coverage. "
            "Statutory pension contributions (GRV) are 100% deductible up to the annual Knappschaft-tied ceiling "
            "(€29,344 in 2026). Other civil liability insurances are deductible within the remaining other-care limit."
        ),
        "citation": "§ 10 Abs. 1 Nr. 2 & 3 EStG"
    },
    {
        "id": "invstg_20",
        "statute": "§ 20 InvStG",
        "title": "Teilfreistellung für Investmentfonds (Partial Tax Exemption)",
        "keywords": ["etf", "teilfreistellung", "aktienfonds", "abgeltungsteuer", "sparerpauschbetrag", "capital gains"],
        "content": (
            "Under § 20 Abs. 1 InvStG, equity funds (Aktienfonds with >=51% physical equity) enjoy a 30% Teilfreistellung "
            "(tax exemption) on distributions, Vorabpauschale, and capital gains to compensate for underlying corporate taxation. "
            "Remaining capital gains are subject to 26.375% Abgeltungsteuer (incl. Soli) after deducting the Sparerpauschbetrag "
            "(§ 20 Abs. 9 EStG: €1,000 single / €2,000 married)."
        ),
        "citation": "§ 20 Abs. 1 InvStG, § 20 Abs. 9 EStG"
    },
    {
        "id": "invstg_18",
        "statute": "§ 18 InvStG",
        "title": "Vorabpauschale (Annual Deemed Accumulation Tax)",
        "keywords": ["vorabpauschale", "basiszins", "basisertrag", "thesaurierend", "accumulating", "invstg"],
        "content": (
            "§ 18 InvStG levies an annual deemed minimum return on accumulating (thesaurierende) investment funds. "
            "Basisertrag = Fund Value at start of year × 70% × Basiszins (2026 Basiszins: 2.50%). The taxable Vorabpauschale "
            "is capped at the actual annual gain of the fund minus any distributions. The 30% Teilfreistellung applies before "
            "calculating the 26.375% withholding tax."
        ),
        "citation": "§ 18 Abs. 1 & 2 InvStG, BMF Basiszins 2026"
    },
    {
        "id": "sgb_vi",
        "statute": "SGB VI",
        "title": "Gesetzliche Rentenversicherung & Entgeltpunkte Formula",
        "keywords": ["rentenversicherung", "entgeltpunkte", "rentenwert", "rentenlücke", "zugangsfaktor", "regelaltersgrenze", "pension"],
        "content": (
            "Statutory German state pension is calculated as Monatsrente = Entgeltpunkte (EP) × Zugangsfaktor (ZF) × "
            "Aktueller Rentenwert (AR) × Rentenartfaktor (RAF). In 2026, average earnings reference (Durchschnittsentgelt) "
            "is €51,944, RV BBG is €101,400, and Rentenwert is €42.52. Early retirement carries a 0.3% penalty per month "
            "(max 14.4%), while delayed retirement grants a 0.5% bonus per month."
        ),
        "citation": "§ 64, § 68, § 77 SGB VI"
    },
    {
        "id": "bgb_823",
        "statute": "§ 823 BGB",
        "title": "Schadensersatzpflicht & Privathaftpflicht (Unlimited Personal Liability)",
        "keywords": ["haftpflicht", "privathaftpflicht", "liability", "schadensersatz", "823 bgb", "fahrlässigkeit"],
        "content": (
            "§ 823 Abs. 1 BGB imposes unlimited personal civil liability with all present and future assets for damages "
            "caused to life, body, health, freedom, property, or other rights. Private liability insurance (Privathaftpflicht) "
            "with a minimum €50M coverage is an existential requirement under DIN 77230 standards."
        ),
        "citation": "§ 823 Abs. 1 BGB, DIN 77230 Basisschutz"
    },
    {
        "id": "betravg_1a",
        "statute": "§ 1a BetrAVG",
        "title": "Betriebliche Altersversorgung & Arbeitgeberzuschuss (Company Pension)",
        "keywords": ["bav", "betriebliche altersversorgung", "arbeitgeberzuschuss", "entgeltumwandlung", "direktversicherung"],
        "content": (
            "Under § 1a Abs. 1a BetrAVG, employers are legally required to provide a minimum 15% mandatory subsidy "
            "on deferred compensation (Entgeltumwandlung) if social security contributions are saved. Contributions up to "
            "4% of the RV BBG (€4,056/yr in 2026) are tax- and social-security-free (§ 3 Nr. 63 EStG)."
        ),
        "citation": "§ 1a Abs. 1a BetrAVG, § 3 Nr. 63 EStG"
    },
    {
        "id": "sgb_v_jaeg",
        "statute": "§ 6 Abs. 6 SGB V",
        "title": "Jahresarbeitsentgeltgrenze 2026 (PKV Eligibility Threshold)",
        "keywords": ["pkv", "gkv", "jaeg", "versicherungspflichtgrenze", "krankenversicherung", "health insurance"],
        "content": (
            "The general compulsory insurance threshold (JAEG / Versicherungspflichtgrenze) is €77,400 in 2026. "
            "Employees with regular annual earnings above this threshold become exempt from statutory health insurance (GKV) "
            "and are permitted to choose comprehensive private health insurance (PKV) or voluntary GKV membership."
        ),
        "citation": "§ 6 Abs. 6 SGB V (BGBl. 2025/2026)"
    }
]


def retrieve_statutory_context(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    RAG Retrieval: Finds the most relevant statutory German financial provisions
    matching query terms for citation and grounded AI advisory synthesis.
    """
    query_tokens = set(re.findall(r'\w+', query.lower()))
    scored_items = []
    
    for item in STATUTORY_CORPUS:
        score = 0
        # Keyword matches
        for kw in item["keywords"]:
            if kw in query.lower():
                score += 3
            for token in query_tokens:
                if token in kw:
                    score += 1
        # Title/content matches
        for token in query_tokens:
            if len(token) > 3:
                if token in item["title"].lower():
                    score += 2
                if token in item["content"].lower():
                    score += 1
                    
        if score > 0:
            scored_items.append((score, item))
            
    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored_items[:top_k]]
