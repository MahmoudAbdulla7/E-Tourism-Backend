import { nanoid } from "nanoid";
import City from "../../../../DB/model/City.model.js";
import TouristDestination from "../../../../DB/model/TouristDestination.model.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";

export const createTouristDestination = asyncHandler(async (req, res, next) => {
  
  const name = req.body.name.toLowerCase();
  const { cityId } = req.params;
  const city = await City.findById(cityId);

  if (!city) {
    return next(new Error("in-valid city id", { cause: 404 }));
  };

  if (await TouristDestination.findOne({ name })) {
    return next(
      new Error(`Duplicated Tourist Destination name :${name}`, { cause: 409 })
    );
  };

  const customId =nanoid();
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.image[0]?.path,
    { folder: `${process.env.APP_NAME}/cities/${city.customId}/${customId}/image/` }
  );
  req.body.image = { secure_url, public_id };

  if (req.files.subImages) {
    req.body.subImages = [];
    for (const file of req.files.subImages) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        { folder: `${process.env.APP_NAME}/cities/${city.customId}/${customId}/subImages/` }
      );
      req.body.subImages.push({ secure_url, public_id });
    };
  };

  req.body.customId=customId;
  req.body.createdBy = req.user._id;
  req.body.cityId = cityId;
  const touristDestination = await TouristDestination.create({
    ...req.body,
  });
  return res.status(201).json({ message: "Done", touristDestination });
});

export const updateTouristDestination = asyncHandler(async (req, res, next) => {

  const city = await City.findById(req.params.cityId);
  const touristDestination = await TouristDestination.findOne({
    _id: req.params.touristDestinationId,
    cityId: req.params.cityId,
  });

  if (!touristDestination) {
    return next(new Error("in-valid cityId or touristDestinationId",{cause:400}));
  };

  if (req.body.name) {
    const name = req.body.name.toLowerCase();

    if (touristDestination.name == name) {
      return next(
        new Error(
          `sorry can not update touristDestination with the same name`,
          { cause: 409 }
        )
      );
    }

    if (await TouristDestination.findOne({ name })) {
      next(
        new Error(`Duplicated touristDestination name:${req.body.name}`, {
          cause: 409,
        })
      );
    }

    req.body.name = name;
  };

  if (req.files) {

    if (req.files.image) {

      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.image[0]?.path,
        {
          folder: `${process.env.APP_NAME}/cities/${city.customId}/${touristDestination.customId}/image/`,
        }
      );

      await cloudinary.uploader.destroy(touristDestination.image.public_id);
      req.body.image = { secure_url, public_id };

    };

    if (req.files.subImages) {
      req.body.subImages = [];

      for (const file of req.files.subImages) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: `${process.env.APP_NAME}/cities/${city.customId}/${touristDestination.customId}/subImages`,
          }
        );

        req.body.subImages.push({ secure_url, public_id });
      };

      for (const file of touristDestination.subImages) {
        await cloudinary.uploader.destroy(file.public_id);
      };

    };

  };

  if (req.body.cityId) {
    const checkCityExist= await City.findById(req.body.cityId);

    if (!checkCityExist) {
        return next(new Error("in-valid city id",{cause:404}));
    };

  };

  req.body.updatedBy=req.user._id;

  const newTouristDestination = await TouristDestination.findByIdAndUpdate(
req.params.touristDestinationId,
    {...req.body},
    {new:true}
);

  return res.status(200).json({ message: "Done", newTouristDestination });
});

export const getTouristDestinationsByCityId = asyncHandler(async(req,res,next)=>{

  const city =await City.findById(req.params.cityId);
  if (!city) {
    return next(new Error(`city not found with id :${req.params.cityId}`, { cause: 404 }));
  };

   const touristDestinations = await TouristDestination.find({cityId:req.params.cityId})
   .populate([{
    path:'cityId',
    select:"name image"
   }]);
   
    return res.status(200).json({touristDestinations});
});

export const getTouristDestinationById = asyncHandler(async(req,res,next)=>{

   const touristDestination= await TouristDestination.findById(req.params.destinationId)
   .populate([{
    path:'cityId',
    select:"name image"
   }]);

   if (!touristDestination) {
    return next(new Error(`touristDestination not found with id:${req.params.touristDestinationId}`, { cause: 404 }));
};
   
    return res.status(200).json({touristDestination});
});

export async function deleteResources(folderPath) {
  const { resources } = await cloudinary.api.resources({
    type: 'upload',
    prefix: folderPath,
    max_results: 500
});

for (const resource of resources) {
    await cloudinary.api.delete_resources(resource.public_id);
};

await cloudinary.api.delete_folder(folderPath);
  
};

export const deleteTouristDestination = asyncHandler(async(req,res,next)=>{

  const touristDestination =await TouristDestination.findByIdAndDelete(req.params.touristDestinationId);

  if (!touristDestination) {
      return next(new Error(`touristDestination not found with id:${req.params.touristDestinationId}`, { cause: 404 }));
  };

  const city =await City.findByIdAndDelete(req.params.cityId);
  if (!city) {
      return next(new Error(`city not found with id:${req.params.cityId}`, { cause: 404 }));
  };
  
  try {
      const folderPath = `${process.env.APP_NAME}/cities/${city.customId}/${touristDestination.customId}/`;
  
      await deleteResources(folderPath);
      await touristDestination.remove();
      return res.status(200).json({ message: "touristDestination and associated resources deleted successfully" });
  } 

  catch (error) {
      return next(new Error('Failed to delete city and associated resources', { cause: 500 }));
  };

});