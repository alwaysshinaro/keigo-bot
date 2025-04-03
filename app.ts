import { messagingApi, middleware, WebhookEvent } from "@line/bot-sdk";
import express from "express";
import ngrok from "ngrok";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};

const GEMINI_API_KEY = process.env.GEMINI_API;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const app = express();

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.use("/webhook", middleware(config));

app.use(express.json());

app.post("/webhook", (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then((result) => {
    res.json(result);
  });
});
// eventハンドルだからここの内容を変える。ここでapi叩く
async function handleEvent(event: WebhookEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userText = event.message.text;

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: `あなたは優秀なAIアシスタントです。あなたはユーザーから送られてきた文章を正しい敬語に直してから出力してください。ユーザーから与えられた入力を敬語にしたもの以外は絶対に出力しないでください。
    ユーザーの入力: 「${userText}」
    `,
  });

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: "text",
        text: result.text ?? "テキストの生成に失敗しました",
      },
    ],
  });
}

const port = Number(process.env.PORT) || 3000;
app.listen(port, async () => {
  try {
    const ngrokUrl = await ngrok.connect(port);
    console.log(`Ngrok URL: ${ngrokUrl}/webhook`);
  } catch (e) {
    console.log("Error while connecting w/ ngrok", e);
  }
});
