// Node Module dependencies
var express = require('express');
var router = express.Router();
//var fs = require('fs');
var nodemailer = require('nodemailer');

// Local Module dependencies
var common = require('./common.js');
var gwuserjs = require('./gwuser.js');
var pgjs = require('./pg.js');
var pgroomjs = require('./pg_room.js');

//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var pgRoomDetailsSchema = common.Schema({
    pg_id: {type: Number},
    user_id: {type: Number},
    room_id: {type: Number},
    current_month_status: Boolean,
    previous_month_status: Boolean
});

//set composite key
pgRoomDetailsSchema.index({pg_id: 1, user_id: 1, room_id: 1}, {unique: true});
 
//schema variable
var pgRoomDetails = common.conn.model('PG_Room_Details', pgRoomDetailsSchema);
var gwuser = common.conn.model('Customer', gwuserjs.gwuserSchema);
var pgSchema = common.conn.model('PG', pgjs.pgSchema);
var pgRoomSchema = common.conn.model('PG_Room'); 

//Add customer to room
var addCustomerRoute = router.route('/addCustomer');
addCustomerRoute.post(function (req,res,next) {
    gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err) {
           throw err;
       }  
        if(response.length > 0) {
            
            pgRoomDetails.find({user_id:req.body.user_id},function(err,response){
               if(err){
                   throw err;
               } 
                if(response.length > 0) {
                    res.send('User is already located!')                    
                    }
                else { 
                    pgRoomDetails.find({pg_id:req.body.pg_id,room_id:req.body.room_id},function(err,roomDetailsResponse){
                        if(err){
                            return res.send('Problem with Room Details schema!'); 
                        }
                        pgRoomSchema.find({pg_id:req.body.pg_id,room_id:req.body.room_id},function(err,response){
                            if(roomDetailsResponse.length < response[0].sharing){
                                 var newRoomCustomer = new pgRoomDetails(req.body);
                                newRoomCustomer.save(function(err,response){
                                    if(err){
                                        throw err;
                                    }                                     pgRoomSchema.findOneAndUpdate({room_id:req.body.room_id,pg_id:req.body.pg_id},{$inc : { vacancies:-1}},function(err,response){
                                    if(err){
                                        // throw err;
                                        return res.send('Some Problem!');
                                    }else {
                                        console.log(response.vacancies);
                                        return res.send('Added successfully!');
                                    }
                     }); 
                                });                                
                            }else{
                                return res.send('You cannot add Member, since sharing is not available!');
                            }
                        });
                    });  
                   
                }                    
                }) ;   
        }else {
            res.send(req.body.user_id+' is not a valid user! Please enter valid User ID!'+response)
        }
    });
});

//Delete customer from room
var deleteCustomerRoute = router.route('/deleteCustomer');
deleteCustomerRoute.post(function(req,res,next) {
    pgRoomDetails.find({pg_id:req.body.pg_id,room_id:req.body.room_id,user_id:req.body.user_id}, function(err,response){
       if(err){
           throw err;
       }
        if(response.length > 0){
            pgRoomDetails.remove({pg_id:req.body.pg_id,room_name:req.body.room_name,user_id:req.body.user_id}, function(err,removed) {
                if(err){
                    //throw err;
                     return res.send('Cannot delete Customer from the room! Some Problem');
                }
                else {
                    pgRoomSchema.findOneAndUpdate({room_id:req.body.room_id,pg_id:req.body.pg_id},{$inc : { vacancies: 1}},function(err,response){
                        if(err){
                           // throw err;
                            return res.send('Some problem in deleting and updating!');
                        }
                        else {
                            return res.send('Customer is removed from and Updated Successfully!');   
                        }   
                    });
                }
                
            });
        }else {
            return res.send('Customer is not present in the Room!')
        }
    });
});

//View list of customer from room
var viewCustomerRoute = router.route('/viewCustomersForRoom');
viewCustomerRoute.post(function(req,res,next) {
   pgRoomDetails.find({room_id: req.body.room_id,pg_id: req.body.pg_id}, function(err,response){
       if(err){
          // throw err;
           return res.send('Some problem!');
       }
       if(response.length > 0){
           return res.json({"roomDetails":response});
       }
       else {
           return res.send('No customers are there in the given room!')
       }
   });
});

//Get Room Details
var getRoomDetailsRoute = router.route('/getRoomDetails');
getRoomDetailsRoute.post(function(req,res,next){
    pgRoomSchema.find({room_id:req.body.room_id,sharing:req.body.sharing,pg_id:req.body.pg_id},function(err,response){
        if(err){
            res.send('Some Problem with given Input!');
        }
        res.json({"roomDetails":response});
    });
});


