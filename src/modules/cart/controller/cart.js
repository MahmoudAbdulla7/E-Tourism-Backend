import Cart from '../../../../DB/model/Cart.model.js'
import { asyncHandler } from '../../../utils/errorHandling.js';
import TouristDestination from '../../../../DB/model/TouristDestination.model.js';

export const createCart =asyncHandler( async (req ,res,next)=>{

    const {touristDestinationId,quantity}=req.body;
    const touristDestination = await TouristDestination.findById(touristDestinationId);

    if (!touristDestination) {
        return next(new Error(`not found tourist destination with id :${touristDestination}`,{cause:404}));
    };

    const cart =await Cart.findOne({createdBy:req.user._id});

    if (!cart) {

        const newCart= await Cart.create({
            createdBy:req.user._id,
            touristDestination:{
                touristDestinationId,
                quantity,
                unitPrice:Number(touristDestination.ticketPrice),
                finalPrice:Number(touristDestination.ticketPrice)*quantity}
        });
        return res.status(201).json({message:"Done",newCart });

    };

    if (cart.touristDestination.touristDestinationId == touristDestinationId) {
        return next(new Error(`you already reserved ${touristDestination.name} ${touristDestination.type}`,{cause:409}));
    };

    cart.touristDestination={
        touristDestinationId,
        quantity,
        unitPrice:Number(touristDestination.ticketPrice),
        finalPrice:Number(touristDestination.ticketPrice)*quantity};
    await cart.save();

    return res.status(200).json({message:"Done",cart});
})

export const deleteCart =asyncHandler(async(req,res,next)=>{

    const cart = await Cart.findOneAndDelete({createdBy:req.user._id});
    if (!cart) {
        return next(new Error(`you do not have cart`,{cause:400}));
    }
    return res.status(200).json({message:"cart is deleted"});

});

export const getCart =asyncHandler(async(req,res,next)=>{

    const cart = await Cart.findOne({createdBy:req.user._id});
    return res.status(200).json({cart});

});