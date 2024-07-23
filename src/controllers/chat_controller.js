import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../model/chat.model.js";
import { Account } from "../model/account.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "You are given a prompt of customer response. You have to decide which department to notify. Just give me the department name as an output.\n",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const fetchChat = asyncHandler(async (req, res) => {
  const { accountName } = req.body;
  console.log(accountName);
  if (!accountName) {
    throw new ApiError(400, "Account name is missing");
  }

  // Fetch the account by the provided account name
  const account = await Account.findOne({ accountName: accountName }).populate(
    "chats"
  );
  if (!account) {
    throw new ApiError(404, "Account Not Found");
  }

  const chats = account.chats.map((chat) => ({
    name: chat.name,
    message: chat.message,
  }));
  // Send the response
  return res.status(200).json(new ApiResponse(200, chats, "Success"));
});
const fetchAccount = asyncHandler(async (req, res) => {
  const accounts = await Account.find();

  if (!accounts || accounts.length === 0) {
    throw new ApiError(404, "No accounts found");
  }

  return res.status(200).json(new ApiResponse(200, accounts, "Success"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { senderName, message } = req.body;
  console.log(senderName);
  console.log(message);

  if (!senderName || !message) {
    throw new ApiError(400, "Every field is required");
  }

  try {
    // Call Gemini to analyze the message
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    const result = await chatSession.sendMessage(message);
    const department = result.response.text().trim().replace(/^"|"$/g, "");

    // Use the department name as the account name
    const accountName = department;

    // Find the account
    let account = await Account.findOne({ accountName: accountName });
    if (!account) {
      account = new Account({ accountName: accountName, chats: [] });
    }

    // Create a new chat message
    const chat = new Chat({
      name: senderName,
      message,
    });

    // Save the chat message
    await chat.save();

    // Add the chat message to the account's chats array
    account.chats.push(chat._id);
    await account.save();

    return res
      .status(200)
      .json(new ApiResponse(200, chat, "New message sent and added"));
  } catch (error) {
    console.error("Error details:", error); // Log the entire error object
    res.status(500).send({ error: error.message });
  }
});

export { fetchChat, sendMessage, fetchAccount };
