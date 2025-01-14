import mongoose, { Schema } from "mongoose";

const likesSchema =new Schema({
    comment :{
        type : Schema.Types.ObjectId,
        ref : "Comments"
    },

    video :{
        type : Schema.Types.ObjectId,
        ref :"Video"
    },
    
    likedBy :{
        type : Schema.Types.ObjectId,
        ref :"User"
    },

    tweet :{
       type : Schema.Types.ObjectId,
       ref :"Tweet"
    }

})


export const likes = mongoose.model("Likes", likesSchema)