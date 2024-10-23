import { Client, GatewayIntentBits } from "discord.js";
import OpenAI from "openai";

const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});
const openaiClient = new OpenAI();

const channelId = process.env.DISCORD_CHANNEL_ID;
if (!channelId) {
  throw new Error("DISCORD_CHANNEL_ID is required.");
}

const model = process.env.OPENAI_MODEL;
if (!model) {
  throw new Error("OPENAI_MODEL is required.");
}

const maxCompletionTokens = process.env.MAX_COMPLETION_TOKENS_PER_MESSAGE
  ? parseInt(process.env.MAX_COMPLETION_TOKENS_PER_MESSAGE)
  : 0;

discordClient.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== channelId) return;

  await message.channel.sendTyping();
  let completion;
  try {
    completion = await openaiClient.chat.completions.create({
      messages: [{ role: "user", content: message.content }],
      model,
      max_completion_tokens: maxCompletionTokens > 0 ? maxCompletionTokens : undefined,
    });
  } catch (error) {
    console.error(error);
    await message.reply(
      process.env.OPENAI_ERROR_RESPONSE ?? "An error occurred."
    );
    return;
  }

  const response =
    completion.choices[0].message.content ??
    process.env.OPENAI_EMPTY_RESPONSE ??
    "I'm sorry, I don't understand.";

  await message.reply(response);
});

void discordClient.login();
