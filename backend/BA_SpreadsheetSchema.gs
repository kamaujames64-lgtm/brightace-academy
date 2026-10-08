/**
 * BrightAce Academy — Spreadsheet setup/alignment helpers
 * V66 2026-10-06
 *
 * Non-destructive by design:
 * - Never deletes sheets, columns, rows, data, or Script Properties.
 * - Adds only missing sheets/columns required by the current backend.
 * - Formats phone columns as plain text so leading zeros and international
 *   numbers are not silently converted by Google Sheets.
 */

function brightAceSetSpreadsheetIdAndAlign(spreadsheetId) {
  const id = String(spreadsheetId || '').trim();
  if (!id) throw new Error('Pass the Google Sheets spreadsheet ID, e.g. brightAceSetSpreadsheetIdAndAlign("YOUR_SHEET_ID").');

  const ss = SpreadsheetApp.openById(id); // verifies access before changing properties
  const props = PropertiesService.getScriptProperties();
  const previous = String(props.getProperty('SPREADSHEET_ID') || '').trim();

  // Preserve the previous value; never delete/overwrite unrelated properties.
  if (previous && previous !== id) {
    props.setProperty('SPREADSHEET_ID_PREVIOUS', previous);
  }
  props.setProperty('SPREADSHEET_ID', id);
  props.setProperty('SPREADSHEET_ID_LAST_VERIFIED_AT', new Date().toISOString());

  const report = brightAceAlignSpreadsheetSchema_(ss);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function brightAceAlignSpreadsheetSchema() {
  const id = String(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '').trim();
  if (!id) throw new Error('SPREADSHEET_ID is not set. Run brightAceSetSpreadsheetIdAndAlign("YOUR_SHEET_ID") first.');
  const ss = SpreadsheetApp.openById(id);
  const report = brightAceAlignSpreadsheetSchema_(ss);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function brightAceAlignSpreadsheetSchema_(ss) {
  const schema = brightAceRequiredSpreadsheetSchema_();
  const createdSheets = [];
  const addedColumns = [];
  const formattedPhoneColumns = [];
  const warnings = [];

  schema.forEach(function(def) {
    let sh = ss.getSheetByName(def.name);
    if (!sh) {
      sh = ss.insertSheet(def.name);
      sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      createdSheets.push(def.name);
    } else {
      const lastCol = Math.max(sh.getLastColumn(), 1);
      const current = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(v){ return String(v || '').trim(); });
      if (!current.some(Boolean)) {
        sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      } else {
        def.headers.forEach(function(h) {
          if (current.indexOf(h) < 0) {
            sh.getRange(1, sh.getLastColumn() + 1).setValue(h);
            current.push(h);
            addedColumns.push(def.name + '.' + h);
          }
        });
      }
    }

    if (def.phoneHeaders && def.phoneHeaders.length) {
      const headerMap = {};
      sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].forEach(function(v, i) {
        const h = String(v || '').trim();
        if (h) headerMap[h] = i + 1;
      });
      def.phoneHeaders.forEach(function(h) {
        if (headerMap[h]) {
          sh.getRange(1, headerMap[h], Math.max(sh.getMaxRows(), 1), 1).setNumberFormat('@');
          formattedPhoneColumns.push(def.name + '.' + h);
        }
      });
    }

    try {
      sh.setFrozenRows(1);
    } catch (e) {
      warnings.push(def.name + ': could not freeze header row: ' + e.message);
    }
  });

  // Make the main sheets readable without changing stored values.
  ['CLIENTS','TUTORS','PAYMENTS','CONVERSATIONS','MESSAGES','SCHEDULES','RESOURCES','RESOURCE_PURCHASES','RESOURCE_ACCESS'].forEach(function(name){
    const sh = ss.getSheetByName(name);
    if (sh) {
      try { sh.autoResizeColumns(1, Math.min(sh.getLastColumn(), 30)); } catch (e) {}
    }
  });

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    createdSheets: createdSheets,
    addedColumns: addedColumns,
    formattedPhoneColumns: formattedPhoneColumns,
    warnings: warnings,
    note: 'Non-destructive alignment. Existing sheets, columns, rows, values and unrelated Script Properties were preserved.'
  };
}

