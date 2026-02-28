require("dotenv").config();

async function testGeminiAPI() {
  console.log("Testing Gemini API...");
  console.log("API Key:", process.env.GEMINI_API_KEY ? "SET" : "MISSING");
  console.log("API URL:", process.env.GEMINI_API_URL);

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = process.env.GEMINI_API_URL;

  if (!GEMINI_API_KEY || !GEMINI_API_URL) {
    console.error("API key or URL not configured!");
    return;
  }

  try {
    // Use native fetch (available in Node 18+) or dynamic import node-fetch
    const fetch = global.fetch || (await import("node-fetch")).default;

    const payload = {
      contents: [{
        parts: [{
          text: "Say hello."
        }]
      }]
    };

    const urlWithKey = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    console.log("\nCalling:", urlWithKey.substring(0, 100) + "...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(urlWithKey, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("\nResponse Status:", response.status);
    console.log("Response OK:", response.ok);

    const text = await response.text();
    console.log("Response Body:", text.substring(0, 500));

    if (response.ok) {
      const result = JSON.parse(text);
      console.log("\n✅ SUCCESS! API is working.");
      console.log("Result:", JSON.stringify(result, null, 2).substring(0, 300));
    } else {
      console.log("\n❌ ERROR  from API (non-200 status)");
      try {
        const err = JSON.parse(text);
        console.log("Error details:", JSON.stringify(err, null, 2));
      } catch (e) {
        console.log("Raw response:", text);
      }
    }
  } catch (error) {
    console.error("\n❌ Fetch error:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Only run the test when this script is executed directly (not when required)
if (require.main === module) {
  testGeminiAPI();
}
