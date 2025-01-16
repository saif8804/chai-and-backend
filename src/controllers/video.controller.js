import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // check userId is Valid or not
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

  // create sort options
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
  // TODO: get video, upload to cloudinary, create video
  if ([title, description].some((field) => field?.trim === "")) {
    throw new ApiError(401, "both fields are required");
  }


  // validate video and thumbnail file presence

  const videoLocalPath = req.files?.videoFile?.[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "videoLocalPath is required");
  }
  const thumbnailPath = req.files?.thumbnails?.[0]?.path;
  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail path is required");
  }

  // upload video and thumbnail on cloudinary

  const videoCloudinay = await uploadOnCloudinary(videoLocalPath);
  if (!videoCloudinay) {
    throw new ApiError(500, "failed to upload video on cloudinary");
  }

  const thumbnailCloudinary = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnailCloudinary) {
    throw new ApiError(500, "failed to upload thumbnail on cloudinary");
  }

  // save video details in database

  const video = await Video.create({
    title,
    description,
    videoCloudinay: videoCloudinay.url,
    thumbnail: thumbnailCloudinary.url,
    owner: req.user._id,
    duration: filePath.duration || 0,
    views: filePath.views || 0,
    isPublished: false,
  });

  if (!video) {
    throw new ApiError(500, "error while creating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200,  video, "video created successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
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
