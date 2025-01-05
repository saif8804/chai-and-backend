import { asyncHandler } from "../utils/asynHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

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
    // check email and password
    // match them  from database if match then login 
    // access and refreshToken
    //send cookies
    // res 

})
export { registerUser, loginUser };
