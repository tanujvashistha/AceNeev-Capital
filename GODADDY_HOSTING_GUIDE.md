# How to Upload ACENEEV CAPITAL Website to GoDaddy

This guide walks you through uploading your website to **GoDaddy** in under 3 minutes.

Your ready-to-upload package is:
📁 **`godaddy_upload.zip`** located in `/Users/tanuj/Downloads/website of aceneev`

---

## ⚡ Quick 5-Step Upload via GoDaddy cPanel File Manager (Recommended)

### Step 1: Log in to GoDaddy
1. Go to [https://godaddy.com](https://godaddy.com) and click **Sign In**.
2. Go to **My Products** (or click your name in the top-right & select "My Products").

### Step 2: Open cPanel Admin
1. Scroll down to **Web Hosting** (or **Linux Hosting**).
2. Next to your hosting plan, click **Manage**.
3. Click the **cPanel Admin** button.

### Step 3: Open File Manager & Go to `public_html`
1. Inside cPanel, look under the **Files** section and click **File Manager**.
2. In the left folder sidebar, click to open the **`public_html`** folder.
   > *Note:* If you see a default `index.html` or `hostingstart.html` file from GoDaddy inside `public_html`, delete it or rename it.

### Step 4: Upload `godaddy_upload.zip`
1. In the top toolbar of File Manager, click **Upload**.
2. Click **Select File** and choose **`godaddy_upload.zip`** from:
   `/Users/tanuj/Downloads/website of aceneev/godaddy_upload.zip`
3. Wait until the upload progress bar turns green (100%).
4. Click **Go Back to /public_html** at the bottom.

### Step 5: Extract the Files
1. In `public_html`, click on **`godaddy_upload.zip`** to highlight it.
2. Click **Extract** in the top menu bar (or right-click the zip and select **Extract**).
3. Confirm the extraction path is `/public_html` and click **Extract File(s)**.
4. (Optional) You can now delete `godaddy_upload.zip` from `public_html` to save space.

---

## 🎉 That's It! Your Website is Live!
Now open your web browser and visit your GoDaddy domain name (e.g. `https://yourdomain.com`).

---

## 🛡️ What's Included in `godaddy_upload.zip`
- `index.html` — The main corporate website for Aceneev Capital.
- `styles.css` — Custom styling, animations, and dark/light mode themes.
- `app.js` — Live crypto/trading ticker, interactive Chart.js growth calculator, booking modal.
- `.htaccess` — Configured for GoDaddy Apache server (forces HTTPS SSL, enables Gzip compression, speeds up cache).
- `404.html` — Branded "Page Not Found" screen.
- `robots.txt` & `sitemap.xml` — For Google search indexing.
