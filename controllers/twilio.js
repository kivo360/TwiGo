/**
 * Created by kevin on 1/16/15.
 */
var secrets = require('../config/secrets');
var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
var fm = require('./file_manager');
exports.postTwilio = function(req, res, next) {
    req.assert('number', 'Phone number is required.').notEmpty();
    req.assert('message', 'Message cannot be blank.').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/api/twilio');
    }

    var gg = req.files.file;
    var message; // Pre-assign message
    //console.log(gg);
    //check for the file here
        // If the file exist and is photo
    console.log(gg);
        if(gg && fm.fileCheck(gg.name, ['png', 'jpeg', 'jpg'])){
            // Create mms message
            message = {
                to: req.body.number,
                from: '+13134861219',
                body: req.body.message,
                mediaUrl: "http://104.131.110.177:3000/"+ gg.name// Change to local
            };

            twilio.sendMms(message, function(err, responseData) {
                if (err) return next(err.message);
                req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
                res.redirect('/api/twilio');
            });
        }else{
            // Create normal message

            message = {
                to: req.body.number,
                from: '+13134861219',
                body: req.body.message
            };
            twilio.sendMms(message, function(err, responseData) {
                if (err) return next(err.message);
                req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
                res.redirect('/api/twilio');
            });
        }



};

exports.fileDownload = function (req, res) {
    var fn = req.param('fileName');
    //http://104.131.110.177:3000

    res.sendFile('/home/kevin/Programming/TwiGo/TwiGo/uploads/' + fn);
};