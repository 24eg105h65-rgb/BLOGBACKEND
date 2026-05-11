import exp from "express";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { UserModel } from "../models/UserModel.js";

export const adminApp = exp.Router();

// Read all users
adminApp.get("/users", verifyToken("ADMIN"), async (req, res, next) => {
	try {
		const usersList = await UserModel.find({ role: "USER" }, { password: 0 }).sort({ createdAt: -1 });
		res.status(200).json({ message: "users", payload: usersList });
	} catch (err) {
		next(err);
	}
});

// Read all authors
adminApp.get("/authors", verifyToken("ADMIN"), async (req, res, next) => {
	try {
		const authorsList = await UserModel.find({ role: "AUTHOR" }, { password: 0 }).sort({ createdAt: -1 });
		res.status(200).json({ message: "authors", payload: authorsList });
	} catch (err) {
		next(err);
	}
});

// Block or unblock user
adminApp.patch("/users/:id/status", verifyToken("ADMIN"), async (req, res, next) => {
	try {
		const { id } = req.params;
		const { isUserActive } = req.body;

		if (typeof isUserActive !== "boolean") {
			return res.status(400).json({ message: "isUserActive must be boolean" });
		}

		const updatedUser = await UserModel.findOneAndUpdate(
			{ _id: id, role: "USER" },
			{ $set: { isUserActive } },
			{ new: true, projection: { password: 0 } },
		);

		if (!updatedUser) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json({ message: "User status updated", payload: updatedUser });
	} catch (err) {
		next(err);
	}
});

// Block or unblock author
adminApp.patch("/authors/:id/status", verifyToken("ADMIN"), async (req, res, next) => {
	try {
		const { id } = req.params;
		const { isUserActive } = req.body;

		if (typeof isUserActive !== "boolean") {
			return res.status(400).json({ message: "isUserActive must be boolean" });
		}

		const updatedAuthor = await UserModel.findOneAndUpdate(
			{ _id: id, role: "AUTHOR" },
			{ $set: { isUserActive } },
			{ new: true, projection: { password: 0 } },
		);

		if (!updatedAuthor) {
			return res.status(404).json({ message: "Author not found" });
		}

		res.status(200).json({ message: "Author status updated", payload: updatedAuthor });
	} catch (err) {
		next(err);
	}
});