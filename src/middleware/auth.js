import jwt from "jsonwebtoken";
import User from "../../DB/model/User.model.js";
import { asyncHandler } from "../utils/errorHandling.js";

export const roles = {
  Admin: "Admin",
  User: "User",
};

// ========= authorization && authontication ===============

export const auth = (accessRole = []) => {
  return asyncHandler(async (req, res, next) => {

    const { authorization } = req.headers;
    if (!authorization) {
      return next(new Error("in-valid data"), { cause: 400 });
    };
    if (!authorization?.startsWith(process.env.BEARER_KEY)) {
      return next(new Error("In-valid bearer key"), { cause: 400 });
    };
    const token = authorization.split(process.env.BEARER_KEY)[1];
    if (!token) {
      return next(new Error("In-valid token"), { cause: 400 });
    }
    const decoded = jwt.verify(token, process.env.TOKEN_SIGNATURE);
    
    if (!decoded?.id) {
      return next(new Error("In-valid token payload"), { cause: 400 });
    }
    const authUser = await User.findById(decoded.id);
    if (!authUser) {
      return next(new Error("Not register account"), { cause: 404 });
    }
    if (parseInt(authUser?.changePassword?.getTime() / 1000) > decoded.iat) {
      return next(new Error("expired token", { cause: 400 }));
    }
    if (!accessRole.includes(authUser.role)) {
      return next(new Error("not authrized user"), { cause: 403 });
    }

    req.user = authUser;
    return next();
  });
};
