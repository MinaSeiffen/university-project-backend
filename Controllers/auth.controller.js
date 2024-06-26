import { generateTokenAndSetCookie } from "../Lib/Utils/generateToken.js";
import userModel from "../Models/user.model.js";
import bcrypt from "bcryptjs";

export const handleSignup = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, birthDate, email, password } =
      req.body;

    console.log(req.body);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const excistingEmail = await userModel.findOne({ email });

    if (excistingEmail) {
      return res.status(401).json({ error: "Email is Taken" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // hashing Password

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      firstName,
      lastName,
      phoneNumber,
      email,
      birthDate,
      password: hashedPassword,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(200).json({
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        birthDate: newUser.birthDate,
        message: "Signed Up Successfully",
      });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      message: "Logged in successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const handleLogout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: 0,
      expires: new Date(0), 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "none",
      path: "/",
    });
    res.status(200).json({ message: "Logged out Successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
