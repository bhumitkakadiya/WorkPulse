const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AICommandLog = require('../models/AICommandLog');

router.use(protect);

// Sandboxed action allow-list
const ALLOWED_ACTIONS = ['open_app', 'close_app', 'open_url', 'web_search', 'run_routine'];

// @route  POST /api/ai/command
// Sends NL text to Gemini, returns structured action
router.post('/command', async (req, res) => {
  const { text, inputType = 'text' } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'text is required' });

  let parsedAction = null;
  let result = 'failed';
  let errorMessage = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Demo mode — return mock action
      parsedAction = { name: 'open_url', args: { url: `https://www.google.com/search?q=${encodeURIComponent(text)}` } };
      result = 'success';
    } else {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const systemPrompt = `You are Pulse AI, an assistant that controls a user's computer using only a fixed set of sandboxed actions.
You must respond ONLY with a valid JSON object (no markdown, no explanation) matching this schema:
{ "action": "<action_name>", "args": { ... } }

Allowed actions:
- open_app: args: { app_name: string }
- close_app: args: { app_name: string }
- open_url: args: { url: string }
- web_search: args: { query: string }
- run_routine: args: { routine_name: string }

User command: "${text}"`;

      const geminiRes = await model.generateContent(systemPrompt);
      const raw = geminiRes.response.text().trim().replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(raw);

      if (!ALLOWED_ACTIONS.includes(parsed.action)) {
        throw new Error(`Action '${parsed.action}' not in allowed list`);
      }
      parsedAction = { name: parsed.action, args: parsed.args };
      result = 'success';
    }
  } catch (err) {
    errorMessage = err.message;
    result = 'failed';
  }

  // Log to DB
  const log = await AICommandLog.create({
    userId: req.user.id, rawInput: text, parsedAction, result, errorMessage, inputType,
  });

  res.json({ success: result === 'success', action: parsedAction, result, errorMessage, logId: log._id });
});

// @route  POST /api/ai/query
// Sends NL text to Gemini, returns a natural language response
router.post('/query', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ success: false, message: 'text is required' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Demo mode
      setTimeout(() => {
        res.json({ 
          success: true, 
          response: "This is a demo response. Please configure a valid GEMINI_API_KEY to receive real AI insights." 
        });
      }, 1000);
      return;
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are Pulse AI, an intelligent HR and productivity assistant for WorkPulse.
Answer the user's question helpfully and concisely.

User query: "${text}"`;

    const geminiRes = await model.generateContent(systemPrompt);
    const responseText = geminiRes.response.text().trim();

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error('[AI Query Error]', err);
    res.status(500).json({ success: false, message: 'Pulse AI is unavailable right now. Please try again.' });
  }
});

module.exports = router;
