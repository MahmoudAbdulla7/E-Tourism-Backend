import mongoose, { Types } from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId:{type:Types.ObjectId,ref:"User",required:true},
    phone:[{type:String,required:true}],

    touristDestination:{
        name:{type:String,required:true},
        touristDestinationId:{type: Types.ObjectId,ref:"TouristDestination", required: true },
        quantity:{type:Number,default:1,required:true},
        unitPrice:{type:Number,default:1,required:true},
        finalPrice:{type:Number,default:1,required:true}
    },
    faceId:{type:String,required:true},
    paymentType:{type:String,default:"cash",enum:["cash","card"]},
    status:{type:String,default:'placed',enum:["waitPayment",'placed','canceled','rejected','delivered']},
    reason:String,
    updatedBy:{type:Types.ObjectId,ref:"User"},
    DateOfVisit:{type:Date,required:true}
  },
  {
    timestamps: true,
  }
);
const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);
export default Order;
