import { Router } from "express";
import {
  fetchDepartment,
  fetchChat,
  sendMessage,
} from "../controllers/chat_controller.js";

const chatRouter = Router();

chatRouter.route("/send-message").post(sendMessage);
chatRouter.route("/fetch-chat").post(fetchChat);
chatRouter.route("/fetch-department").get(fetchDepartment);

export default chatRouter;