function brightAceRequiredSpreadsheetSchema_() {
  return [
    {name:'CLIENTS', headers:['clientId','clientName','clientPhone','status','createdAt','notes','membershipTier','discountPercent','sessionTokenHash','sessionExpiresAt','lastActivityAt','profilePictureUrl','profilePictureFileId','displayCurrency'], phoneHeaders:['clientPhone']},
    {name:'TUTORS', headers:['tutorId','tutorName','tutorPhone','status','createdAt','tutorDisplayName','whatsappType','loginCodeHash','loginExpiresAt','loginAttempts','lastLoginAt','profilePictureUrl','description','tutorEmail','profilePictureFileId'], phoneHeaders:['tutorPhone']},
    {name:'CONVERSATIONS', headers:['conversationId','studentName','studentPhone','startedAt','lastMessageAt','status','assignedTutor','whatsappPhone','lastMessageId','studentEmail','workDescription','studentBudget','currency','deadline','assignmentStatus','assignedTutorPhone','tutorPayout','brightAceShare','agreedAmount','agreedCurrency','completedAt','rejectedAt','rejectionReason','verificationStatus','verificationCodeHash','verificationExpiresAt','verificationAttempts','verificationResendCount','verificationLastSentAt','verifiedAt','assignedAdminUsername','assignedAdminName','clientAccessToken','tutorWorkStatus','tutorSubmittedAt','tutorSubmissionNote','qaStatus','qaAt','qaBy','qaNotes','clientFeedback','clientFeedbackAt'], phoneHeaders:['studentPhone','whatsappPhone','assignedTutorPhone']},
    {name:'MESSAGES', headers:['messageId','conversationId','sender','text','source','timestamp','status','attachmentJson','senderName','senderPhone'], phoneHeaders:['senderPhone']},
    {name:'PAYMENTS', headers:['paymentRequestId','conversationId','studentName','studentPhone','studentEmail','tutor','service','amount','currency','deliveryDeadline','status','paystackReference','authorizationUrl','createdAt','paidAt','refundStatus','refundAmount','refundReason','serviceDescription'], phoneHeaders:['studentPhone']},
    {name:'REFUND_REQUESTS', headers:['refundId','conversationId','paymentRequestId','studentName','studentPhone','studentEmail','requestedAmount','currency','reason','status','createdAt','reviewedAt','approvedAmount','adminNote','paystackRefundId'], phoneHeaders:['studentPhone']},
    {name:'SCHEDULES', headers:['scheduleId','conversationId','tutorPhone','tutorName','date','startTime','endTime','timezone','zoomLink','status','studentName','notes','createdAt','confirmedAt','reminder24Sent','reminder1Sent','studentPhone'], phoneHeaders:['tutorPhone','studentPhone']},
    {name:'TUTOR_AVAILABILITY', headers:['availabilityId','tutorPhone','day','startTime','endTime','status','createdAt'], phoneHeaders:['tutorPhone']},
    {name:'TUTOR_MESSAGES', headers:['messageId','tutorPhone','tutorName','sender','senderName','text','timestamp','status','attachmentJson'], phoneHeaders:['tutorPhone']},
    {name:'CLIENT_PREFERENCES', headers:['preferenceId','clientPhone','email','gradeLevel','preferredSubjects','timezone','preferredSessionTimes','emailNotifications','whatsappNotifications','pushNotifications','updatedAt'], phoneHeaders:['clientPhone']},
    {name:'CLIENT_SESSIONS', headers:['sessionId','tokenHash','clientId','clientPhone','issuedAt','lastActivityAt','expiresAt','status'], phoneHeaders:['clientPhone']},
    {name:'RESOURCES', headers:['resourceId','title','category','description','priceUSD','driveFileId','fileName','thumbnailFileId','thumbnailFileName','published','accessLevel','sortOrder','createdAt','updatedAt','accessDurationDays'], phoneHeaders:[]},
    {name:'RESOURCE_PURCHASES', headers:['purchaseId','resourceId','resourceTitle','customerName','customerEmail','customerPhone','amountUSD','currency','status','provider','providerReference','authorizationUrl','createdAt','paidAt','refundedAt','refundAmountUSD','refundReference','accessRevokedAt'], phoneHeaders:['customerPhone']},
    {name:'RESOURCE_ACCESS', headers:['accessId','purchaseId','resourceId','customerEmail','customerPhone','accessStatus','firstGrantedAt','lastAccessAt','accessCount','lastDownloadAt','downloadCount','lastUserAgent','expiresAt'], phoneHeaders:['customerPhone']},
    {name:'BLOCKED_WHATSAPP', headers:['phone','type','reason','blockedAt','blockedBy','active'], phoneHeaders:['phone']},
    {name:'OPERATIONAL_EVENTS', headers:['timestamp','build','action','severity','category','message','durationMs','source'], phoneHeaders:[]},
    {name:'STATEMENT_REGISTRY', headers:['statementReference','statementType','partyName','partyId','email','phone','fromDate','toDate','generatedAt','transactionCount','integrityHash','status'], phoneHeaders:['phone']},
    {name:'TUTOR_PAYMENT_HISTORY', headers:['paymentId','tutorId','tutorName','amount','currency','method','recipient','paymentReference','paidAt','note','adminUsername'], phoneHeaders:[]},
    {name:'TUTOR_WALLETS', headers:['walletId','tutorId','tutorName','mobileProvider','mobileNumber','paypalEmail','payoneerEmail','bankName','accountName','accountNumber','branchCode','swiftCode','preferredMethod','updatedAt','status'], phoneHeaders:['mobileNumber']},
    {name:'TUTOR_WITHDRAWALS', headers:['withdrawalId','tutorId','tutorName','amount','currency','method','recipient','status','requestedAt','reviewedAt','paymentReference','adminUsername','adminNote'], phoneHeaders:[]},
    {name:'ACTIVITY_LOG', headers:['timestamp','actorType','actor','action','detail'], phoneHeaders:[]},
    {name:'ADMIN_ACTIVITY', headers:['timestamp','adminUsername','adminName','role','action','details'], phoneHeaders:[]},
    {name:'TUTOR_PAYOUTS', headers:['payoutId','tutorId','tutorName','workId','paymentRequestId','amount','currency','status','createdAt','paidAt','paymentReference','note','paidAmount','remainingAmount'], phoneHeaders:[]},
    {name:'MESSAGE_DELIVERY_QUEUE', headers:['queueId','messageId','conversationId','channel','recipientPhone','payloadJson','status','attempts','createdAt','sentAt','lastError'], phoneHeaders:['recipientPhone']}
  ];
}
