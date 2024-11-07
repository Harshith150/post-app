const mongoose = require('mongoose')

mongoose.connect("mongodb://localhost:27017/post-app")

const userSchema = mongoose.Schema(
    {
        name : String,
        username : String,
        age : Number,
        email : String,
        password : String,
        posts : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'post'
            }
        ],
        profilepic:{
            type : String,
            default : "default.jpg"
        }
    }
)

const model = mongoose.model('user',userSchema)

module.exports = model 