import mongoose from "mongoose";
const accountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
  },
  chats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat", 
    },
  ],
});

export const Account = mongoose.model("Account", accountSchema);
