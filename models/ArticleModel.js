import { Schema, model, Types } from "mongoose";

const commentSchema = new Schema({
  user: {
    type: Types.ObjectId,
    ref: "user",
    required: [true, "User ID required"],
  },
  comment: {
    type: String,
    required:[true,"Enter a comment"],
  },
});

const articleSchema = new Schema(
  {
    author: {
      type: Types.ObjectId,
      ref: "user",
      required: [true, "Author ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    comments: [{ type: commentSchema, default: [] }],
    isArticleActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    strict: "throw",
  },
);

//create article model
export const ArticleModel = model("article", articleSchema);

// "mbsdf6sdf6df6sd6fs6dfs6df6sd"
//ObjectId("bf7f7f7f7f7f7f77f7f")

//{ comment:"",user:""}
//find().populate("cart.product","pid productName brand")