var getUsersWithPGIdRoute = router.route('/getUsers/:id?');
getUsersWithPGIdRoute.get(function(req,res,next){
   if(req.param("id")){
       getAllPGUserDetailsById(req.param("id"),function(users){
           res.send(users)
       })
   }else {
       res.send('Invalid PG_Id!')
   } 
});


// Get all PG users by id
function getAllPGUserDetailsById(id, fn) {
    pgRoomDetails.find({pg_id: id})
	.exec(function (err, obj) {
			return fn(obj);
	});
}

//=======================================================================================
//=============================Set Rent Information======================================
//=======================================================================================
var setRentForUserRoute = router.route('/setRent');
setRentForUserRoute.post(function(req,res,next){
    pgRoomDetails.findOneAndUpdate({pg_id:req.body.pg_id,room_id:req.body.room_id, user_id:req.body.user_id}, { "$set" : { "current_month_status": req.body.current_month_status , "previous_month_status":req.body.previous_month_status}},function(err,response){
        if(err){
            return res.send('Some Problem!');
        }
        return res.send('Updated Sucessfully!');
    });
});

//=======================================================================================
//=========================Get All the Customers with PG ID==============================
//=======================================================================================
var getAllCustomersRoute = router.route('/getAllCustomers');
getAllCustomersRoute.post(function(req,res,next){
   pgRoomDetails.find({pg_id:req.body.pg_id},function(err,response){
       if(err){
           return res.send('Some Problem with PG Schema');
       }
       if(response.length > 0){
           //Get all User IDs
           var ids = [];
           var roomIds = [];
           var length = response.length;
           for(i = 0; i < length; i++) {
               var idObject = new Object();
               idObject.userId = response[i].user_id;
               idObject.roomId = response[i].room_id
               ids.push(idObject);
           }
           var users = [];
           var onComplete = function() {
              return res.json({"users":users});
            };
           var taskToGo = ids.length;
           if(taskToGo == 0){
               return res.send(users);
           }else {
               ids.forEach(function(id){
                   gwuser.find({user_id:id.userId},function(err,user){
                     if(err){
                         return res.send(err);
                      }
                    var userWithOtherDetails = new Object();//user[0];
                       
                    pgRoomSchema.find({room_id:id.roomId},function(err,room){
                     if(err){
                         return res.send(err);
                      }
                        userWithOtherDetails.room_name = room[0].room_name;
                        userWithOtherDetails.sharing = room[0].sharing;
                        userWithOtherDetails.room_id = id.roomId;
                        
                        userWithOtherDetails.first_name = user[0].first_name;
                        userWithOtherDetails.last_name = user[0].last_name;
                        userWithOtherDetails.user_id = user[0].user_id;
                        userWithOtherDetails.username = user[0].username;
                        userWithOtherDetails.id_type = user[0].id_type;
                        userWithOtherDetails.id_number = user[0].id_number;
                        userWithOtherDetails.mobile_number = user[0].mobile_number;
                        userWithOtherDetails.email = user[0].email;
                        userWithOtherDetails.address_line_1 = user[0].address_line_1;
                        userWithOtherDetails.address_line_2 = user[0].address_line_2;
                        userWithOtherDetails.state = user[0].state;
                        userWithOtherDetails.pincode = user[0].pincode;
                        userWithOtherDetails.user_type = user[0].user_type;
                        userWithOtherDetails.profile_image = user[0].profile_image;
                        
                        users.push(userWithOtherDetails);
                        if(--taskToGo == 0){
                            onComplete();
                        }
                    });                       
                    
                    
               });
           });
           }
       }else {
           return res.send('No customers present in this PG!');
       }
   });
});

//Delete room from PG
var deleteRoom = router.route('/deleteRoom');
deleteRoom.post(function(req,res,next) {
  pgRoomSchema.find({pg_id:req.body.pg_id,room_name:req.body.room_name,sharing:req.body.sharing},function(err,response){
       if(err) {
           throw err;
       } 
        if(response.length > 0) {
            pgRoomDetails.remove({pg_id:req.body.pg_id,room_name:req.body.room_name},function(err,res){
            });
            pgRoomSchema.remove({pg_id:req.body.pg_id,room_name:req.body.room_name,sharing:req.body.sharing}, function(err,removed) {
                if(err){
                    throw err;
            }
                return res.send('Room is deleted!');
            });
        }
            else {
                return res.send('Sorry! There is no room with that name!')
            }
    });
    
});

//===============================================================================================================
//==========================Return PG ID=========================================================================
//===============================================================================================================
var getPgId = router.route('/getPgId');
getPgId.post(function(req,res,next){
    pgRoomDetails.find({user_id:req.body.user_id},function(err,response){
        if(err){
            res.send('Some Problem with given Input!');
        }
        if(response.length > 0)
            {
                return res.json({"pg_id":response[0].pg_id});
            }else{
                return res.send('No pg available!');
            }
        
    });
});


module.exports = router;