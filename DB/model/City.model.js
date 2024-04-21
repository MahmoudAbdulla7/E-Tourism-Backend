import mongoose, { Types } from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true ,unique:true,lowercase: true},
    slug: { type: String, required: true },
    customId: { type: String, required: true },
    image: { type: Object, required: true },
    createdBy: { type: Types.ObjectId,ref:"User", required: true },
    updatedBy:{type:Types.ObjectId,ref:"User"}
  },
  {
    timestamps: true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  }
);

citySchema.virtual('destination',{
  localField:'_id',
  foreignField:'cityId',
  ref:'TouristDestination'
});

const City =
  mongoose.models.City || mongoose.model("City", citySchema);
export default City;
