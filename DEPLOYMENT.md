# Roaya Hospital App - Deployment Guide

This guide provides instructions for deploying the Roaya Hospital application to Google Cloud and other hosting providers like Namecheap.

## 1. Google Cloud Run Deployment (Recommended)

Google Cloud Run is the best way to host this application with full AI functionality.

### Prerequisites
- A Google Cloud Project
- Google Cloud SDK installed locally
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Steps
1. **Build the Docker Image:**
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/roaya-app
   ```
2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy roaya-app \
     --image gcr.io/[PROJECT_ID]/roaya-app \
     --platform managed \
     --set-env-vars GEMINI_API_KEY=[YOUR_API_KEY] \
     --allow-unauthenticated
   ```

## 2. Shared Hosting (e.g., Namecheap)

For shared hosting, you need to export the application as a static build.

### Steps
1. **Build the project:**
   ```bash
   npm run build
   ```
2. **Prepare the package:**
   - Compress the contents of the `dist/` folder into a `.zip` file.
   - Upload the `.zip` file to your hosting provider via cPanel or FTP.
   - Extract the files into your `public_html` directory.

### Important Note on API Keys for Static Hosting
When hosting as a static site (like on Namecheap), environment variables are injected at **build time**. 
To ensure AI functionality works:
1. Create a `.env` file in the root directory.
2. Add `VITE_GEMINI_API_KEY=your_key_here`.
3. Run `npm run build`.
4. The key will be bundled into the JavaScript files. 
   *Note: This makes the key visible in the browser's network tab. For higher security, use a backend proxy.*

## 3. Security Best Practices
- **Key Protection:** Never commit your `.env` file to public repositories.
- **Access Control:** Use Firebase Auth if you need to restrict access to specific users.
- **Monitoring:** Monitor your Gemini API usage in the Google AI Studio dashboard.

## 4. Local Knowledge Fallback
The application is equipped with a `LOCAL_KNOWLEDGE` base in `src/services/geminiService.ts`. If the AI connection fails or the API key is missing, the assistant will still be able to answer basic questions about Roaya Hospital and common eye conditions.
