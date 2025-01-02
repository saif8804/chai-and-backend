import {v2 as cloudinary} from "cloudinary";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET_KEY // Click 'View API Keys' above to copy your API secret
}); 



const uploadOnCloudinary = async (localPathFile) =>{
      
    try {
         if(!localPathFile) return null
         // upload the file on cloudinary
           const response  = await cloudinary.uploader.upload(localPathFile,{
             resource_type :"auto"
          })

          // file has been successfully uploaded
          console.log("file is uploaded on cloudinary", response.url )
    } catch (error) {
        fs.unlinkSync(localPathFile) // remove the locally saved temporary file as upload
        return null
    }
}


export {uploadOnCloudinary}