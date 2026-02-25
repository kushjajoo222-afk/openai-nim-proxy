const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const NIM_API_BASE = 'https://integrate.api.nvidia.com/v1';
const NIM_API_KEY = process.env.NIM_API_KEY;

const MODEL_MAPPING = {
  'gpt-3.5-turbo': 'meta/llama-3.1-8b-instruct',
  'gpt-4': 'meta/llama-3.1-70b-instruct',
  'gpt-4-turbo': 'meta/llama-3.1-70b-instruct',
  'gpt-4o': 'meta/llama-3.1-70b-instruct',
  'claude-3-opus': 'meta/llama-3.1-70b-instruct',
  'claude-3-sonnet': 'meta/llama-3.1-8b-instruct',
  'glm-4': 'z-ai/glm4.7',
  'deepseek': 'deepseek-ai/deepseek-v3.2',
  'glm-5': 'z-ai/glm5',
  'kimi': 'moonshotai/kimi-k2-thinking',
};

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/v1', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: Object.keys(MODEL_MAPPING).map(id => ({
      id,
      object: 'model',
      created: 1700000000,
      owned_by: 'nvidia'
    }))
  });
});

app.post('/v1/chat/completions', async (req, res) => {
  console.log('Request received:', req.body.model);
  try {
    const { model, messages, temperature, max_tokens, stream } = req.body;
    const nimModel = MODEL_MAPPING[model] || 'meta/llama-3.1-8b-instruct';

    const response = await axios.post(`${NIM_API_BASE}/chat/completions`, {
      model: nimModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1024,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${NIM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.data.choices[0].message.content
        },
        finish_reason: 'stop'
      }],
      usage: response.data.usage || {}
    });

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    res.status(500).json({
      error: {
        message: err.response?.data?.detail || err.message,
        type: 'server_error',
        code: 500
      }
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
});
