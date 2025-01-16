import { asyncHandler } from "../utils/asynHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateRefreshAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //  get data from req.body
  const { fullName, userName, email, password } = req.body;

  //  validate data

  if (
    [fullName, userName, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // check if user exist or not

  const isUserExist = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (isUserExist) {
    throw new ApiError(409, "user already exist");
  }

  // check for images

  // console.log(req.files);

  let localCoverImagePathFile;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localCoverImagePathFile = req.files?.coverImage[0]?.path;
  }
    
  const localAvatarPathFile = req.files?.avatar[0]?.path;

  if (!localAvatarPathFile) {
    return new ApiError(400, "localAvatarPathFile is required");
  }

  // upload images on cloudinary
  const avatar = await uploadOnCloudinary(localAvatarPathFile);
  const coverImage = await uploadOnCloudinary(localCoverImagePathFile);
  // check for avatar
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while register the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user  created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRequestToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRequestToken) {
      throw new ApiError(401, "invalid refresh token");
    }

    const decodedToken = jwt.verify(
      incomingRequestToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRequestToken !== user?.refreshToken) {
      new ApiError(401, " refreshToken is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshTOken } =
      await generateRefreshAndAccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshTOken, options)
      .json(
        200,
        {
          accessToken,
          refreshToken: newRefreshTOken,
        },
        "access token refreshed"
      );
  } catch (error) {
    throw new ApiError(error?.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "password is not correct");
  }

  user.password = newPassword;
  await User.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfuly"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200, req.user, "current user fetched successfully"
    ));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Both fields are required");
  }
  const user = await User.findByIdAndUpdate(
    ree.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Accoount details updatd successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarPathFile = req.file?.path;

  if (!localAvatarPathFile) {
    throw new ApiError(400, "avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(localAvatarPathFile);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePathFile = req.file?.path;

  if (!localCoverImagePathFile) {
    throw new ApiError(400, "avatar file is missing");
  }

  const coverImage = await uploadOnCloudinary(localCoverImagePathFile);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading coverImage on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: coverImage.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage  updated successfully")).select("-password")

})

const getUserChannelProfile = asyncHandler(async(req, res) =>{
      const {username} = req.params;

       if(!username?.trim()){
           throw new ApiError(400, "user is missing");
       }


       const channel =   await User.aggregate([
               {
                 $match :
                 {
                     username : username?.toLowerCase()
                 }
               },
               {
                 $lookup :{
                      from  :"subscriptions",
                      localField :"_id",
                      foreignField :"channel",
                      as :"subscribers"
                 }
               },
               {
                $lookup :{
                     from  :"subscriptions",
                     localField :"_id",
                     foreignField :"subscriber",
                     as :"subscribedTo"
                }
              },
              {
                 $addFields :{
                  subscribersCount :{
                    $size : "$subscribers"
                  },
                   channelSubscribedToCount :{
                     $size : "$subscribedTo"
                   },
                   isSubscribed :{
                     $cond :{
                         if :{$in : [req.user?._id, "$subscribers.subscriber"]}
                     }
                   }
                 }
              },
               {
                $project :{
                   fullName : 1 ,
                   userName : 1 ,
                   subscribersCount : 1,
                   channelSubscribedToCount : 1,
                    isSubscribed :1 ,
                    avatar : 1,
                    coverImage : 1,
                    email : 1
                }
               }
         ])


         if (!channel?.length){
           throw new ApiError(400 , "channel doesnot  exist");
         }


         return res
               .status(200)
               .json(
                new ApiResponse(200 , channel[0], "user channel fetched successfully")
               )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};