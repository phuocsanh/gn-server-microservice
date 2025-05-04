const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Number, // PostgreSQL user_id
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        fileName: String,
        originalName: String,
        url: String,
        fileType: String, // 'image', 'video', 'audio', 'document', etc.
        mimeType: String, // MIME type of the file
        size: Number, // Size in bytes
        width: Number, // For images and videos
        height: Number, // For images and videos
        duration: Number, // For videos and audio (in seconds)
        thumbnailUrl: String, // For videos
      },
    ],
    readBy: [
      {
        userId: Number,
        readAt: Date,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Indexes for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ sender: 1 })

const Message = mongoose.model("Message", messageSchema)

module.exports = Message
