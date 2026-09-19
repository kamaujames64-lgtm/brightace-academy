BrightAce Academy — Admin sign-in + history/pending freshness fix

1. All admin workspace pages use the production EXEC endpoint already present in the package.
2. Only pages/admin-login.html is intended to display the administrator sign-in form; workspace pages redirect to it when no canonical admin token exists.
3. Expired admin sessions redirect to the dedicated sign-in page instead of revealing embedded login forms.
4. Admin conversations, active assignments and work history support fresh reads that bypass the short cache when a workspace is opened/refreshed.
5. Tutor professional description and email fields remain supported.
6. The deployed Apps Script /exec still must be redeployed with the matching backend Code.gs. Source code cannot change a private/old Apps Script deployment from GitHub Pages.
