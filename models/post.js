const mongoose = require('mongoose')


const postSchema = mongoose.Schema(
    {
        user : mongoose.Schema.Types.ObjectId,
        date : {
            type : Date,
            default : Date.now
        },
        content : String,
        likes : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'user'
            }
        ]
    }
)

const post = mongoose.model('post',postSchema)

module.exports = post 