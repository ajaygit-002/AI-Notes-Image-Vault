const { model } = require('../config/gemini');

// Helper to build prompt based on type
function buildPrompt(type, content) {
  switch (type) {
    case 'corrections':
      return `You are a strict JSON-only responding assistant. Analyze the text and return a single valid JSON object with these keys: \n- "corrected": the full corrected text (string)\n- "changes": an array of objects {"from":"...","to":"...","index":number} representing word-level changes\nReturn ONLY the JSON object and nothing else.\n\nText:\n${content}`;
    case 'summarize':
      return `You are a concise summarizer. Summarize the following content in a short and clear way without adding extra commentary:\n\n${content}`;
    case 'improve':
      return `You are a professional editor. Improve the writing, grammar, and clarity of the following text. Return only the improved text:\n\n${content}`;
    case 'title':
      return `You are a title generator. Provide a short attractive title for the following content (one line):\n\n${content}`;
    case 'shorten':
    case 'short':
      return `You are a concise writer. Convert the following long content into a short, clear version without losing meaning:\n\n${content}`;
    case 'expand':
      return `You are a professional writer. Expand the following content into a detailed, well-structured explanation suitable for documentation or a blog post:\n\n${content}`;
    default:
      return `You are an assistant. Process the content as requested:\n\n${content}`;
  }
}

exports.generateAIContent = async (req, res) => {
  try {
    const { content, type } = req.body || {};
    if (!content) return res.status(400).json({ message: 'Missing content' });

    const prompt = buildPrompt(type, content);

    // The underlying gemini client may expose different method signatures depending on SDK version.
    // We follow a simple pattern: attempt generateContent and read the text result.
    const result = await (model.generateContent ? model.generateContent(prompt) : model.generate ? model.generate({ prompt }) : Promise.resolve(null));

    // Attempt to extract text in a few common shapes
    let text = '';
    try {
      if (result == null) {
        text = '';
      } else if (result?.response && typeof result.response.text === 'function') {
        text = await result.response.text();
      } else if (result?.outputText) {
        text = result.outputText;
      } else if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = result.candidates[0].content.parts[0].text;
      } else if (typeof result === 'string') {
        text = result;
      } else if (result?.text) {
        text = result.text;
      } else {
        text = JSON.stringify(result);
      }
    } catch (e) {
      text = String(result);
    }

    // Normalize output according to requested type so frontend gets structured data
    const normalizeOutput = (type, rawText) => {
      const t = (rawText || '').trim();

      // attempt to parse JSON when appropriate
      try {
        const parsed = JSON.parse(t);
        return parsed;
      } catch (e) {
        // not JSON, continue
      }

      if (type === 'title') {
        return { title: t };
      }

      if (type === 'summarize' || type === 'shorten') {
        return { summary: t };
      }

      if (type === 'improve' || type === 'expand') {
        return { text: t };
      }

      if (type === 'corrections') {
        // best-effort word-level diff
        const orig = String(req.body.content || '');
        const origTokens = orig.split(/\s+/).filter(Boolean);
        const corrTokens = t.split(/\s+/).filter(Boolean);
        const len = Math.max(origTokens.length, corrTokens.length);
        const changes = [];
        for (let i = 0; i < len; i++) {
          const from = origTokens[i] || '';
          const to = corrTokens[i] || '';
          if (from !== to) changes.push({ index: i, from, to });
        }
        return { corrected: t, changes };
      }

      // fallback: return raw text in a `text` key
      return { text: t };
    };

    const dataOut = normalizeOutput(type, text);
    return res.status(200).json({ success: true, data: dataOut, raw: text });
  } catch (error) {
    console.error('AI generation error:', error);
    return res.status(500).json({ message: 'AI error', error: error.message || String(error) });
  }
};
