import mongoose, { Types }  from "mongoose";

const touristDestinationSchema = new mongoose.Schema({
  
    cityId: { type:Types.ObjectId , ref: 'City', required: true },
    type:{type:String,default:"museum",enum:["Museum","Monument"]},
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    ticketPrice: { type: String },
    image: { public_id:String,secure_url:String },
    subImages: [{ public_id:String,secure_url:String }],
    createdBy:{type:Types.ObjectId,required:true,ref:"User"},
    updatedBy:{type:Types.ObjectId,ref:"User"},
    customId:String,
    
    openingHours: {
      type: {
          monday: { type: String },
          tuesday: { type: String },
          wednesday: { type: String },
          thursday: { type: String },
          friday: { type: String },
          saturday: { type: String },
          sunday: { type: String }
      },
      default: {
          monday: "9:00 AM - 5:00 PM",
          tuesday: "9:00 AM - 5:00 PM",
          wednesday: "9:00 AM - 5:00 PM",
          thursday: "9:00 AM - 5:00 PM",
          friday: "9:00 AM - 5:00 PM",
          saturday: "9:00 AM - 5:00 PM",
          sunday: "9:00 AM - 5:00 PM"
      }
  }
  },
  {
    timestamps: true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  }
);

touristDestinationSchema.virtual("reviews",{
  foreignField:"touristDestinationId",
  localField:"_id",
  ref:"Review"
})


const TouristDestination = mongoose.models.TouristDestination || mongoose.model("TouristDestination", touristDestinationSchema);
export default TouristDestination;
