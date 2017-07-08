// Node Module dependencies
var express = require('express');
var router = express.Router();
//var fs = require('fs');
var nodemailer = require('nodemailer');

// Local Module dependencies
var common = require('./common.js');
var pgjs = require('./pg.js');
//var pgroomdetailsjs = require('./pg_room_details.js');
//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var pgRoomSchema = common.Schema({
    pg_id: {type: Number, ref:'PG'},
    room_id: { type: common.Schema.Types.ObjectId },
    room_name: String,
    sharing:Number,
    vacancies: Number
});

//auto increment for user_id
pgRoomSchema.plugin(common.autoIncrement.plugin, {
    model: 'PG_Room',
    field: 'room_id',
    startAt: 2000,
    incrementBy: 1
});

//schema variable
var pgRooms = common.conn.model('PG_Room', pgRoomSchema);
var pgSchema = common.conn.model('PG',pgjs.pgSchema);

//var pgRoomDetails = common.conn.model('PG_Room_Details');//,pgroomdetailsjs.pgRoomDetailsSchema);

//Get all the rooms
var getAllRoomDetails = router.route('/all');
getAllRoomDetails.post(function(req,res){
    
    pgRooms.find({pg_id:req.body.pg_id},function(err,response){
        
        if (err)
            throw err;
        res.json({"rooms":response});
    })
})


//Add room to the PG
var addRoom = router.route('/addRoom');
addRoom.post(function(req,res,next) {
    pgSchema.find({pg_id:req.body.pg_id}, function(err,response) {
       if(err) {
           throw err;
       } 
       if(response.length > 0) {
           var newRoom = new pgRooms(req.body);
                newRoom.save(function(err,response){
                if(err){
                    return res.send(err);
                }                
                return res.send("New Room added!");                
            //res.json({ message: 'User added to the GW!', data: response });
        });
       }
        else {
            return res.send('There is no PG with that PG_Id!');
        }
    });
});

////Delete room from PG
//var deleteRoom = router.route('/deleteRoom');
//deleteRoom.post(function(req,res,next) {
//    pgRooms.find({pg_id:req.body.pg_id,room_name:req.body.room_name,sharing:req.body.sharing},function(err,response){
//       if(err) {
//           throw err;
//       } 
//        if(response.length > 0) {
//            pgRoomDetails.remove({pg_id:req.body.pg_id,room_name:req.body.room_name},function(err,res){
//            });
//            pgRooms.remove({pg_id:req.body.pg_id,room_name:req.body.room_name,sharing:req.body.sharing}, function(err,removed) {
//                if(err){
//                    throw err;
//            }
//                return res.send('Room is deleted!');
//            });
//        }
//            else {
//                return res.send('Sorry! There is no room with that name!')
//            }
//    });
//    
//});
//Return Room Sharing of given PG_Id
var getSharingRoute = router.route('/getSharing');
getSharingRoute.post(function(req,res,next) {
    pgRooms.find({pg_id:req.body.pg_id,room_id:req.body.room_id}, function(err,response) {
       if(err) {
           throw err;
       } 
       if(response.length > 0) {             
            return res.json({ "sharing": response[0].sharing});
        }
        else {
            return res.send('There is no Room!');
        }    
    });
});
       




module.exports = router;
//set pg variable as global
module.exports.pgRoomSchema = pgRooms;
