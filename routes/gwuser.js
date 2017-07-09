// Node Module dependencies
var express = require('express');
var router = express.Router();
var multer = require('multer');
var nodemailer = require('nodemailer');

// Local Module dependencies
var common = require('./common.js');

//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);
 

//-------------------------------------------Schema Definitions--------------------------------------------------
var customerSchema = common.Schema({
    user_id: { type: common.Schema.Types.ObjectId },
    first_name: String,
    last_name:String,
    username: String,
    password: String,
    id_type:String,
    id_number:String,
    mobile_number:Number,
    email:String,
    address_line_1:String,
    address_line_2:String,
    state:String,
    pincode:Number,
    user_type:String,
    profile_image: {
        type: String,
        required: true,
        trim: true
    },
    originalname: {
        type: String,
        required: true
    }
});

//auto increment for user_id
customerSchema.plugin(common.autoIncrement.plugin, {
    model: 'Customer',
    field: 'user_id',
    startAt: 1000,
    incrementBy: 1
});

//schema variable
var gwuser = common.conn.model('Customer', customerSchema);


//route variable
var gwuserroute = router.route('/register');

//Register User Post Method
gwuserroute.post(function(req,res){
    
    gwuser.find({username:req.body.username},function(err,response){
        if(err){
            throw err;
        }
        if(response.length > 0){
            res.send('Username already exists!');  
            console.log(response);
        }else {
             var newCustomer = new gwuser(req.body);
            newCustomer.save(function(err,response){
            if(err){
                return res.send(err);
            }
            return res.json({"user":response});//response.user_id.toString()
            
            });
        }
    });
});

//get particular user details
var getUserDetails = router.route('/getUser');
getUserDetails.post(function(req,res,next){ 
    gwuser.find({user_id:req.body.user_id},function(err,response){  
        if (err)
            throw err;
        res.send(response);
    })
})

//get particular user's Username
var getNameDetails = router.route('/getName');
getNameDetails.post(function(req,res,next){ 
    gwuser.find({user_id:req.body.user_id},function(err,response){  
        if (err){
           return res.send(err);
        }        
        var name = response[0].first_name+" "+response[0].last_name;
        return res.json({"name":name});
    })
})
    
//Login 
var login = router.route('/login');
login.post(function(req,res){
    gwuser.find({username: req.body.username, password: req.body.password},function(err, response){
        
        if (err)
            throw err
            
            if(response.length > 0) {
                res.json({"user":response[0]}); 
            }else {
                res.send("Login failed");
            }      
    })
    
})
    
//Forgot password
var transporter = nodemailer.createTransport({
        service : 'Gmail',
        auth : {            
            user: 'hrsh1572@gmail.com',
            pass : 'Nohint#1572'
        }
     }); 


var forgot_pwd = router.route('/forgot_password');
forgot_pwd.post(function(req,res,next){
        
   gwuser.find({username: req.body.username, email: req.body.email}, function(err, response){   
       if(err){
           return res.send('There is some problem with User Schema!');
       }      
        if(response.length > 0){
            var text = 'Your Password is ';
            var mailoptions = {
                from : "hrsh1572@gmail.com",
                to : response[0].email,
                subject : "Simple Mail",
                text : text
            }
            transporter.sendMail(mailoptions, function(error, info){
                if(error){
                    console.log(error);
                    res.json({yo: 'error'});
                }else{
                    res.json({yo: info.response});
                };
            });
            return res.send('Password has been sent!');
        }else {
            return res.send('Your Username and Email doesnot match!!');        }
   })
});

//Get Particular User Details
var getUserRoute =   router.route('/getUserDetails');
getUserRoute.post(function(req,res,next){
   gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err){
           return res.send('Some Problem with User ID!')
       }else {
           return res.json({"user":response});
       }
   }); 
});

//Get All users
var getUserRoute = router.route('/all');
getUserRoute.post(function(req,res,next){
   gwuser.find({},function(err,response){
       if(err){
           return res.send('Some Problem with User ID!');
       }else {
           return res.send(response);
       }
   }); 
});

//==============================================================================================================
//=================================Uploading Image==============================================================
//==============================================================================================================

var storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'customer_profile_images/');
 },
 filename: function(req, file, cb) {
 cb(null, file.originalname);
 }
});

var upload = multer({
 storage: storage
});

// ======== Uploading Profile Image =============

router.post('/uploadProfileImage',upload.any(),function(req,res,next){
  
    return res.send(req.files);
});

//========================================Uploading Image=====================================================
router.post('/uploadImage', upload.single('photo'), function(req, res, next) {
 
  //res.send(req.files);
/*req.files has the information regarding the file you are uploading...
from the total information, i am just using the path and the imageName to store in the mongo collection(table)
*/
 var user_id = req.body.user_id;
 var path = req.file.path;
 var imageName = req.file.originalname;
 
 var imagepath = {};
 imagepath['profile_image'] = path;
 imagepath['originalname'] = imageName;
 imagepath['user_id'] = user_id;
    
 //imagepath contains three objects, path and the imageName, user_id
 
    // Check already image is set for user
    gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err){
           return res.send(err);
       } 
        if(response.length > 0){
           gwuser.findOneAndUpdate({user_id:req.body.user_id},{ $set: {profile_image:path, origionalname: imageName}}, function(err,updatedResponse){
               if(err){
                return res.send(err);
                }              
                return res.send('Added!');
           });
        }
        else
            {
                return res.send('Cannot set!');
            }
    });
});

//=======================================Get Image============================================================
router.post('/getProfileImage',function(req,res,next){
    gwuser.find({user_id:req.body.user_id},function(err,images){
       if(err) return res.send('Problem with Customer Image schema');
        if(images.length > 0){
            return res.send(images[0].profile_image);    
        }else {
            return res.send('Profile Image is not set!');
        }
    });
});

module.exports = router;
//set gwuser variable as global
module.exports.gwuserSchema = customerSchema;