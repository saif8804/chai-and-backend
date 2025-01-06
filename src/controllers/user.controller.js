import { asyncHandler } from "../utils/asynHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose  from "mongoose";




const generateRefreshAndAccessToken = async(userId) =>
  {
    try {
       const user = User.findById(userId);
         const accessToken = generateAccessToken();
          const refreshToken = generateRefreshToken() 
  
          user.refreshToken = refreshToken;
  
          await user.save({ validateBeforeSave: false })
          return {accessToken, refreshToken}
    } catch (error) {
      throw new ApiError(500, "Something went wrong while generating referesh and access token")

    }
  }


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
  const localAvatarPathFile = req.files?.avatar[0]?.path;
  //  const localCoverImagePathFile = req.files?.coverImage[0]?.path;
  let localCoverImagePathFile;

  if (
    req.files &&  Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localCoverImagePathFile = req.files?.coverImage[0]?.path;
  }

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
    avatar: avatar.url,
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

const loginUser = asyncHandler(async(req, res) =>{
    // get email and password from req.body
       const {userName ,email, password} = req.body;
    // check email and password
      
    if (!(userName || email)){
      throw new ApiError(400,
       "userName and fullName is required"
      )
   }

   const user = User.findOne({
      $or :[{ userName }, { email }]
   })

   if(!user){
      throw new ApiError(404, "user doesn't exist");
   }

   const isPasswordValid = await user.isPasswordCorrect
        (password)

   if(!isPasswordValid){
         throw new ApiError(401,
          "password is not valid"
         )
   }
    // access and refreshToken
     const {accessToken, refreshToken} =  await generateRefreshAndAccessToken(user._id);

     const loggedInUser = User.findById(user._id).
     select("-password -refreshToken")


     const options = {
        httpOnly : true,
        secure : true
     }

    //send cookies
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken" ,refreshToken, options)
      .json(200 , {
            user :  loggedInUser , accessToken , refreshToken
      }, 
       "user loggedIn successfully"
    )
    
})

const logoutUser = asyncHandler(async(req, res) =>{
     await User.findByIdAndUpdate(
        req.user._id, 
        {
          $set :{
                  refreshToken : undefined
                }
        },
        {
          new : true
        }
     )
     const options = {
      httpOnly : true,
      secure : true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse, {} ,"user loggedout")
})



export { registerUser, loginUser, logoutUser };