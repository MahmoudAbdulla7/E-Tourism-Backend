import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    wishList: { type: [{ type: mongoose.Types.ObjectId, ref: "Product" }] }, //place instead of product
    userName: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      unique: [true, "userName is required"],
    },
    email: {
      type: String,
      unique: [true, "email must be unique value"],
      required: [true, "email is required"],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      default: "User",
      enum: ["User", "Admin","Inspector"],
    },
    active: {
      type: String,
      default: "offline",
      enum: ["offline", "online", "blocked"],
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    image: {
      public_id: { type: String },
      secure_url: { type: String },
    },
    DOB: String,
    faceId:String,
    gender: { type: String, default: "male", enum: ["male", "female"] },
    country: String,
    forgetCode: { type: String, default: null },
    changePassword: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || model("User", userSchema);
export default User;
