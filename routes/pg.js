// Node Module dependencies
var express = require('express');
var router = express.Router();
var multer = require('multer');
var nodemailer = require('nodemailer');

// Locak Module Dependencies
// Local Module dependencies
var common = require('./common.js');
var gwuserjs = require('./gwuser.js');

//global counter for pg id
var pgcounter = 1100;

//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var pgSchema = common.Schema({
    pg_id: {type: Number},
    user_id: { type: Number, ref:'Customer' },
    pg_name: String,
    pg_type:String,
    longitude: Number,
    lattitude: Number, 
    pg_profile_image: {
        type: String,
//        required: true,
        trim: true
    },
    originalname: {
        type: String,
//        required: true
    }
});

//auto increment for pg_id
//pgSchema.plugin(common.autoIncrement.plugin, {
//    model: 'PG',
//    field: 'pg_id',
//    startAt: 1000,
//    incrementBy: 1
//});
        
//composite key
pgSchema.index({pg_id: 1,user_id: 1, pg_name: 1},{ unique: true});

//schema variable
var pg = common.conn.model('PG', pgSchema);
var gwuser = common.conn.model('Customer', gwuserjs.gwuserSchema);

//configure pg route
var configurePg = router.route('/config');

//Configure Post Method
configurePg.post(function(req,res){
    
    gwuser.find({user_id:req.body.user_id},function(err,response){
        if(err) {
            throw err;
        }
        if(response.length > 0){
            pg.find({user_id:req.body.user_id,pg_name:req.body.pg_name,pg_type:req.body.pg_type},function(err,response){
            if(err){
                return res.send('Problem with PG schema!');
            }
            if(response.length > 0){
               return res.send('Same PG Name is already registered in your Account!');  
                console.log(response);
            }else {
                pgcounter += 1;
                    var newPg = new pg({pg_id:pgcounter,pg_name:req.body.pg_name,pg_type:req.body.pg_type,user_id:req.body.user_id,longitude:req.body.longitude,lattitude:req.body.lattitude,pg_profile_pic:req.body.pg_profile_pic,originalname:req.body.originalname});
                newPg.save(function(err,response){
                if(err){
                    return res.send(err);
                }                
                return res.send("Registered");                
            //res.json({ message: 'User added to the GW!', data: response });
            });
            }
            });
        }else {
            return res.send('Sorry! You are not a valid user to perform this!');
            console.log(response);                    
        }
    });
 
});

//Get PG list
//get all pg details
var getAllPgDetails = router.route('/all');
getAllPgDetails.get(function(req,res){
    
    pg.find({},function(err,response){
        
        if (err)
            throw err;
        res.send(response);
    })
})

//Configure Post Method
configurePg.post(function(req,res){
    
    gwuser.find({user_id:req.body.user_id},function(err,response){
        if(err) {
            throw err;
        }
        if(response.length > 0){
            pg.find({user_id:req.body.user_id,pg_name:req.body.pg_name,pg_type:req.body.pg_type},function(err,response){
            if(err){
                throw err;
            }
            if(response.length > 0){
                res.send('Same PG Name is already registered in your Account!');  
                console.log(response);
            }else {
                var newPG = new pg(req.body);
                newPG.save(function(err,response){
                if(err){
                    res.send(err);
                }                
                res.send("Registered");                
            //res.json({ message: 'User added to the GW!', data: response });
            });
            }
            });
        }else {
            res.send('Sorry! You are not a valid user to perform this!');
            console.log(response);                    
        }
    });
 
});
//=========================================================================================================
//================================Return New PG_ID=========================================================
//=========================================================================================================
var returnNewPgidRoute = router.route('/newPgid');
returnNewPgidRoute.post(function(req,res,next){
    pg.find({pg_name:req.body.pg_name,user_id:req.body.user_id},function(err,response){
        if(err){
            return res.send('Problem with PG Schema!');
        }
        if(response.length > 0){
            return res.send(response[0].pg_id.toString());
        }else {
            return res.send('There is no such PG associated with the User!');
        }
    });
});

