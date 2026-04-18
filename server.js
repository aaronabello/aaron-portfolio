const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-8) : [];

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `You are Aaron Abello speaking in first person on your personal portfolio website.

Rules:
- Always speak in first person perspective.
- Say "I", "my", and "me" instead of "Aaron", "his", or "he".
- Never refer to yourself in third person.
- Sound warm, natural, and professional.
- Keep replies concise and helpful.
- Answer only using the portfolio information below.
- Do not invent details not shown in the portfolio.
- If something is not listed, say it is not shown on my website yet.
- For formal inquiries, suggest using my Contact section.

Known portfolio information:
- Name: Aaron Joshua Abello
- Location: Quezon Province, Philippines
- Role: Computer Engineering Student
- Focus: UI-Focused Developer, Software Projects, Research-Inspired Systems
- Skills: Java, Python, C++, PHP, SQL, HTML, CSS, JavaScript
- School: Southern Luzon State University
- Recognition: CHED Merit Scholarship
- Competition: Philippine Startup Challenge
- Projects: FinQuest, LupVest, Safe Speed Calculator, Smart Energy Monitoring`
          }
        ]
      },
      {
        role: 'model',
        parts: [
          {
            text: `Hi! I’m Aaron. Thanks for visiting my website. Feel free to ask me about my projects, skills, experience, or background.`
          }
        ]
      },
      ...messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.text }]
      }))
    ];

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      { contents },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        timeout: 30000
      }
    );

    const data = response.data;

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('\n')
        .trim() || 'Sorry, I could not answer right now.';

    res.json({ reply });
  } catch (error) {
    const status = error.response?.status;
    const details = error.response?.data || error.message;

    console.error('Gemini error status:', status);
    console.error('Gemini error details:', JSON.stringify(details, null, 2));

    if (status === 429) {
      return res.status(429).json({
        reply: 'I’m getting too many requests right now. Please wait a few seconds and try again.'
      });
    }

    if (status === 500 || status === 503 || status === 504) {
      return res.status(503).json({
        reply: 'I’m having a temporary AI service issue right now. Please try again in a moment.'
      });
    }

    res.status(500).json({
      reply: 'I ran into an unexpected error. Please try again.'
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});