#!/usr/bin/env python3
"""Build seed/bian-service-domains.json from official BIAN Semantic API artifacts.

Source: https://github.com/bian-official/public release14.0.0,
`semantic-apis/oas3 /yamls` (upstream dir really has a trailing space).
Each *.yaml is one Service Domain: info.title/info.description give the name
and purpose; paths give Service Operations (operationId/summary/tags).
Stdlib only. Run: python3 scripts/build_seed.py [--limit N]
Names/descriptions/operations are quoted from BIAN 14.0.0 (Apache-2.0).
Business areas + dependency edges are CURATED for this demo, not official.
"""
import datetime as dt, json, os, re, sys, time, urllib.request

BASE_RAW = ("https://raw.githubusercontent.com/bian-official/public/main/"
            "release14.0.0/semantic-apis/oas3%20/yamls")
BIAN_VERSION = "14.0.0"

DOMAINS = [
 ("PartyReferenceDataDirectory","Customer"),("PartyLifecycleManagement","Customer"),
 ("CustomerAccessEntitlement","Customer"),("CustomerAgreement","Customer"),
 ("CustomerRelationshipManagement","Customer"),("CustomerPosition","Customer"),
 ("CurrentAccount","Accounts"),("SavingsAccount","Accounts"),
 ("TermDeposit","Accounts"),("CorporateCurrentAccount","Accounts"),
 ("PaymentOrderInitiation","Payments"),("PaymentRail","Payments"),
 ("DirectDebit","Payments"),("StandingOrder","Payments"),
 ("FinancialGateway","Payments"),("TransactionEngine","Payments"),
 ("Disbursement","Payments"),("CreditCard","Cards"),
 ("CardAuthorization","Cards"),("CardTransactionCapture","Cards"),
 ("CardClearing","Cards"),("ConsumerLoan","Loans"),
 ("CorporateLoan","Loans"),("MortgageLoan","Loans"),("CreditFacility","Loans"),
 ("FraudEvaluation","Risk & Compliance"),("FraudDiagnosis","Risk & Compliance"),
 ("FraudModel","Risk & Compliance"),("CreditRiskOperations","Risk & Compliance"),
 ("CustomerCreditRating","Risk & Compliance"),("PartyAuthentication","Security & Access"),
 ("TransactionAuthorization","Security & Access"),("ProductDirectory","Products"),
 ("ProductDesign","Products"),("ProductDeployment","Products"),
 ("ContactCenterOperations","Servicing"),("ServicingOrder","Servicing"),
 ("CustomerCase","Servicing"),("FinancialAccounting","Finance"),
 ("CurrencyExchange","Treasury"),
]

DEPENDENCIES = {
 "PaymentOrderInitiation":["CurrentAccount","PartyReferenceDataDirectory","TransactionAuthorization","PaymentRail"],
 "PaymentRail":["FinancialGateway","TransactionEngine"],
 "DirectDebit":["CurrentAccount","CustomerAgreement"],
 "StandingOrder":["CurrentAccount"],
 "Disbursement":["CurrentAccount","PaymentOrderInitiation"],
 "CurrentAccount":["PartyReferenceDataDirectory","ProductDirectory"],
 "SavingsAccount":["PartyReferenceDataDirectory"],
 "TermDeposit":["CurrentAccount","PartyReferenceDataDirectory"],
 "CorporateCurrentAccount":["PartyReferenceDataDirectory"],
 "CreditCard":["PartyReferenceDataDirectory","CustomerAgreement","CardAuthorization"],
 "CardAuthorization":["TransactionAuthorization","FraudEvaluation"],
 "CardTransactionCapture":["TransactionEngine"],
 "CardClearing":["FinancialGateway"],
 "ConsumerLoan":["PartyReferenceDataDirectory","CreditRiskOperations","CurrentAccount"],
 "CorporateLoan":["PartyReferenceDataDirectory","CreditRiskOperations"],
 "MortgageLoan":["PartyReferenceDataDirectory","CreditRiskOperations","ProductDirectory"],
 "CreditFacility":["PartyReferenceDataDirectory","CreditRiskOperations"],
 "FraudDiagnosis":["FraudEvaluation","FraudModel"],
 "FraudEvaluation":["FraudModel"],
 "CreditRiskOperations":["CustomerCreditRating"],
 "CustomerCreditRating":["PartyReferenceDataDirectory"],
 "PartyAuthentication":["PartyReferenceDataDirectory","CustomerAccessEntitlement"],
 "TransactionAuthorization":["PartyAuthentication","CustomerAccessEntitlement"],
 "CustomerAccessEntitlement":["PartyReferenceDataDirectory","CustomerAgreement"],
 "CustomerAgreement":["PartyReferenceDataDirectory","ProductDirectory"],
 "CustomerRelationshipManagement":["PartyReferenceDataDirectory","CustomerCase"],
 "CustomerPosition":["CurrentAccount","CustomerRelationshipManagement"],
 "ProductDesign":["ProductDirectory"],
 "ProductDeployment":["ProductDirectory","ProductDesign"],
 "ContactCenterOperations":["PartyReferenceDataDirectory","CustomerCase","ServicingOrder"],
 "ServicingOrder":["CustomerCase","CustomerAgreement"],
 "CustomerCase":["CustomerRelationshipManagement"],
 "CurrencyExchange":["FinancialAccounting"],
}

STOPWORDS = {"a","an","and","are","as","at","be","by","for","from","has","in","is","it","its","of","on","or","that","the","to","was","were","will","with","which","this","these","those","via","such","can","may","than","into","over","under","between","including","within","both","all","any","each","other","some","out","up","about","against","during","before","after","not","no","do","does","did","so","if","but","then","there","their","they","been","being","because","under","through","s","cr","bq","in","ex","co","re","up"}

