# 🚀 Setup Guide: AI Notes & Image Vault

## Quick Start: 3 Steps

### 1️⃣ Install Dependencies

```powershell
cd backend
npm install
npm install dotenv node-fetch@2.6.7
```

### 2️⃣ Create & Configure `.env` File

Copy `.env.example` to `.env` and fill in your values:

```powershell
# Option A: Manually copy and edit
Copy-Item .env.example .env
# Then open .env in your editor and replace placeholders

# Option B: Create it directly from PowerShell
@"
MONGO_URI=mongodb://localhost:27017/notes_vault
GEMINI_API_KEY=your_free_api_key_here
GEMINI_API_URL=https://your-provider-endpoint/v1/generate
"@ | Out-File -Encoding UTF8 .env
```

### 3️⃣ Get a Free Gemini API Key

**Choose ONE:**

#### Google Gemini (Recommended & Free Tier Available)
1. Go to: https://ai.google.dev/
2. Click "Get API Key" → "Create API key"
3. Copy the key and paste it into `.env`:
   ```
   GEMINI_API_KEY=AIzaSy... (your key)
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   ```

#### Alternative: OpenAI-compatible proxy (if you prefer)
- Use a free tier from services like: Replicate, HuggingFace, or local Ollama
- Update `GEMINI_API_URL` to match the provider's endpoint

### 4️⃣ Start the Server

```powershell
cd backend
npm start
# or directly:
node server.js
```

**Expected output:**
```
MongoDB connected successfully
Server running on port 5000
```

### 5️⃣ Test the Suggest Corrections Endpoint

```powershell
$body = @{text = "Ths is a tst sentense."} | ConvertTo-Json
Invoke-WebRequest -Uri http://localhost:5000/suggest-corrections `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

Or use `curl`:
```bash
curl -X POST http://localhost:5000/suggest-corrections \
  -H "Content-Type: application/json" \
  -d '{"text":"Ths is a tst sentense."}'
```

---

## 📋 Checklist

- [ ] Run `npm install` in backend
- [ ] Copy `.env.example` to `.env`
- [ ] Get free API key (Google Gemini recommended)
- [ ] Fill in `GEMINI_API_KEY` and `GEMINI_API_URL` in `.env`
- [ ] Verify `.env` is in `.gitignore` (so it's never committed)
- [ ] Start server with `node server.js`
- [ ] Test endpoint with curl or Postman

---

## 🔐 Security Reminder

**NEVER commit `.env` files to Git.** They contain secrets.

- ✅ **DO**: Store keys in `.env` (local machine only)
- ✅ **DO**: Share `.env.example` (with placeholder values)
- ❌ **DON'T**: Hardcode keys in source files
- ❌ **DON'T**: Commit `.env` to version control

---

## 🛠️ Troubleshooting

### Error: `Gemini API not configured`
→ Check that `.env` exists in the `backend` folder and has both `GEMINI_API_KEY` and `GEMINI_API_URL`.

### Error: `Cannot find module 'dotenv'`
→ Run `npm install dotenv` in the backend folder.

### Error: `Upstream API error`
→ Verify your API key is correct and the URL matches your provider.

### MongoDB connection fails
→ Set `MONGO_URI` in `.env` or start local MongoDB (`mongod` or Docker).

---

## 📚 What's Next?

- [ ] Test the full flow: POST text → get corrections from Gemini
- [ ] Integrate corrections UI in frontend (`frontend/pages/createNote/CreateNote.jsx`)
- [ ] Deploy & secure (use managed secrets, not `.env` files in production)
