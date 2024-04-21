import { asyncHandler } from "../../../utils/errorHandling.js";
import generateConfirmEmail from "../../../utils/genrateConfirmEMail.js";
import { hash, compare } from "../../../utils/HashAndCompare.js";
import User from "../../../../DB/model/User.model.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/GenerateAndVerifyToken.js";
import { nanoid, customAlphabet } from "nanoid";
import cloudinary from "../../../utils/cloudinary.js";
import sendEmail from "../../../utils/email.js";

export const signUp = asyncHandler(async (req, res, next) => {

  const { email, userName, password } = req.body;

  if (await User.findOne({ $or: [ { email: email.toLowerCase() }, { userName: userName.toLowerCase() } ] })) {
    return next(new Error("email or userName is already exist", { cause: 409 }));
  };

  const hashedPassword = hash({ plaintext: password, salt: 9 });
  req.body.password = hashedPassword;
  
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: `${process.env.APP_NAME}/users/${req.body.userName}` }
  );
  req.body.image = { public_id, secure_url };
  
  await generateConfirmEmail(email, req);

  const user = await User.create({ ...req.body });
  res.status(201).json({ message: "Done", _id: user._id });
});

export const confirmationToken = asyncHandler(async (req, res, next) => {

  const { confirmationToken } = req.params;
  const { email } = verifyToken({ token: confirmationToken });

  if (!email) {
    return next(new Error("in-valid token payload"));
  };

  const user = await User.updateOne({ email }, { confirmEmail: true });

  if (!user.matchedCount) {
    return next(new Error("in-valid email"));
  };

  return res.status(200).redirect(`${process.env.Front_End}/confirm-email`);
});

export const unsubscribe = asyncHandler(async (req, res, next) => {

  const { newConfirmToken } = req.params;
  const { email } = verifyToken({ token: newConfirmToken });

  if (!email) {
    return next(new Error("in-valid token payload"));
  };

  const user = await User.findOneAndDelete({ email });
  await cloudinary.uploader.destroy(user.image.public_id);

  if (user.confirmEmail) {
    return next(new Error("sorry email was confirmed"));
  };

  if (!user.deletedCount) {
    return next(new Error("in-valid email"));
  };

  return res.status(200).json({ message: "account has been deleted"});
});

export const requestNewConfirmMail = asyncHandler(async (req, res, next) => {

  const { newConfirmToken } = req.params;
  const { email } = verifyToken({ token: newConfirmToken });

  if (!email) {
    return next(new Error("in-valid token payload"));
  };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return next(new Error("not register account"), { cause: 404 });
  };

  if (user.confirmEmail) {
    return next(new Error("email is already confirmed"));
  }

  generateConfirmEmail(email, req);
  return res.status(200).json({ message: "check your inbox" });
});

export const logIn = asyncHandler(async (req, res, next) => {

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new Error("in-valid login data", { cause: 404 }));
  };

  if (!compare({ plaintext: password, hashValue: user.password })) {
    return next(new Error("in-valid login data"), { cause: 400 });
  };

  if (!user.confirmEmail) {
    generateConfirmEmail(email, req);
    return next(new Error("please confirm your email"), { cause: 400 });
  };

  const accessToken = generateToken({
    payload: { id: user._id, role: user.role,userName:user.userName,lastName:user.lastName,firstName:user.firstName,email:user.email,image:user.image.secure_url },
    expiresIn: 60 * 30,
  });

  const refreshToken = generateToken({
    payload: { id: user._id, role: user.role },
    expiresIn: 60 * 60 * 24 * 30 * 365,
  });

  user.active = "online";
  res.status(201).json({ message: "Done", accessToken, refreshToken });
});

export const sendCode = asyncHandler(async (req, res, next) => {

  const { email } = req.body;
  const nanoId = customAlphabet("0123456789", 6);
  const user = await User.findOneAndUpdate(
    { email },
    { forgetCode: nanoId() },
    { new: true }
  );

  if (!user) {
    return next(new Error("not register account"), { cause: 404 });
  };

  const html = `
                <br/>
                <br/>
                <p>code for reset password</p>
                <p>${user.forgetCode}</p>
                <br/>
                <br/>`;

  await sendEmail({ to: email, subject: "forget password", html });

  return res.status(201).json({ message: "check your inbox" });
});

export const resetPassword = asyncHandler(async (req, res, next) => {

  const { email, password, forgetCode } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new Error("not register account"), { cause: 404 });
  }

  if (forgetCode !== user.forgetCode || user.forgetCode == null) {
    return next(new Error("in-valid forget code"), { cause: 400 });
  };

  user.password = hash({ plaintext: password });
  user.forgetCode = null;
  user.changePassword = Date.now();
  user.save();

  return res.status(200).json({ message: "password has been changed" });
});

export const profile = asyncHandler(async (req, res, next) => {

  const { userId } = req.params;
  const user = await User.findById(userId).select("-password -image.public_id -forgetCode -confirmEmail -wishList");

  if (!user) {
    return next(new Error(`user with id :${userId} is not found`));
  }

  return res.status(200).json({ user });
});

export const changePassword = asyncHandler(async (req, res, next) => {

  const { oldPassword , newPassword } = req.body;

  const user =await User.findById(req.user._id);

  if (!user) {
    return next(new Error(`user with id:${req.user._id} is not found`, { cause: 404 }));
  };
  const match =compare({plaintext:oldPassword,hashValue:user.password});
  if (!match) {
    return next(new Error(`old password is wrong`,{cause:400}));
  }

  const hashedPassword = hash({ plaintext: newPassword, salt: 9 });
  user.password =hashedPassword;
  user.save();

  res.status(200).json({ message: "password changed successfully"});
});