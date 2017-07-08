// Node Module dependencies
var express = require('express');
var router = express.Router();
//var fs = require('fs');
var nodemailer = require('nodemailer');
var bodyparser = require('body-parser');
var jsonparser = bodyparser.json({type: 'application/json'})

// Local Module dependencies
var common = require('./common.js');

//for auto incremanting primary key
common.autoIncrement.initialize(common.conn);

//-------------------------------------------Schema Definitions--------------------------------------------------
var pgInfoSchema = common.Schema({
    pg_id: {type: Number, ref:'PG'},
    breakfast: String,
    launch: String,
    dinner: String,
    rent_info: String,
    pg_state: String,
    pg_city: String,    
    pg_area: String,
    pg_description:String    
});

//schema variable
var pgInfo = common.conn.model('PG_Info', pgInfoSchema);
var pgSchema = common.conn.model('PG');
var pgReviews = common.conn.model('PG_Reviews');
var pgRooms = common.conn.model('PG_Room');
var gwuser = common.conn.model('Customer');
//auto increment for user_id
pgInfoSchema.plugin(common.autoIncrement.plugin, {
    model: 'PG_Info',
    field: 'pg_id'
});

//===============================================================================================================
//==========================Get PG Information===================================================================
//===============================================================================================================
var getPgInfoRoute = router.route('/getPgInfo');
getPgInfoRoute.post(function(req,res,next){
    pgSchema.find({pg_id:req.body.pg_id},function(err,response){
       if(err){
           return res.send(err);
       }
        if(response.length > 0){
            pgInfo.findOne({pg_id:req.body.pg_id},function(err,pgInformation){
               if(err){
                   return res.send('Problem with PG Information Schema!');
               } 
                if(pgInformation){
                    return res.json({"pgInfo":pgInformation});
                }else {
                    return res.send('PG information for the given ID is not available!');
                }
            });
        }else {
            return res.send('There is no PG Present with that ID!');
        }
    });
});

//===============================================================================================================
//==========================Set PG Information===================================================================
//===============================================================================================================
var setPgInfoRoute = router.route('/setPgInfo');
setPgInfoRoute.post(function(req,res,next){
   pgSchema.find({pg_id:req.body.pg_id},function(err,response){
      if(err){
          return res.send(err);
      } 
       if(response.length > 0){
           pgInfo.findOne({pg_id:req.body.pg_id},function(err,pgInformation){
              if(err){
                  return res.send('Problem with PG Information Schema!');
              }
               if(pgInformation){
                   pgInfo.findOneAndUpdate({pg_id:req.body.pg_id},{$set:{pg_id:req.body.pg_id,breakfast:req.body.breakfast, launch:req.body.launch, dinner:req.body.dinner, pg_state:req.body.pg_state, pg_city:req.body.pg_city, pg_area:req.body.pg_area, pg_description: req.body.pg_description, rent_info:req.body.rent_info}},function(err,response){
                      if(err){
                          return res.send('Cannot save the Information!Problem with PG Info Schema!');
                      } 
                      if(response){
                          return res.send('Updated Sucessfully!');
                      }
                   });
               }else {
                  var pgInfor = new pgInfo(req.body);
                  pgInfor.save(function(err,response){
                  if(err){
                     return res.send('Cannot save the Information!Problem with PG Info Schema!');
                  }else {
                    return res.send('Saved Sucessfully!') ;
                  } 
                });
               }
           });
       }else {
           return res.send('There is no PG Present with that ID!'); 
       }
   }); 
});

//=========================================================================================================
//================================Search PG by PG Address==================================================
//=========================================================================================================
var searchByAddressRoute = router.route('/searchByAddress');
searchByAddressRoute.post(function(req,res,next){
    var state = ".*" + req.body.pg_state + ".*";
    var city = ".*" + req.body.pg_city + ".*";
    var area = ".*" + req.body.pg_area + ".*";
    pgInfo.find({pg_state: { $regex: state },pg_city: { $regex: city },pg_area: { $regex: area } },function(err,response){
       if(err){
           return res.send('Problem with PG Schema');
       }
        if(response.length > 0){
            var tasks = 0;
            var pgList = [];
            response.forEach(function(pg){
                var pgOwnerUserId;
                var newPGInfo = new Object();
                newPGInfo.pg_id = pg.pg_id;
                newPGInfo.pg_state = pg.pg_state;
                newPGInfo.pg_city = pg.pg_city;
                newPGInfo.pg_area = pg.pg_area;
                newPGInfo.pg_description = pg.pg_description;
                // For pg_name pg_type and pg_profile_pic
                pgSchema.find({pg_id:pg.pg_id},function(err,pgDetails){
                   if(pgDetails[0].pg_type == req.body.pg_type){
                       newPGInfo.pg_name = pgDetails[0].pg_name;
                       newPGInfo.pg_type = pgDetails[0].pg_type;
                       newPGInfo.pg_profile_pic = pgDetails[0].pg_profile_pic;
                       pgOwnerUserId = pgDetails[0].user_id;
                    }
                    // For available vacancies and total vacancies
                    pgRooms.find({pg_id:pg.pg_id},function(err,pg_rooms){
                        if(err){
                            return res.send('Problem with PGRoom Schema!');
                        }
                        var totalVacancies = 0;
                        var vacancies = 0;
                        if(pg_rooms.length > 0)
                            {                                
                                pg_rooms.forEach(function(pg_room){
                                totalVacancies += pg_room.sharing;
                                vacancies += pg_room.vacancies;
                                });
                                newPGInfo.totalVacancies = totalVacancies;
                                newPGInfo.vacancies = vacancies;
                            }
                        else
                            {
                                newPGInfo.totalVacancies = 0;
                                newPGInfo.vacancies = 0;
                            }
                        // For pg reviews and rating
                        pgReviews.find({pg_id:pg.pg_id},function(err,pg_reviews){
                            if(err){
                            return res.send('Problem with PGReview Schema!');
                            }
                            var averageReviewRating = 0;
                            if(pg_reviews.length > 0)
                                {
                                    pg_reviews.forEach(function(pg_review){
                                        averageReviewRating += pg_review.rating;
                                    });
                                    newPGInfo.averageReviewRating = averageReviewRating/pg_reviews.length;
                                    //newPGInfo.pg_reviews = pg_reviews;
                                }
                            else
                                {
                                    newPGInfo.averageReviewRating = 0.0;
                                    //newPGInfo.pg_reviews = pg_reviews;
                                }
                            // For pg owner id
                            gwuser.find({user_id:pgOwnerUserId},function(err,owner){
                                if(err){
                                    return res.send('Problem with gwuser Schema!');
                                }                                
                                if(owner.length > 0)
                                    {  
                                         newPGInfo.contact_number = owner[0].mobile_number;
                                    }                                   
                                else
                                    {
                                         newPGInfo.contact_number = 0;
                                    }
                                pgList.push(newPGInfo);
                                tasks += 1;
                                if(tasks == response.length)
                                    return res.json({"pgs":pgList});
                                });
                        });
                    });
                });
            });
        }else {
            return res.send('Cannot find the PG!');
        }
        
    });
});

