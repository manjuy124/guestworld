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
var pgReviewsSchema = common.Schema({
    pg_id: {type: Number, ref:'PG'},
    user_id: {type: Number, ref:'Customer'},
    review_id: {type: common.Schema.Types.ObjectId},
    review_title: String,
    review_description: String,
    rating: Number    
});

//auto increment for user_id
pgReviewsSchema.plugin(common.autoIncrement.plugin, {
    model: 'PG_Reviews',
    field: 'review_id',
    startAt: 1000,
    incrementBy: 1
});

//set composite key
pgReviewsSchema.index({pg_id: 1, user_id: 1, review_id: 1},{unique: true});

//schema variable
var pgReviews = common.conn.model('PG_Reviews', pgReviewsSchema);
var pgSchema = common.conn.model('PG');
var gwuser = common.conn.model('Customer');


//==================================================================================================================
//================================View PG Reviews===================================================================
//==================================================================================================================
var viewUserReviewsRoute = router.route('/viewReviews');
viewUserReviewsRoute.post(function(req,res,next){
    pgSchema.find({pg_id:req.body.pg_id},function(err,response){
       if(err){
           return res.send(err);
       } 
        if(response.length > 0){
            pgReviews.find({pg_id:req.body.pg_id},function(err,response){
               if(err){
                   return res.send(err);
               }
                if(response.length > 0){
                    return res.json({"pg_reviews":response});
                }else {
                    return res.send('Reviews are not present for the Given Pg_id');
                }
            });
        }else {
            return res.send('There is no PG present with that Id!');
        }
    });
});

//==================================================================================================================
//================================Add PG Review=====================================================================
//==================================================================================================================
var addPgReviewRoute = router.route('/addReview');
addPgReviewRoute.post(function(req,res,next){
   gwuser.find({user_id:req.body.user_id},function(err,response){
       if(err){
           return res.send('Problem with User Schema');
       }
       if(response.length > 0) {
           pgSchema.find({pg_id:req.body.pg_id},function(err,response){
               if(err){
                   return res.send(err);
               }
               if(response.length > 0){
                   pgReviews.find({user_id:req.body.user_id,pg_id:req.body.pg_id},function(err,response){
                       if(err){
                           return res.send(err);
                       }
                       if(response.length > 0){
                           pgReviews.update({user_id:req.body.user_id,pg_id:req.body.pg_id},{$set: {review_title:req.body.review_title, review_description:req.body.review_description,rating:req.body.rating}});
                           return res.send('Updated Sucessfully!');
                       }else{
                            var newReview = new pgReviews(req.body);
                            newReview.save(function(err,response){
                            if(err)
                                return res.send('There is some problem with Reviews Schema!');
                            return res.send('Review Added Sucessfully!'); 
                    });
                       }
                   });                  
               }else {
                   return res.send('PG ID is not present!');
               }
           });
       }else {
           return res.send('There is no user present with that ID!');
       }
   });
});


module.exports = router;