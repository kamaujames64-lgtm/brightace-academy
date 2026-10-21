# BrightAce Academy V88 — Public Resources & Media Guide

## What the new workflow does

The administrator can publish a public promotional entry with an image, video, audio file, PDF/document, or supported public file. A media entry can also include an optional HTTPS click-through link (for example, a Google Form).

- **Image, no click-through link:** visitors click the image to open an in-page full-size overlay. Close it with the X, Escape, or by clicking outside the preview; no new page is opened. The image uses `contain` sizing so the whole picture is visible; it is not automatically cropped in the public card.
- **Image, click-through link provided:** clicking the image opens the destination in a new tab.
- **Video, no click-through link:** clicking the video card opens an in-page player overlay. Close it with the X, Escape, or by clicking outside the preview; no new page is opened. YouTube, Vimeo, Google Drive video previews, and direct HTTPS video files are supported.
- **Video, click-through link provided:** clicking the video card opens the destination link instead.
- **PDF/document, no click-through link:** the public card shows a compact PDF/document icon and a download action. A supplied click-through link takes precedence and opens its destination (for example, a Google Form).
- **PDF/document, click-through link provided:** the document card's action opens the supplied destination.
- **Audio:** audio is playable on the public card when there is no click-through link; otherwise the linked destination is offered.

The in-page viewer is responsive on desktop, phones, and tablets. Images are displayed with contain sizing, and video uses a player/embed when the provider permits it. For Drive media, confirm “Anyone with the link — Viewer” sharing; private Drive media cannot be made visible by frontend code.

## How to publish an image

1. Sign in as a Super Admin and open **Resources & Learning Materials** in the admin area.
2. In **Public website promotional content**, enter the title, category, and description.
3. Select **Image / picture**.
4. Either choose **Upload public media** to upload a local image, or paste an HTTPS image URL / Google Drive file ID into **Media URL or Google Drive file ID**.
5. If you upload an image, the optional crop panel appears. Leave cropping unchecked to preserve the complete original image. To crop, check **Crop this uploaded image before publishing**, choose a ratio, adjust the horizontal/vertical position sliders, and review the preview. The cropped preview—not the original—is uploaded. Cropping removes content outside the preview; check small text, logos, faces, and other important details before saving.
6. Optionally paste a destination into **Click-through link**, such as an HTTPS Google Form link. Leave this blank if you want the image itself to open.
7. Tick **Publish on public Resources page** and save.

## How to publish a video

1. Create a promotional entry and select **Video**.
2. Either upload a supported video file or paste a public HTTPS video URL.
3. For YouTube, paste the public video URL (for example, a normal YouTube watch URL or a `youtu.be` URL). Vimeo links are also supported. Direct HTTPS video files and Google Drive video files can be used as well.
4. If a click-through link is blank, clicking the video opens the media viewer. If a click-through link is supplied, clicking the video card opens that destination instead.
5. Publish and check the entry on the public Resources page using both desktop and mobile screen sizes.

**Important:** uploading a file to BrightAce does not upload it to YouTube or automatically publish it to social media. To feature a video on YouTube, upload it to your YouTube channel first, set its visibility as you intend, then paste its public URL into BrightAce. For other platforms, use the platform's official sharing/embed link. Some platforms block third-party embedding; in that case use the platform's public link as the media URL or as the optional click-through link.

## How to publish a PDF or document

1. Choose **Document (PDF / Office / text)**.
2. Upload the file, or paste an HTTPS file URL / Google Drive file ID.
3. If using Drive, make sure the file is intentionally shared for public viewing. Public promotional media is meant to be accessible to visitors.
4. Optionally add a click-through link.
5. Publish and click **Open document** on the public page to verify the file opens correctly.

## Click-through links and Google Forms

- Enter a complete `https://` URL in **Click-through link (optional)**.
- The link is optional. If empty, the media's own viewer/open action is used.
- For a Google Form, set the Form's access/respondent permissions in Google Forms itself. BrightAce only opens the URL; it does not change the Form's permissions or collect Form answers.
- The public site opens destination links in a new tab where appropriate.

## Public sharing and privacy

Public Resources are public by design. Do not upload student records, private tutor/admin documents, payment receipts, confidential work, personal contact lists, or anything you do not have permission to publish. Use the separate paid/private resource and authenticated client-delivery workflows for private materials.

A Drive file must be intentionally shareable for public display; never use a private file as promotional media. Test the link in a private/incognito browser window before publishing so you can confirm that a visitor without your admin login can view it.

## Sharing BrightAce resources on other platforms

- Share the public Resources page URL or the individual public video platform URL.
- Use a thumbnail/cover image you have permission to use.
- For YouTube, use YouTube Studio to upload and publish/schedule the video, then paste the public video URL into BrightAce.
- For other social platforms, post or schedule the media through their official apps/tools. BrightAce does not automatically post to social channels.
- If you want a click to open a campaign page, registration form, or Google Form, place that destination in **Click-through link**.
- After publishing, test the resource card on a phone, tablet, and desktop and verify the destination before sharing widely.

## Limitations to be aware of

- The optional crop tool is client-side and applies only to a selected uploaded image. It exports a raster image up to 2400 pixels on its longest edge to keep the upload manageable.
- The full image is preserved by default; cropping is opt-in.
- YouTube/Vimeo embedding depends on the provider and the video's own embedding permissions.
- A direct external media URL must be HTTPS and publicly accessible.
- The website does not automatically publish content to YouTube, Facebook, Instagram, TikTok, or other social platforms.
