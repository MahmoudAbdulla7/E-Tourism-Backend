import {asyncHandler} from '../../../utils/errorHandling.js';
import Order from '../../../../DB/model/Order.model.js';
import Review from '../../../../DB/model/Reviews.model.js';

export const createComment =asyncHandler(async(req,res,next)=>{

    const {touristDestinationId}=req.params;
    const {rating,comment}=req.body;
    const order =await Order.findOne({userId:req.user._id , status:"delivered", "touristDestination.touristDestinationId":touristDestinationId});
 
    if (!order) {
        return next(new Error("can not review before visit it",{cause:400}));
    };

    const oldReview= await Review.findOne({createdBy:req.user._id,touristDestinationId,orderId:order._id});
    if (oldReview?._id) {
        return next(new Error("Already reviewed by you",{cause:409}));
    };

    const review = await Review.create({touristDestinationId ,orderId:order._id,createdBy:req.user._id,rating,comment});
    return res.status(201).json({message:"comment is created successfully"});

});

export const updateComment = asyncHandler(async(req,res,next)=>{

    const {touristDestinationId,reviewId}=req.params;
    const review= await Review.findOneAndupdateOne({_id:reviewId,touristDestinationId},req.body,{new:true});

    if (review.comment!==req.body.comment || review.rating!==req.body.rating) {
        return next(new Error("Failed",{cause:500}));
    }
    return res.status(200).json({message:"comment is updated successfully"});

});

export const deleteComment = asyncHandler(async(req,res,next)=>{

    const {touristDestinationId,reviewId}=req.params;
    await Review.deleteOne({_id:reviewId,touristDestinationId},req.body);
    return res.status(200).json({message:"comment is deleted successfully"});

});

export const getAllReviews = asyncHandler(async(req,res,next)=>{

    const reviews= await Review.find({touristDestinationId:req.params.touristDestinationId})
    return res.status(200).json({reviews});

});