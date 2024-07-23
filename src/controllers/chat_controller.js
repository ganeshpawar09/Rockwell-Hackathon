import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../model/chat.model.js";
import { Department } from "../model/department.model.js";
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
  const { departmentName } = req.body;
  console.log(departmentName);
  
  if (!departmentName) {
    throw new ApiError(400, "Department name is missing");
  }

  // Fetch the department by the provided department name
  const dep = await Department.findOne({ departmentName }).populate("chats");
  if (!dep) {
    throw new ApiError(404, "Department Not Found");
  }

  // Map the chats to the desired format
  const chats = dep.chats.map((chat) => ({
    name: chat.name,
    message: chat.message,
  }));

  // Send the response
  return res.status(200).json(new ApiResponse(200, chats, "Success"));
});

const fetchDepartment = asyncHandler(async (req, res) => {
  const deps = await Department.find();

  if (!deps || deps.length === 0) {
    throw new ApiError(404, "No departments found");
  }

  return res.status(200).json(new ApiResponse(200, deps, "Success"));
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
    const dep = result.response.text().trim().replace(/^"|"$/g, "");

    // Use the department name from the result
    const departmentName = dep;

    // Find the department
    let department = await Department.findOne({ departmentName });
    if (!department) {
      department = new Department({
        departmentName,
        chats: [],
      });
    }

    // Create a new chat message
    const chat = new Chat({
      name: senderName,
      message,
    });

    // Save the chat message
    await chat.save();

    // Add the chat message to the department's chats array
    department.chats.push(chat._id);
    await department.save(); // Save the department instance

    return res.status(200).json(new ApiResponse(200, chat, "New message sent and added"));
  } catch (error) {
    console.error("Error details:", error); // Log the entire error object
    res.status(500).send({ error: error.message });
  }
});

export { fetchChat, sendMessage, fetchDepartment };
