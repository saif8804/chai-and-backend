import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (!isValidObjectId(userId)) {
    throw new ApiErrorError(400, "Invalid userId");
  }

  if (!(query, sortBy, sortType)) {
    throw new ApiError(401, "all fields are required");
  }

  const userExist = await User.findById(userId);
  if (!userExist) {
    throw new ApiError(404, "user not found");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  let sortOptions = {};

  if (sortBy) {
    sortOptions[sortBy] = sortType = "desc" ? -1 : 1;
  }

  const videoAggregationPipeline = Video.aggregate([
    {
      $match: {
        $and: [
          {
            owner: new mongoose.Types.ObjectId(userId),
          },
          {
            title: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      },
    },
    {
      $sort: sortOptions,
    },
  ]);

  const resultVideo = await Video.aggregatePaginate(
    videoAggregationPipeline,
    options
  );

  if (resultVideo.totalDocs === 0) {
    return res.status(400).json(400, "video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, resultVideo, "video fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (![title, description].every(Boolean)) {
    throw new ApiError(401, "Both title and description fields are required");
  }

  const videoFile = req.files?.videoFile?.[0];
  const thumbnailFile = req.files?.thumbnails?.[0];
  console.log(videoFile, thumbnailFile, "thumn, djkhdk");

  if (!videoFile || !thumbnailFile) {
    throw new ApiError(400, "Both video file and thumbnail are required");
  }

  const videoCloudinary = await uploadOnCloudinary(videoFile.path);
  if (!videoCloudinary) {
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }

  const thumbnailCloudinary = await uploadOnCloudinary(thumbnailFile.path);
  if (!thumbnailCloudinary) {
    throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoCloudinary.url, 
    thumbnails: thumbnailCloudinary.url,
    owner: req.user._id,
    duration: 0, 
    views: 0, 
    isPublished: false,
  });

  if (!video) {
    throw new ApiError(500, "Error while creating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video created successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};


