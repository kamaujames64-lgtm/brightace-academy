/* BrightAce V60 — deployment consistency helpers.
   Public version/health metadata contains no credentials or customer data.
   It exists so the frontend and deployment-check tool can distinguish a stale
   Apps Script /exec deployment from an application-level JSON error. */

function baDeploymentInfo_(){
  return {
    ok:true,
    service:"BrightAce Academy Live Chat",
    build:BRIGHTACE_BUILD,
    api:"brightace-json-v63",
    protocol:"json",
    statementEngine:"comprehensive-v44",
    scalabilityEngine:"v43+v46",
    securityEngine:"v42+v45+v46+v50",
    financialIntegrityEngine:"v51-reconciliation",
    frontendPerformanceEngine:"v52-visibility-aware-polling",
    observabilityEngine:"v53-production-reliability-observability",
    disasterRecoveryEngine:"v54-disaster-recovery-data-protection",
    productionQaEngine:"v55-end-to-end-qa-production-readiness",
    resourceEngine:"v61-timed-resource-access",
    productionHardeningEngine:"v63-production-readiness-security-qa"
  };
}

// V54 recovery/data protection engine.
