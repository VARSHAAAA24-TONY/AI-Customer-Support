const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getChatStream = async (messages) => {
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  });
};

module.exports = {
  getChatStream,
};
