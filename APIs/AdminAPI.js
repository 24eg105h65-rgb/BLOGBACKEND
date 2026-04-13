import exp from 'express'
import { verifyToken } from '../middleware/verifyToken.js'
import { ArticleModel } from '../models/ArticleModel.js'
import { UserModel } from '../models/UserModel.js'
import {hash} from 'bcrypt'

export const adminApp = exp.Router()



// View All Articles
adminApp.get("/articles", verifyToken("ADMIN"), async (req, res) => {
    // get all articles
    const articles = await ArticleModel.find()
    res.status(200).json({message: "All articles",payload: articles})
})

// Block / Activate User
adminApp.put("/user", verifyToken("ADMIN"), async (req, res) => {
    const { userId, isUserActive } = req.body
    const user = await UserModel.findById(userId)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }
    if (user.isUserActive === isUserActive) {
        return res.status(200).json({ message: "User already in same state" })
    }
    user.isUserActive = isUserActive
    await user.save()
    res.status(200).json({message: "User status updated",payload: user})
})
//route for admin to reset password
adminApp.post("/admin/reset-password",async(req,res)=>{
    const {adminId,newPassword}=req.body
    const hashedPassword=await hash(newPassword,12)    
    res.status(200).json({message:"Admin password reset successfully"})

})