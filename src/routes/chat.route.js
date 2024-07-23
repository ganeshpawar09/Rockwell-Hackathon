import { Router } from "express";
import {
  fetchAccount,
  fetchChat,
  sendMessage,
} from "../controllers/chat_controller.js";

const chatRouter = Router();

chatRouter.route("/send-message").post(sendMessage);
chatRouter.route("/fetch-chat").get(fetchChat);
chatRouter.route("/fetch-account").get(fetchAccount);

export default chatRouter;
