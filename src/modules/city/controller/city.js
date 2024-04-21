import cloudinary from "../../../utils/cloudinary.js";
import City from '../../../../DB/model/City.model.js'
import slugify from "slugify";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { nanoid } from "nanoid";
import TouristDestination from "../../../../DB/model/TouristDestination.model.js";

export const createCity =asyncHandler(async(req,res,next)=>{

    const name=req.body.name.toLowerCase();

    if (await City.findOne({name})) {
        next(new Error(`Duplicated City name :${name}`,{cause:409}));
    };
    const customId=nanoid();
    const {secure_url,public_id}= await cloudinary.uploader.upload(req.file.path,{folder:`${process.env.APP_NAME}/cities/${customId}`});
    const city = await City.create({name,customId, image:{secure_url,public_id},slug:slugify(name,'-'),createdBy:req.user._id});

    return res.status(201).json({message:"City is created successfully"});
});

export const updateCity =asyncHandler(async(req,res,next)=>{

    const city =await City.findById(req.params.cityId);
    if (!city) {
        return next(new Error(`city not found with id:${req.params.cityId}`,{cause:404}));
    };

    if(req.body.name?.toLowerCase()){
        const name=req.body.name.toLowerCase();

        if (city.name==name) {
            return next(new Error(`sorry can not update city with the same name`,{cause:409}));
        };
        if (await City.findOne({name})) {
            next(new Error(`Duplicated city name:${name}`,{cause:409}));
        };

        city.name=name;
        city.slug=slugify(name);
    };

    if (req.file) {
        const {secure_url,public_id}= await cloudinary.uploader.upload(req.file.path,{folder:`${process.env.APP_NAME}/cities`});
        await cloudinary.uploader.destroy(city.image.public_id);
        city.image ={secure_url,public_id};
    }    
    city.updatedBy=req.user._id;
    await city.save();
    return res.status(201).json({message:"City is updated successfully"});
});

export const getCities =asyncHandler(async(req,res,next)=>{

    const cities= await City.find({}).populate([{path:"destination"}]);

    return res.status(200).json({cities});

});

export const getCityById =asyncHandler(async(req,res,next)=>{

    const city= await City.findById(req.params.cityId).populate([{path:"destination"}]);

    if (!city) {
        return next(new Error("in-valid city Id",{cause:400}));
    };
    return res.status(200).json({city});

});

export const deleteCity = asyncHandler(async(req,res,next)=>{

    const city =await City.findByIdAndDelete(req.params.cityId);

    if (!city) {
        return next(new Error(`City not found with id:${req.params.cityId}`, { cause: 404 }));
    };

    await TouristDestination.deleteMany({cityId:req.params.cityId});
    const folderPath = `${process.env.APP_NAME}/cities/${city.customId}`;

    try {
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            prefix: folderPath,
            max_results: 500
        });

        for (const resource of resources) {
            await cloudinary.api.delete_resources(resource.public_id);
        };

        await cloudinary.api.delete_folder(folderPath);
        await city.remove();

        return res.status(200).json({ message: "City and associated resources deleted successfully" });
    } catch (error) {
        return next(new Error('Failed to delete city and associated resources', { cause: 500 }));
    }
});