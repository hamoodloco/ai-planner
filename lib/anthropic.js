// Using Replit's AI Integrations for Anthropic
import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import pRetry from "p-retry";

// This is using Replit's AI Integrations service, which provides Anthropic-compatible API access without requiring your own Anthropic API key.
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Generate task breakdown using Claude
export async function generateTaskBreakdown(title, description) {
  const prompt = `You are a productivity expert. Break down the following task into actionable subtasks that can each be completed in 25-60 minutes.

Task Title: ${title}
Task Description: ${description || 'No additional description provided'}

Please provide a JSON response with an array of subtasks. Each subtask should have:
- title: A clear, actionable title
- description: A brief description of what needs to be done (optional)
- duration: Estimated duration in minutes (between 25-60)

Format your response as valid JSON:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Brief description",
      "duration": 45
    }
  ]
}

Make sure to:
1. Break down complex tasks into manageable chunks
2. Order subtasks logically
3. Ensure each subtask is focused and achievable
4. Set realistic durations between 25-60 minutes`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === "text") {
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.subtasks.map((subtask, index) => ({
          ...subtask,
          order: index,
          duration: Math.min(Math.max(subtask.duration, 25), 60) // Ensure duration is between 25-60
        }));
      }
    }
    throw new Error("Failed to parse AI response");
  } catch (error) {
    console.error('AI Breakdown Error:', error);
    throw error;
  }
}
