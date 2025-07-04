import { ApiResponse } from "../utility/ApiResponse.js";
import { ApiError } from "../utility/ApiError.js";
import { asyncHandler } from "../utility/AsyncHandler.js";

import { Offer } from "../models/Offer.js";
import { Teacher } from "../models/teacher.model.js";

const createOffer = asyncHandler(async (req, res) => {
  const { fee, time, message } = req.body;
  const { reqId } = req.query;
  const { studentId } = req.query;
  const offeredBy = req.user._id;

  if ([fee, time, reqId, message].some((field) => field == "")) {
    throw new ApiError(400, "all fields are required");
  }

  const parsedTime = new Date(time);

  const createOffer = await Offer.create({
    offeredBy,
    appointmentTime: parsedTime,
    post: reqId,
    proposed_price: fee,
    message,
    offeredTo: studentId,
  });

  const teacher = await Teacher.findOne({
    userDetail: offeredBy,
  });

  const createdOffer = await Offer.findById(createOffer._id)
    .populate({
      path: "offeredBy",
      select: "fullName _id",
    })
    .populate({
      path: "offeredTo",
      select: "fullName _id",
    });
  const responseData = {
    ...createdOffer,
    offeredBy: {
      ...createOffer.offeredBy,
      rating: teacher.rating,
      experience: teacher.experience,
    },
  };
  if (!createdOffer) {
    throw new ApiError(500, "Failed to create offer");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Successfully created Offer"));
});

const fetchOffers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const isTeacher = req.user.role === "teacher";
  const query = isTeacher
    ? {
        offeredBy: userId,
      }
    : {
        offeredTo: userId,
      };

  const offers = await Offer.find(query)
    .populate("post")
    .populate("offeredBy")
    .populate("offeredTo");

  return res
    .status(200)
    .json(new ApiResponse(200, offers, "Successfully fetched Offers"));
});

export { createOffer, fetchOffers };
