import exp from "express";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { ArticleModel } from "../models/ArticleModel.js";
export const userApp = exp.Router();

//Read articles of all authors
userApp.get("/articles", verifyToken("USER"), async (req, res) => {
  //read artcles
  const articlesList = await ArticleModel.find({ isArticleActive: true });
  //send res
  res.status(200).json({ message: "artciles", payload: articlesList });
});

//Add comment to an article
userApp.put("/articles", verifyToken("USER"), async (req, res) => {
  //get body from req
  const { articleId, comment } = req.body;
  //check article
  const articleDocument = await ArticleModel
                          .findOne({ _id: articleId, isArticleActive: true })
                           .populate("comments.user");

  console.log(articleDocument);
  //if article nbot found
  if (!articleDocument) {
    return res.status(404).json({ message: "Article not found" });
  }
  //get user id
  const userId = req.user?.id;
  //add comment to comments array of articleDocument
  articleDocument.comments.push({ user: userId, comment: comment });
  //save
  await articleDocument.save();
  //send res
  res.status(200).json({ message: "Comment added successfully", payload: articleDocument });
});