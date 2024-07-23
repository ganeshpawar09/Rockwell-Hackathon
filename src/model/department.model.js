import mongoose from "mongoose";
const departmentSchema = new mongoose.Schema({
  departmentName: {
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

export const Department = mongoose.model("Department", departmentSchema);
