
import User from "../models/user_model.js";
import Jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;  // جاى من Postman

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // تحقق من الـ token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub } = payload; // sub = Google unique ID

        let user = await User.findOne({ email });

               if (user) {
            // المستخدم موجود → ممكن كان مسجل عادي
            if (user.provider !== "google") {
                user.provider = "google";
                user.googleId = sub;
                if (!user.profileImage) user.profileImage = picture;
                await user.save();
            }
        } else {
            // المستخدم جديد → إنشاء
            user = await User.create({
                userName: name,
                email,
                password: "GoogleLogin",
                profileImage: picture,
                provider: "google",
                googleId: sub
            });
            console.log("New Google user created:", user);
        }

        // إنشاء JWT
        const userToken = Jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.json({
            message: "Login with Google successful",
            token: userToken,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Google login failed" });
    }
};
