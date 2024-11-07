const express = require("express")
const cookieParser = require("cookie-parser")
const userModel = require('./models/user')
const postModel = require('./models/post')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const morgan = require("morgan")
require("dotenv").config()
const crypto = require("crypto")
const app = express()
const path = require("path")
const multerconfig = require("./config/multerconfig")
const upload = require("./config/multerconfig")

app.set('view engine','ejs')
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())
app.use(express.static(path.join(__dirname,'public')))


async function isLoggedIn(req,res,next)
{
    const token = req.cookies.token
    if(token == '')
    {
        res.redirect('/login')
    }
    else
    {
        const data = jwt.verify(token,process.env.JWT_KEY)
        const user = await userModel.findOne({email : data.email,_id : data.userid})
        if(!user) return res.redirect('/login')
        req.user = data
        next()
    }
}



app.get('/',(req,res)=>{
    res.render('index')
})

app.post('/register',(req,res)=>{
    const {name,username,password,email,age} = req.body
    //checking if user exits
    const existing_user = userModel.findOne({email:email})
    if(!existing_user) return res.redirect('/login')
    //hashing password
    bcrypt.hash(password,10, async (err,hash)=>{

        if(err){
            res.status(500).send("hash error")
        }
        const newUser = await userModel.create({
            name:name,
            username:username,
            password :hash,
            email:email,
            age : age
        })
        const token = jwt.sign({email : email,userid:newUser._id},process.env.JWT_KEY)
        res.cookie('token',token)
        res.send("user registered")  
    })

})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/login',async (req,res)=>{
    const {email,password} = req.body
    const user =  await userModel.findOne({email})
    if(!user) return res.redirect("/login")
    
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result)
        {
            const token = jwt.sign({email : email,userid : user._id},process.env.JWT_KEY)
            res.cookie('token',token)
            res.redirect('/profile')
        }
        else{
            res.redirect("/login")
        }
    })
})

app.get('/logout',(req,res)=>{
    res.cookie('token','')
    res.redirect("/login")
})


app.get('/profile',isLoggedIn, async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email}).populate('posts')
    console.log(user)
    res.render('profile',{user:user})
})

app.get('/profile/upload',isLoggedIn,async (req,res)=>{
    res.render('profileupload')
})

app.post('/upload',isLoggedIn,upload.single('image'), async (req,res)=>{
    console.log(req.file)
    let user = await userModel.findOneAndUpdate({email : req.user.email,_id : req.user._id})
    user.profilepic = req.file.filename
    await user.save()
    res.redirect("/profile")

})

app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;
    let newPost = await postModel.create({
        user : user._id,
        content:content
    })
    user.posts.push(newPost._id)
    await user.save()
    res.redirect("/profile")
});


app.get('/like/:postId',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id : req.params.postId})

    if(post.likes.indexOf(req.user.userid) === -1)
    {
        post.likes.push(req.user.userid)
    }
    else
    {
        post.likes.splice(post.likes.indexOf(req.user.userid),1)
    }

    await post.save()
    res.redirect("/profile")
})

app.get('/edit/:postId',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.postId})
    res.render("edit",{post})
})

app.post('/edit/:postId',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id:req.params.postId},
        {
            $set:
            {
                content:req.body.content
            }
        }
    )
    res.redirect('/profile')

})

app.listen(3000,()=>{
    console.log("server started at http://localhost:3000")
})