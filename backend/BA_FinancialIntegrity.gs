/* BrightAce V51 — financial integrity + reconciliation engine.
 * Read-only by design: this endpoint audits the live Sheets ledgers without
 * rewriting financial records. It is intended for Admin/Super Admin review.
 */

function baMoneyAdd_(map,currency,amount){
  const cur=String(currency||"KES").toUpperCase();
  const cents=Math.round(Number(amount||0)*100);
  if(!isFinite(cents))return;
  map[cur]=(map[cur]||0)+cents;
}
function baMoneyObject_(map){
  const out={};
  Object.keys(map||{}).sort().forEach(function(k){out[k]=Math.round(Number(map[k]||0))/100;});
  return out;
}
function baFinancialIssue_(issues,type,severity,reference,detail){
  issues.push({type:type,severity:severity,reference:String(reference||""),detail:String(detail||"")});
}
function baFinancialIntegrity_(token){
  requireAdmin_(token);
  const issues=[],paymentPaid={},refundApproved={},payoutEarned={},payoutPaid={},paymentHistoryPaid={},withdrawalPaid={},paymentRefs={},payoutRefs={},withdrawalRefs={},paymentsByRequest={};
  const paymentSh=getPaymentSheet_(),paymentRows=paymentSh.getDataRange().getValues();
  for(let i=1;i<paymentRows.length;i++){
    const p=rowPayment_(paymentRows[i],i+1); if(!p.requestId)continue;
    const status=String(p.status||"").toUpperCase(); paymentsByRequest[p.requestId]=p;
    if(status==="PAID"){
      baMoneyAdd_(paymentPaid,p.currency,p.amount);
      const ref=String(p.paystackReference||"").trim();
      if(!ref)baFinancialIssue_(issues,"PAID_PAYMENT_MISSING_REFERENCE","ERROR",p.requestId,"Payment is marked PAID but has no Paystack reference.");
      else {if(paymentRefs[ref])baFinancialIssue_(issues,"DUPLICATE_CLIENT_PAYMENT_REFERENCE","ERROR",ref,"Paystack reference appears on more than one payment request: "+paymentRefs[ref]+" and "+p.requestId+".");paymentRefs[ref]=p.requestId;}
    }
    if(Number(p.refundAmount||0)>0)baMoneyAdd_(refundApproved,p.currency,p.refundAmount);
  }

  const refundSh=getRefundSheet_(),refundRows=refundSh.getDataRange().getValues(),refundMap=headerMap_(refundSh);
  const refundRefs={};
  for(let i=1;i<refundRows.length;i++){
    const r=refundRows[i],id=String(r[refundMap.refundId-1]||"");if(!id)continue;
    const status=String(r[refundMap.status-1]||"PENDING").toUpperCase(),amount=Number(r[refundMap.approvedAmount-1]||0),currency=String(r[refundMap.currency-1]||"KES").toUpperCase(),requestId=String(r[refundMap.paymentRequestId-1]||"");
    if(status==="APPROVED"){
      if(!(amount>0))baFinancialIssue_(issues,"APPROVED_REFUND_ZERO_AMOUNT","ERROR",id,"Refund is APPROVED but approvedAmount is not positive.");
      baMoneyAdd_(refundApproved,currency,amount);
      const ref=String(r[refundMap.paystackRefundId-1]||"").trim();
      if(!ref)baFinancialIssue_(issues,"APPROVED_REFUND_MISSING_PROCESSOR_REFERENCE","ERROR",id,"Approved refund has no Paystack refund identifier.");
      else if(refundRefs[ref])baFinancialIssue_(issues,"DUPLICATE_REFUND_REFERENCE","ERROR",ref,"Refund processor identifier appears more than once.");
      else refundRefs[ref]=id;
      const p=paymentsByRequest[requestId];
      if(!p)baFinancialIssue_(issues,"REFUND_PAYMENT_NOT_FOUND","ERROR",id,"Refund points to a payment request that does not exist.");
      else if(String(p.status||"").toUpperCase()!=="PAID")baFinancialIssue_(issues,"REFUND_ON_UNPAID_REQUEST","ERROR",id,"Refund is approved against a payment request that is not marked PAID.");
      else if(currency!==String(p.currency||"KES").toUpperCase())baFinancialIssue_(issues,"REFUND_CURRENCY_MISMATCH","ERROR",id,"Refund currency does not match the originating payment.");
      else if(amount>Number(p.amount||0)+0.0001)baFinancialIssue_(issues,"REFUND_EXCEEDS_PAYMENT","ERROR",id,"Approved refund exceeds the original client payment amount.");
    }
  }

  const payoutSh=getTutorPayoutSheet_(),payoutRows=payoutSh.getDataRange().getValues(),payoutMap=headerMap_(payoutSh);
  const payoutByWork={};
  for(let i=1;i<payoutRows.length;i++){
    const r=payoutRows[i],id=String(r[payoutMap.payoutId-1]||"");if(!id)continue;
    const tutorId=String(r[payoutMap.tutorId-1]||""),workId=String(r[payoutMap.workId-1]||""),amount=Number(r[payoutMap.amount-1]||0),paidAmount=Math.min(Math.max(0,amount),Number(r[payoutMap.paidAmount-1]||0)),currency=String(r[payoutMap.currency-1]||"KES").toUpperCase(),status=String(r[payoutMap.status-1]||"OWED").toUpperCase(),remaining=Number(r[payoutMap.remainingAmount-1]||Math.max(0,amount-paidAmount));
    baMoneyAdd_(payoutEarned,currency,amount); baMoneyAdd_(payoutPaid,currency,paidAmount);
    if(amount<0||paidAmount<0||remaining<0)baFinancialIssue_(issues,"NEGATIVE_PAYOUT_LEDGER_VALUE","ERROR",id,"Tutor payout contains a negative amount, paidAmount, or remainingAmount.");
    const expectedRemaining=Math.max(0,amount-paidAmount);
    if(Math.abs(remaining-expectedRemaining)>0.01)baFinancialIssue_(issues,"PAYOUT_REMAINING_MISMATCH","ERROR",id,"remainingAmount does not equal amount minus paidAmount.");
    if(status==="PAID" && Math.abs(paidAmount-amount)>0.01)baFinancialIssue_(issues,"PAID_PAYOUT_NOT_FULLY_PAID","ERROR",id,"Payout is marked PAID but paidAmount is below the earned amount.");
    if(workId){if(payoutByWork[workId])baFinancialIssue_(issues,"MULTIPLE_PAYOUTS_FOR_WORK","ERROR",workId,"More than one tutor payout row is linked to this work.");else payoutByWork[workId]=id;}
    const ref=String(r[payoutMap.paymentReference-1]||"").trim();
    if(ref){if(payoutRefs[ref])baFinancialIssue_(issues,"DUPLICATE_PAYOUT_REFERENCE","ERROR",ref,"Tutor payout reference appears on multiple payout rows.");else payoutRefs[ref]=id;}
    if(status==="PAID"&&ref && !paymentHistoryPaid.__refs)paymentHistoryPaid.__refs={};
  }
  delete paymentHistoryPaid.__refs;

  const historySh=getTutorPaymentHistorySheet_(),historyRows=historySh.getDataRange().getValues(),historyMap=headerMap_(historySh);
  const historyRefs={};
  for(let i=1;i<historyRows.length;i++){
    const r=historyRows[i],id=String(r[historyMap.paymentId-1]||"");if(!id)continue;
    const amount=Number(r[historyMap.amount-1]||0),currency=String(r[historyMap.currency-1]||"KES").toUpperCase(),ref=String(r[historyMap.paymentReference-1]||"").trim();
    baMoneyAdd_(paymentHistoryPaid,currency,amount);
    if(!(amount>0))baFinancialIssue_(issues,"TUTOR_PAYMENT_HISTORY_NONPOSITIVE","ERROR",id,"Tutor payment history contains a non-positive payment amount.");
    if(!ref)baFinancialIssue_(issues,"TUTOR_PAYMENT_HISTORY_MISSING_REFERENCE","ERROR",id,"Tutor payment history row has no payment reference.");
    else if(historyRefs[ref])baFinancialIssue_(issues,"DUPLICATE_TUTOR_PAYMENT_REFERENCE","ERROR",ref,"Tutor payment history reference appears more than once.");
    else historyRefs[ref]=id;
    if(withdrawalRefs[ref])baFinancialIssue_(issues,"REFERENCE_SHARED_BY_WITHDRAWAL_AND_HISTORY","ERROR",ref,"The same reference appears in a withdrawal and tutor payment history.");
  }

  const withdrawalSh=getTutorWithdrawalSheet_(),withdrawalRows=withdrawalSh.getDataRange().getValues(),withdrawalMap=headerMap_(withdrawalSh);
  for(let i=1;i<withdrawalRows.length;i++){
    const r=withdrawalRows[i],id=String(r[withdrawalMap.withdrawalId-1]||"");if(!id)continue;
    const status=String(r[withdrawalMap.status-1]||"PENDING").toUpperCase(),amount=Number(r[withdrawalMap.amount-1]||0),currency=String(r[withdrawalMap.currency-1]||"KES").toUpperCase(),ref=String(r[withdrawalMap.paymentReference-1]||"").trim();
    if(status==="PAID"){
      baMoneyAdd_(withdrawalPaid,currency,amount);
      if(!ref)baFinancialIssue_(issues,"PAID_WITHDRAWAL_MISSING_REFERENCE","ERROR",id,"Paid tutor withdrawal has no payment reference.");
      else if(withdrawalRefs[ref])baFinancialIssue_(issues,"DUPLICATE_WITHDRAWAL_REFERENCE","ERROR",ref,"Withdrawal payment reference appears more than once.");
      else withdrawalRefs[ref]=id;
    }
  }

  Object.keys(historyRefs).forEach(function(ref){if(payoutRefs[ref])return;if(withdrawalRefs[ref])return;baFinancialIssue_(issues,"HISTORY_REFERENCE_NOT_LINKED_TO_PAYOUT","WARNING",ref,"Tutor payment history reference is not present on a tutor payout row; review manually.");});
  Object.keys(withdrawalRefs).forEach(function(ref){if(historyRefs[ref])return;baFinancialIssue_(issues,"PAID_WITHDRAWAL_MISSING_HISTORY","ERROR",ref,"Paid withdrawal reference has no matching tutor payment history row.");});

  const currencies={};[paymentPaid,refundApproved,payoutEarned,payoutPaid,paymentHistoryPaid,withdrawalPaid].forEach(function(map){Object.keys(map).forEach(function(c){currencies[c]=true;});});
  const totals={};Object.keys(currencies).sort().forEach(function(c){totals[c]={clientPaymentsPaid:Math.round((paymentPaid[c]||0))/100,approvedRefunds:Math.round((refundApproved[c]||0))/100,tutorPayoutsEarned:Math.round((payoutEarned[c]||0))/100,tutorPayoutsPaid:Math.round((payoutPaid[c]||0))/100,tutorPaymentHistoryPaid:Math.round((paymentHistoryPaid[c]||0))/100,paidTutorWithdrawals:Math.round((withdrawalPaid[c]||0))/100,netClientCashAfterRefunds:Math.round(((paymentPaid[c]||0)-(refundApproved[c]||0)))/100};});

  Object.keys(totals).forEach(function(c){
    const t=totals[c];
    if(Math.abs(t.tutorPayoutsPaid-t.tutorPaymentHistoryPaid)>0.01)baFinancialIssue_(issues,"PAYOUT_HISTORY_TOTAL_MISMATCH","ERROR",c,"Paid tutor payouts and tutor payment history differ.");
    if(Math.abs(t.tutorPaymentHistoryPaid-t.paidTutorWithdrawals)>0.01)baFinancialIssue_(issues,"HISTORY_WITHDRAWAL_TOTAL_MISMATCH","ERROR",c,"Tutor payment history and paid withdrawal totals differ.");
  });

  const errors=issues.filter(function(x){return x.severity==="ERROR"}).length,warnings=issues.filter(function(x){return x.severity==="WARNING"}).length;
  return json_({ok:true,financialIntegrity:{status:errors?"REVIEW_REQUIRED":"PASS",errors:errors,warnings:warnings,totals:totals,issues:issues.slice(0,500),generatedAt:new Date().toISOString(),scope:{payments:Math.max(0,paymentRows.length-1),refunds:Math.max(0,refundRows.length-1),tutorPayouts:Math.max(0,payoutRows.length-1),tutorPaymentHistory:Math.max(0,historyRows.length-1),tutorWithdrawals:Math.max(0,withdrawalRows.length-1)}}});
}