//=========================================================================================================
//================================List PGs and send with USER ID===========================================
//=========================================================================================================
var listPGRoute = router.route('/getpgs');
listPGRoute.post(function(req,res,next){
   pg.find({user_id:req.body.user_id},function(err,response){
       if(err) {
           return res.send('Problem with PG Schema!');
       }
       if(response.length > 0) {
           return res.json({"pgs":response});
       }else {
           return res.send('There is no PG Associated with given PG_Id');
       }
   });
});


//=========================================================================================================
//================================Insert new PG ===========================================================
//=========================================================================================================
var insertPGRoute = router.route('/insertpg');
insertPGRoute.post(function(req,res,next){
    gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err){
           return res.send('Problem with User Schema');
       }
        if(response.length > 0){
            pg.find({user_id:req.body.user_id,pg_name:req.body.pg_name},function(err,response){
               if(err){
                   return res.send('Problem with PG Schema');
               }
                if(response.length > 0){
                    return res.send('PG Name already exists!');
                }else {
                    pgcounter += 1;
                    var newPg = new pg({pg_id:pgcounter,pg_name:req.body.pg_name,pg_type:req.body.pg_type,user_id:req.body.user_id,longitude:req.body.longitude,lattitude:req.body.lattitude,pg_profile_pic:req.body.pg_profile_pic,originalname:req.body.originalname});
                    newPg.save(function(err,response){
                       if(err){
                           console.log(err);
                           return res.send('There is some problem while saving!');
                       } 
                       return res.json({"pg":response});
                    });
                }
            });
        }else {
            return res.send('There is no user with that ID!');
        }
    });
});


//=========================================================================================================
//================================Delete PG with pg name and USER id=======================================
//=========================================================================================================
var deletePGRoute = router.route('/deletepg');
deletePGRoute.post(function(req,res,next){
   pg.remove({user_id:req.body.user_id,pg_name:req.body.pg_name,pg_type:req.body.pg_type},function(err,response){
      if(err){
          return res.send('There is some problem with Your data!');
      } 
      res.send('Removed Sucessfully!');
   }); 
});



//=========================================================================================================
//================================Get details of particular PG=============================================
//=========================================================================================================
var sendPGDetails = router.route('/getpg');
sendPGDetails.post(function(req,res,next){
   pg.find({pg_id:req.body.pg_id},function(err,response){
       if(err) {
           return res.send('Problem with PG Schema!');
       }
       if(response.length > 0) {
           return res.json({"pg":response[0]});
       }else {
           return res.send('There is no PG Associated with given PG_Id');
       }
   });
});

//==============================================================================================================
//=================================Uploading Image==============================================================
//==============================================================================================================

// To get more info about 'multer'.. you can go through https://www.npmjs.com/package/multer..
var storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'pg_profile_images/');
 },
 filename: function(req, file, cb) {
 cb(null, file.originalname);
 }
});

var upload = multer({
 storage: storage
});

//========================================Uploading Image Route=====================================================
router.post('/uploadImage', upload.single('photo'), function(req, res, next) {
 
  //res.send(req.files);
/*req.files has the information regarding the file you are uploading...
from the total information, i am just using the path and the imageName to store in the mongo collection(table)
*/
 var pg_id = req.body.pg_id;  
 var path = req.file.path;
 var imageName = req.file.originalname;

    // Check already image is set for user
    pg.find({pg_id:req.body.pg_id},function(err,response){
       if(err){
           return res.send(err);
       } 
        if(response.length > 0){
            pg.findOneAndUpdate({pg_id:req.body.pg_id},{ $set: {pg_profile_image:path, originalname: imageName}}, function(err,updatedResponse){
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
    pg.find({pg_id:req.body.pg_id},function(err,images){
       if(err) return res.send('Problem with Customer Image schema');
        if(images.length > 0){
            return res.send(images[0].pg_profile_image);
        }else {
            return res.send('Profile Image is not set!');
        }
    });
});


module.exports = router;
//set pg variable as global
module.exports.pgSchema = pgSchema;