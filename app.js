"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_sdk_1 = require("@line/bot-sdk");
const express_1 = __importDefault(require("express"));
const ngrok_1 = __importDefault(require("ngrok"));
const dotenv_1 = __importDefault(require("dotenv"));
const genai_1 = require("@google/genai");
dotenv_1.default.config();
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};
const GEMINI_API_KEY = process.env.GEMINI_API;
const ai = new genai_1.GoogleGenAI({ apiKey: GEMINI_API_KEY });
const app = (0, express_1.default)();
const client = new bot_sdk_1.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});
app.use("/webhook", (0, bot_sdk_1.middleware)(config));
app.use(express_1.default.json());
app.post("/webhook", (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => {
        res.json(result);
    });
});
// eventハンドルだからここの内容を変える。ここでapi叩く
function handleEvent(event) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (event.type !== "message" || event.message.type !== "text") {
            return Promise.resolve(null);
        }
        const userText = event.message.text;
        const result = yield ai.models.generateContent({
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
                    text: (_a = result.text) !== null && _a !== void 0 ? _a : "テキストの生成に失敗しました",
                },
            ],
        });
    });
}
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ngrokUrl = yield ngrok_1.default.connect(port);
        console.log(`Ngrok URL: ${ngrokUrl}/webhook`);
    }
    catch (e) {
        console.log("Error while connecting w/ ngrok", e);
    }
}));
