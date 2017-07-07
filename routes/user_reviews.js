// Node Module dependencies
var express = require('express');
var router = express.Router();
var fs = require('fs');
var nodemailer = require('nodemailer');

// Local Module dependencies
var common = require('./common.js');

//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var userReviewSchema = common.Schema({
    user_id: {type: Number, ref:'Customer'},
    review_id: {type: common.Schema.Types.ObjectId},
    review_title: String,
    review_description: String,
    room_rent: Number
});

//auto increment for user_id
userReviewSchema.plugin(common.autoIncrement.plugin, {
    model: 'user_Reviews',
    field: 'review_id',
    startAt: 1000,
    incrementBy: 1
});

//schema variable
var userReviews = common.conn.model('User_Reviews', userReviewSchema);
var pgInfo = common.conn.model('PG_Info');
var pgSchema = common.conn.model('PG');
var pgReviews = common.conn.model('PG_Reviews');
var pgRooms = common.conn.model('PG_Room');
var gwuser = common.conn.model('Customer');
var pgRoomRent = common.conn.model('PG_Room_Rent');
var pgRoomDetails = common.conn.model('PG_Room_Details');


//==================================================================================================================
//================================Add User Review=====================================================================
//==================================================================================================================
var addUserReviewRoute = router.route('/addReview');
addUserReviewRoute.post(function(req,res,next){
   gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err){
           return res.send('Problem with User Reviews Schema');
       }
       if(response.length > 0) {
           userReviews.find({user_id:req.body.user_id},function(err,response){
               if(err){
                   return res.send(err);
               }
               if(response.length > 0){
                           userReviews.update({user_id:req.body.user_id},{$set: {review_title:req.body.review_title, review_description:req.body.review_description,rating:req.body.rating}});
                           return res.send('Updated Sucessfully!');
                       }else{
                            var newReview = new userReviews(req.body);
                            newReview.save(function(err,response){
                            if(err)
                                return res.send('There is some problem with Reviews Schema!');
                            return res.send('Review Added Sucessfully!'); 
                    });
                       }
           });
       }else {
           return res.send('User ID is not present!');
       }
   });
});


//==================================================================================================================
//================================Delete the User from Database========================================================
//==================================================================================================================
var deleteUserRoute = router.route('/deleteUser');
deleteUserRoute.post(function(req,res,next){
    
    pgSchema.find({user_id:req.body.user_id},function(err,response){
         if(err){
               return res.send(err);
         }
        if(response.length > 0){
            response.forEach(function(pg){
               // Delete from PG
               pgSchema.remove({pg_id:pg.pg_id},function(err,ress){
                  if(err){
                    return res.send(err);
                    } 
                   // Delete from PG_Room
                   pgRooms.remove({pg_id:pg.pg_id},function(err,ress){
                       if(err){
                            return res.send(err);
                       } 
                       // Delete from PG_Room_Information
                       pgInfo.remove({pg_id:pg.pg_id},function(err,ress){
                           if(err){
                            return res.send(err);
                            } 
                           // Delete from PG_Room_Details
                            pgRoomDetails.remove({pg_id:pg.pg_id},function(err,ress){
                                if(err){
                                    return res.send(err);
                                }
                                 // Delete from PG_Room_Rent
                                pgRoomRent.remove({pg_id:pg.pg_id},function(err,ress){
                                    if(err){
                                        return res.send(err);
                                    }
                                    // Delete from PG_Reviews
                                    pgReviews.remove({pg_id:pg.pg_id},function(err,ress){
                                         if(err){
                                            return res.send(err);
                                        }
                                        // Delete from Customers
                                        gwuser.remove({user_id:req.body.user_id},function(err,ress){
                                             if(err){
                                                 return res.send(err);
                                             }
                                            return res.send('User deleted Successfully!');
                                        });              
                                    }); 
                                });    
                            });   
                       });    
                   });   
                }); 
            });
            
        }
        else{
            pgRoomDetails.find({user_id:req.body.user_id},function(err,result){
                if(err){
                    return res.send(err);
                }
                if(result.length > 0){
                    return res.send('Cannot delete User! He is still in PG!');
                }else{
                    // Delete from Customers
                gwuser.remove({user_id:req.body.user_id},function(err,ress){
                    if(err){
                        return res.send(err);
                    }                    
                    return res.send('User deleted Successfully!');  
                });                 
                }
            });              
        }
    });
});

module.exports = router;