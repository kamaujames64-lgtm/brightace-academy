## v2 navigation fix

Fixed GitHub Pages relative navigation paths so links from pages inside `pages/` correctly resolve to the site root and sibling pages.

# BrightAce Academy
## Your Partner in Academic Success

Version 1 is a responsive, multi-page static website prepared for GitHub Pages.

### Pages
- index.html
- pages/subjects.html
- pages/resources.html
- pages/homework-help.html
- pages/how-it-works.html
- pages/about.html
- pages/faq.html
- pages/contact.html
- pages/chat.html

Every page is a separate HTML document and navigation uses normal links.

### Backend
`backend/Code.gs` is the starter Google Apps Script backend for Google Sheets and the future WhatsApp Business Cloud API webhook.

### Security
Never place Meta access tokens or app secrets in the public GitHub frontend. Keep them in Apps Script Script Properties.

### Next integration
1. Create the BrightAce Google Sheet.
2. Deploy Code.gs as a Web App.
3. Connect the frontend chat.js to the Web App URL.
4. Configure Meta WhatsApp Business Cloud API and webhook.
5. Implement two-way message mapping and test the supported WhatsApp Business app/API configuration.


## SEO v3
Added page-specific titles/descriptions, canonical URLs, Open Graph/Twitter metadata, favicon links, EducationalOrganization JSON-LD, robots.txt and sitemap.xml.
