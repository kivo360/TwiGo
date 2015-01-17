/**
 * Created by kevin on 1/16/15.
 */
var secrets = require('../config/secrets');
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var fm = require('./file_manager');
var async = require('async');
var path = require('path');

var cargo = async.cargo(function (tasks, callback) {
    for(var i=0; i<tasks.length; i++){
        twilio.sendMms(tasks[i], function(err, responseData) {
            console.log(responseData);
        });
    }
    callback()
}, 10);



exports.postTwilio = function(req, res, next) {

    req.assert('message', 'Message cannot be blank.').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/twilio');
    }
    

    
    var gg = req.files.file;
    var fileList = req.files.listfile;
    var message; // Pre-assign message
    var processList = [];
    var errorList = [];

    if(fileList && fm.fileCheck(fileList.name, ['txt', 'csv'])){
        var ft = fm.fileType(fileList.name);
        if(ft === "csv"){
            fm.csv(path.resolve('uploads/'+ fileList.name), function (info) {
                for(var i = 0; i < info.length; i++){
                    for(var j = 0; j < info[i].length; j++) {
                        fm.checkNumber(info[i][j]);
                    }
                }

                // send message
            });
        }else{
            fm.txt(path.resolve('uploads/'+ fileList.name), function (info) {
                for(var i = 0; i < info.length; i++){
                    fm.checkNumber(info[i]);
                }
            })
        }
    }


    //check for the file here
        // If the file exist and is photo

        //if(gg && fm.fileCheck(gg.name, ['png', 'jpeg', 'jpg'])){
            // Create mms message
    var allnums = fm.all();
    for(var i = 0; i< allnums.length;i++){
        var message;
        if(gg && fm.fileCheck(gg.name, ['png', 'jpeg', 'jpg'])){
            message = createMessage(allnums[i], req.body.message, gg);
        }else{
            message = createMessage(allnums[i], req.body.message, gg);
        }
        cargo.push(message, function (err) {
            if(err){
                errorList.push({phone: allnums[i], error: err});
            }else{
                processList.push({phone: allnums[i]});
            }
            var el = errorList.length;
            var pl = processList.length;
            //console.log(processList);
            //console.log(errorList);
            if(allnums.length === el+ pl){
                fm.delete();
                req.flash('success', { msg: 'Messages were sent to list you presented with ' + el + ' errors and ' + pl + ' successes'});
                res.redirect('/api/twilio');
            }
        });
    }

            //});




};

var createMessage = function (number, body, image) {
    var message;
    if(image){
        message = {
            to: number,
            from: '+13134861219',
            body: body,
            mediaUrl: "http://104.131.110.177:3000/downloadFile/"+ image.name// Change to local
        };
        return message;
    }else{
        message = {
            to: number,
            from: '+13134861219',
            body: body
        };
        return message;
    }

};

exports.fileDownload = function (req, res) {
    var fn = req.param('fileName');
    //http://104.131.110.177:3000
    res.sendFile(path.resolve('uploads/') + '/' + fn);
};