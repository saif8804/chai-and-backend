import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if (!isValidObjectId(userId)) {
    throw new Error(400, "Invalid userId");
  }

  if (!(query, sortBy, sortType)) {
    throw new Error(401, "all fields are required");
  }

  const userExist = await User.findById(userId);
  if (!userExist) {
    throw new Error(404, "user not found");
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
  )

     if(resultVideo.totalDocs === 0){
         return res.status(400).json(400, "video not found")
     }

     return res.status(200).json(200, resultVideo, "video fetched successfully")
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
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