//=========================================================================================================
//================================Search PG by PG Name=====================================================
//=========================================================================================================
var searchByNameRoute = router.route('/searchByName');
searchByNameRoute.post(function(req,res,next){
    var name = ".*" + req.body.pg_name + ".*"
    pgSchema.find({pg_name: { $regex: name },pg_type:req.body.pg_type },function(err,response){
       if(err){
           return res.send('Problem with PG Schema');
       }
        if(response.length > 0){
            var tasks = 0;
            var pgList = [];
            response.forEach(function(pg) {
                var pgOwnerUserId = pg.user_id;
                var newPGInfo = new Object();
                newPGInfo.pg_id = pg.pg_id;
                newPGInfo.pg_name = pg.pg_name;
                newPGInfo.pg_type = pg.pg_type;
                newPGInfo.pg_profile_pic = pg.pg_profile_pic;
                // For Address
                pgInfo.find({pg_id:pg.pg_id},function(err,pgInformation){
                    if(err){
                        return res.send('Problem with PGInformation Schema');
                    }
                    if(pgInformation.length > 0) {
                        newPGInfo.pg_state = pgInformation[0].pg_state;
                        newPGInfo.pg_city = pgInformation[0].pg_city;
                        newPGInfo.pg_area = pgInformation[0].pg_area;
                        newPGInfo.pg_description = pgInformation[0].pg_description;
                    }else
                        {
                        newPGInfo.pg_state = "";
                        newPGInfo.pg_city = "";
                        newPGInfo.pg_area = "";
                        newPGInfo.pg_description = "";
                        }
                    
                    // For available vacancies and total vacancies
                    pgRooms.find({pg_id:pg.pg_id},function(err,pg_rooms){
                        if(err){
                            return res.send('Problem with PGRoom Schema!');
                        }
                        var totalVacancies = 0;
                        var vacancies = 0;
                        if(pg_rooms.length > 0)
                            {                                
                                pg_rooms.forEach(function(pg_room){
                                totalVacancies += pg_room.sharing;
                                vacancies += pg_room.vacancies;
                                });
                                newPGInfo.totalVacancies = totalVacancies;
                                newPGInfo.vacancies = vacancies;
                            }
                        else
                            {
                                newPGInfo.totalVacancies = 0;
                                newPGInfo.vacancies = 0;
                            }
                        // For pg reviews and rating
                        pgReviews.find({pg_id:pg.pg_id},function(err,pg_reviews){
                            if(err){
                            return res.send('Problem with PGReview Schema!');
                            }
                            var averageReviewRating = 0;
                            if(pg_reviews.length > 0)
                                {
                                    pg_reviews.forEach(function(pg_review){
                                        averageReviewRating += pg_review.rating;
                                    });
                                    newPGInfo.averageReviewRating = averageReviewRating/pg_reviews.length;
//                                    newPGInfo.pg_reviews = pg_reviews;
                                }
                            else
                                {
                                    newPGInfo.averageReviewRating = 0;
//                                    newPGInfo.pg_reviews = pg_reviews;
                                }
                            // For pg owner id
                            gwuser.find({user_id:pgOwnerUserId},function(err,owner){
                                if(err){
                                    return res.send('Problem with gwuser Schema!');
                                }
                                if(owner.length > 0)
                                    {
                                        newPGInfo.contact_number = owner[0].mobile_number;
                                    }
                                else
                                    {
                                         newPGInfo.contact_number = 0;
                                    }
                                pgList.push(newPGInfo);
                                tasks += 1;
                                if(tasks == response.length)
                                    return res.json({"pgs":pgList});
                                });
                        } );
                    });                    
                });                
            });
        }else {
            return res.send('Cannot find the PG!');
        }
        
    });
});


module.exports = router;