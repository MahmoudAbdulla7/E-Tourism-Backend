import mongoose, { Types } from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true},
    rating: { type: Number,required:true , min: 1, max:5},
    createdBy: { type: Types.ObjectId,ref:"User", required: true },
    touristDestinationId:{type:Types.ObjectId,ref:"TouristDestination",required:true},
    orderId:{type:Types.ObjectId,ref:"Order",required:true},
  },
  {
    timestamps: true,
  }
);

const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export default Review;
