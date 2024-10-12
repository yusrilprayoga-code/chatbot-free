'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createStreamableValue } from 'ai/rsc';

const apiKey = process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_AI_API_KEY is not defined in the environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
});

export async function generateChat(context: string, prompt: string) {
  console.log("context", context);

  const stream = createStreamableValue('');
  const processStream = async () => {
    const result = await model.generateContentStream(`
      You are an AI assistant embedded in a versatile application. You help users by responding to a variety of prompts and queries, providing detailed and thoughtful responses.

      THE TIME NOW IS ${new Date().toLocaleString()}

      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK

      USER PROMPT:
      ${prompt}

      When responding, please keep in mind:
      - Be extremely helpful, clever, and articulate.
      - Provide a detailed and comprehensive response that addresses the user's request.
      - Elaborate on your points and provide examples or supporting information where appropriate.
      - Avoid redundancy and ensure that no point or sentence is repeated.
      - Tailor your response based on the user's prompt and the context, if provided.
      - If the context does not contain enough information, generate a thorough response based on the prompt alone, making reasonable assumptions where necessary.
      - Always provide additional helpful information or suggestions when possible.
      - Adjust the length of the response according to the complexity of the user's query, but aim for thoroughness.
      - Be flexible: whether it's answering questions, generating ideas, writing content, or helping solve problems, your response should be informative, clear, and helpful.
    `);

    let lastChunkText = '';

    // Stream the response and update it in real-time
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText !== lastChunkText) {
        stream.update(chunkText);
      }
      lastChunkText = chunkText;
    }

    stream.done();
  };

  await processStream();

  return { output: stream.value };
}
