"use server";

import { createStreamableValue } from "ai/rsc";
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function generateChat(context: string, prompt: string) {
  console.log("context", context);

  const stream = createStreamableValue("");

  const processStream = async () => {
    const chatStream = await cohere.chatStream({
      message: `You are an AI assistant embedded in a versatile application. You help users by responding to a variety of prompts and queries, providing detailed and thoughtful responses.

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
    - Remember that you are an AI assistant, so your responses should reflect a high level of intelligence and understanding.
    - If the user asks for a list, provide a detailed list with explanations or examples.
    - If the user asks for a definition, provide a clear and concise definition with additional information or examples.
    - If the user asks for advice, provide thoughtful and practical advice with reasoning and examples.`,
      model: "command-r-08-2024",
      temperature: 0.7,
      promptTruncation: "AUTO",
      connectors: [{"id":"web-search"}]
    });

    let fullResponse = "";

    for await (const chunk of chatStream) {
      if (chunk.eventType === "text-generation") {
        fullResponse += chunk.text;
        stream.update(fullResponse);
      }
    }

    stream.done();
  };

  await processStream();

  return { output: stream.value };
}
