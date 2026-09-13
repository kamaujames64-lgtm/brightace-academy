BrightAce Academy — Live Chat / Background / Payment Copy Fix

Replace ONLY these files in your working repository, preserving your existing folders:
- pages/chat.html
- js/chat.js
- backend/Code.gs
- pages/admin.html
- css/style.css
- assets/brightace-graduates.jpg

Fixes included:
1. 6-digit WhatsApp verification panel appears immediately after SEND REQUEST and is cache-busted.
2. Button wording is REQUEST A NEW CODE.
3. Old chat session key is bumped so stale verified sessions cannot bypass the new verification UI.
4. Payment link button changes to COPIED ✓ after copying, with a fallback copy method.
5. Graduation photo is restored and applied subtly across the site plus hero/page-hero.
6. Live-chat and tutor-chat polling is set to 15 seconds as a conservative starting interval; send states show SENDING… / UPLOADING ATTACHMENT… / SENT ✓.
7. Backend keeps the verification request visible even if WhatsApp delivery is temporarily misconfigured, so the verification screen can still be reached and a new code can be requested after configuration.

IMPORTANT:
- After replacing backend/Code.gs, deploy a NEW VERSION of the Apps Script Web App using the SAME deployment URL.
- Make sure Meta WhatsApp credentials and the approved OTP template are configured in Script Properties before testing code delivery.
- On GitHub Pages, hard-refresh the browser (Ctrl+F5) after pushing the files.
- Do not copy this patch into the backup folder.

7. The admin Work Assignments page uses a dedicated adminListWorkAssignments API action so verified active requests populate independently of the dashboard request list.
8. The admin dashboard and Work Assignments page should use the same deployed Apps Script /exec URL. If the /exec endpoint returns an HTML sign-in/error page instead of JSON, update the existing web-app deployment to the latest saved Code.gs version and keep the deployment accessible to the web client.
