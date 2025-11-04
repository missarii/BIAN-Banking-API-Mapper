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