PATH_RE = re.compile(r"^  ('?)(/[^'\n]*)\1:\s*(?:#.*)?$")
METHOD_RE = re.compile(r"^    (get|post|put|patch|delete|options|head):\s*$")
OPID_RE = re.compile(r"^      operationId:\s*(.+?)\s*$")
SUMMARY_RE = re.compile(r"^      summary:\s*(.+?)\s*$")
TAGS_RE = re.compile(r"^      tags:\s*$")
TAG_ITEM_RE = re.compile(r"^        -\s*(.+?)\s*$")
TITLE_RE = re.compile(r"^  title:\s*(.+?)\s*$")
DESC_RE = re.compile(r"^  description:\s*(.+?)\s*$")

def unquote(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        return s[1:-1].replace("''", "'")
    return s

def split_terms(text):
    spaced = re.sub(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ", text)
    return [w.lower() for w in re.split(r"[^A-Za-z0-9]+", spaced) if w]

def keywords(parts):
    seen = {}
    for p in parts:
        for w in split_terms(p or ""):
            if len(w) >= 3 and w not in STOPWORDS and w not in seen:
                seen[w] = None
    return sorted(seen)[:48]

def download(stem):
    url = BASE_RAW + "/" + stem + ".yaml"
    req = urllib.request.Request(url, headers={"User-Agent": "bian-mapper-seed/0.1"})
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                if r.status != 200:
                    raise RuntimeError("HTTP %s" % r.status)
                return r.read().decode("utf-8", errors="replace")
        except Exception as e:
            last = e
            time.sleep(1 + attempt)
    raise RuntimeError("failed to download %s: %s" % (url, last))

def parse_domain(text, stem):
    title, description = stem, ""
    operations, cur_path, cur_op = [], None, None
    in_tags, seen_title, seen_desc = False, False, False
    for line in text.splitlines():
        if not seen_title:
            m = TITLE_RE.match(line)
            if m:
                title, seen_title = unquote(m.group(1)), True
                continue
        if seen_title and not seen_desc and not line.startswith("      "):
            m = DESC_RE.match(line)
            if m:
                description, seen_desc = unquote(m.group(1)), True
                continue
        m = PATH_RE.match(line)
        if m:
            cur_path, cur_op, in_tags = m.group(2), None, False
            continue
        m = METHOD_RE.match(line)
        if m and cur_path:
            cur_op = {"method": m.group(1).upper(), "path": cur_path,
                       "operationId": "", "summary": "", "tags": []}
            operations.append(cur_op)
            in_tags = False
            continue
        if cur_op is None:
            continue
        m = OPID_RE.match(line)
        if m:
            cur_op["operationId"] = unquote(m.group(1)).strip()
            in_tags = False
            continue
        m = SUMMARY_RE.match(line)
        if m:
            cur_op["summary"] = unquote(m.group(1)).strip()
            in_tags = False
            continue
        if TAGS_RE.match(line):
            in_tags = True
            continue
        if in_tags:
            m = TAG_ITEM_RE.match(line)
            if m:
                tag = unquote(m.group(1)).strip()
                if tag and tag not in cur_op["tags"]:
                    cur_op["tags"].append(tag)
                continue
            in_tags = False
    tags_all = []
    for op in operations:
        for t in op["tags"]:
            if t not in tags_all:
                tags_all.append(t)
    control_record, bqs = "", []
    for t in tags_all:
        m = re.match(r"^CR\s*-\s*(.+)$", t)
        if m and not control_record:
            control_record = m.group(1).strip()
            continue
        m = re.match(r"^BQ\s*-\s*(.+)$", t)
        if m and m.group(1).strip() not in bqs:
            bqs.append(m.group(1).strip())
    kw = keywords([title, description] + [o["operationId"] for o in operations]
                  + [o["summary"] for o in operations]
                  + [o["path"] for o in operations] + tags_all)
    return {"slug": stem.lower(), "file": stem, "name": title,
            "description": description or ("BIAN Service Domain: %s." % title),
            "businessArea": "", "keywords": kw, "controlRecord": control_record,
            "behaviorQualifiers": bqs, "operations": operations,
            "dependencies": [], "sourceUrl": BASE_RAW + "/" + stem + ".yaml",
            "bianVersion": BIAN_VERSION}

def main():
    limit, args, i = 0, sys.argv[1:], 0
    while i < len(args):
        if args[i] == "--limit" and i + 1 < len(args):
            limit = int(args[i + 1]); i += 2
        else:
            i += 1
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "seed", "bian-service-domains.json")
    stems = [s for s, _ in DOMAINS]
    area = dict(DOMAINS)
    if limit:
        stems = stems[:limit]
    domains = []
    for stem in stems:
        print("[seed] %s ..." % stem, flush=True)
        d = parse_domain(download(stem), stem)
        d["businessArea"] = area[stem]
        d["dependencies"] = [x for x in DEPENDENCIES.get(stem, []) if x in area]
        if not d["operations"]:
            print("[seed] WARNING: no operations parsed for %s" % stem, file=sys.stderr)
        domains.append(d)
    payload = {
      "version": BIAN_VERSION,
      "source": ("bian-official/public release14.0.0 semantic-apis/oas3 yamls "
                   "(Apache-2.0). Each YAML is one BIAN Service Domain; names, "
                   "purposes and operations quoted from info.title/info.description "
                   "and operationId/summary."),
      "generated": dt.date.today().isoformat(),
      "note": ("Display names, purposes and operations are BIAN 14.0.0. "
                 "Business-area grouping + dependency edges are curated for "
                 "this demo and are NOT official BIAN relations."),
      "count": len(domains), "domains": domains}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("[seed] wrote %s (%d domains)" % (out, len(domains)))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
