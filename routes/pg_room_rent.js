// Node Module dependencies
var express = require('express');
var router = express.Router();
var fs = require('fs');
var nodemailer = require('nodemailer');

// Local Module dependencies
var common = require('./common.js');
var gwuserjs = require('./gwuser.js');
var pgjs = require('./pg.js');
var userRequest = require('request');
var series = require('async-series');

//for auto incremanting primary key
//common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var pgRoomRentSchema = common.Schema({
    pg_id: {type: Number},
    sharing: {type: Number},
    room_rent: Number
});


//set composite key
pgRoomRentSchema.index({pg_id: 1, sharing: 1},{unique:true});
 

//schema variable
var pgRoomRent = common.conn.model('PG_Room_Rent', pgRoomRentSchema);
var gwuser = common.conn.model('Customer', gwuserjs.gwuserSchema);
var pgSchema = common.conn.model('PG',pgjs.pgSchema);
var pgRoomSchema = common.conn.model('PG_Room');
var pgRoomDetails = common.conn.model('PG_Room_Details');

//Set rent information into Schema
var setRentRoute = router.route('/setRent');
setRentRoute.post(function(req,res,next){
    pgSchema.find({pg_id:req.body.pg_id},function(err,response){
        if(err){
            return res.send('Some Problem with PG Database!');
        }
        if(response.length > 0){
            //Check whether already rent is set for the particular sharing like 2 sharing, 3 sharing
            //If yes, just update the schema
            
            pgRoomRent.find({pg_id:req.body.pg_id,sharing:req.body.sharing},function(err,response){
                if(err){
                    return res.send('Some Problem with PG Rent Schema!');
                }
                if(response.length > 0){
                    //Update the exising row
                    pgRoomRent.findOneAndUpdate({pg_id:req.body.pg_id,sharing:req.body.sharing},{$set: { room_rent:req.body.room_rent}},function(err,response){
                        if(err){
                            return res.send('Cannot update the Information!Problem with Rent Schema!');
                        }else {
                            return res.send('Updated Sucessfully!');
                        }
                    });
                }
                else{
                    var rentInfo = new pgRoomRent(req.body);
                    rentInfo.save(function(err,response){
                        if(err){
                            return res.send('Cannot save the Information!Problem with Rent Schema!');
                        }else {
                            return res.send('Saved Sucessfully!') ;
                        } 
                    });
                }
            });
            
        }else{
            return res.send('There is no PG present with that Id!');
        }
    });
});

////=========================================================================================================
////---------------------------------------------------------------------------------------------------------
////========================== Get Rent information of Given PG =============================================

var getRentRoute = router.route('/getRent');
getRentRoute.post(function(req,res,next){
     pgRoomRent.find({pg_id:req.body.pg_id},function(err,response){
                if(err){
                    return res.send('Rent Information is not available!');
                }
         return res.json({"rentInformation":response});
     });
});
         
////=========================================================================================================
////---------------------------------------------------------------------------------------------------------
////========================== Get Total Rent and Other details =============================================

var getRentDetailsRoute = router.route('/getRentInformation');
getRentDetailsRoute.post(function(req,res,next){
     //Define all local variables
    // var users = [];
    var userSharing = [];
  
    //All Room Rent
    var oneSharingRoomRent = 0;
    var twoSharingRoomRent = 0;
    var threeSharingRoomRent = 0;
    var fourSharingRoomRent = 0;
                   
    var totalRent = 0;
    var collectedCurrentRent = 0;
    var collectedPreviousRent = 0;
    
    pgSchema.find({pg_id:req.body.pg_id},function(err,response){
       if(err){
           return res.send(err)
       } 
       if(response.length > 0){
           pgRoomRent.find({pg_id:req.body.pg_id},function(err,rentArray){
               if(err){
                   return res.send(err);
               }
               if(rentArray.length > 0){ 
                           for(i = 0;i < rentArray.length;i++){
                               if(rentArray[i].sharing == 1) {
                                   oneSharingRoomRent = rentArray[i].room_rent;
                               }else if(rentArray[i].sharing == 2) {
                                   twoSharingRoomRent = rentArray[i].room_rent;
                               }else if(rentArray[i].sharing == 3) {
                                   threeSharingRoomRent = rentArray[i].room_rent;
                               }else if(rentArray[i].sharing == 4) {
                                   fourSharingRoomRent = rentArray[i].room_rent;
                               } 
                           }
    
                   //Get all the customers for that pg
                    pgRoomDetails.find({pg_id:req.body.pg_id},function(err,users){
                        if(err){
                            return res.send(err);
                        }
                        if(users.length > 0){
                                var userTasks = 0;
                                users.forEach(function(user){
                                    pgRoomSchema.findOne({pg_id:user.pg_id,room_id:user.room_id},function(err,roomDetail){
                                        if(err){
                                            return res.send(err);
                                        }
                                        if(roomDetail.sharing == 1){
                                            totalRent += oneSharingRoomRent;
                                                if(user.current_month_status == true) {
                                                    collectedCurrentRent += oneSharingRoomRent;
                                                }
                                                if(user.previous_month_status == true) {
                                                    collectedPreviousRent += oneSharingRoomRent; 
                                                }
                                        }else if(roomDetail.sharing == 2){
                                            totalRent += twoSharingRoomRent;
                                                if(user.current_month_status == true) {
                                                    collectedCurrentRent += twoSharingRoomRent;
                                                }
                                                if(user.previous_month_status == true ) {
                                                    collectedPreviousRent += twoSharingRoomRent;
                                                }
                                        }else if(roomDetail.sharing == 3){
                                            totalRent += threeSharingRoomRent;
                                            
                                                if(user.current_month_status == true) {
                                                    collectedCurrentRent += threeSharingRoomRent;
                                                }
                                                if(user.previous_month_status == true) {
                                                    collectedPreviousRent += threeSharingRoomRent;
                                                }
                                        }else {
                                            totalRent += fourSharingRoomRent;
                                            
                                                if(user.current_month_status == true) {
                                                    collectedCurrentRent += fourSharingRoomRent;
                                                }
                                                if(user.previous_month_status == true) {
                                                    collectedPreviousRent += fourSharingRoomRent;
                                                }
                                        }
                                        userSharing.push(roomDetail.sharing);  
                                       
                                        userTasks += 1;
                                        if(userTasks == users.length){
                                            return res.json({"total_Rent":totalRent.toString(),"collected_Current_Month":collectedCurrentRent.toString(), "collected_Previous_Month":collectedPreviousRent.toString(),
                                                            "user_Sharing":userSharing,"user_List":users});    
                                        }
                                    });
                                });
                              
                        }else {
                            return res.send('Users are not present in this PG!');
                        }
                        
                    });
               }else {
                   return res.send('Rent Information for the PG is not available!');
               }
           });
          
        }else{
           return res.send('There is no PG present with that Id!');
       }
    });
});


module.exports = router;