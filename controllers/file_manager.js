/**
 * Created by kevin on 1/16/15.
 */

/**
 * Created by kevin on 1/6/15.
 */
var _ = require("lodash");
var fs = require('fs'),
    readline = require('readline');

var S = require('string');
var csv = require('fast-csv');
var phone = require('phone');
var low = require('./../controllers/low');

var s3 = require('s3');
var uuid = require('node-uuid');

var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId: "AKIAJV44Z4IBDJL5VXEQ",
        secretAccessKey: "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"
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    }
});

var getFileType = function (fileName) {
    var re = /(?:\.([^.]+))?$/;
    var ext = re.exec(fileName)[1];
    return ext;
}

var uploadFileEss = function (uploadedFile, cb) {
    var fileExtension = getFileType(uploadedFile.name)
    var uuidname = "" + uuid.v4() + "." + fileExtension;
    var uploadParams = {
        localFile: uploadedFile.path,

        s3Params: {
            Bucket: "bubblevid",
            Key: "mms/" + uuidname
        }
    };


    var uploader = client.uploadFile(uploadParams);
    uploader.on('error', function(err) {
        console.error("unable to upload:", err.stack);
        fs.unlink(uploadedFile.path, function (e) {
            if (e) throw e;
            console.log("done uploading");
            cb(err, "nill");
        });
    });
    uploader.on('progress', function() {
        console.log("progress", uploader.progressMd5Amount,
            uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
        var fileURL = "http://bubblevid.s3.amazonaws.com/" + "mms/" + uuidname;
        fs.unlink(uploadedFile.path, function (err) {
            if (err) throw err;
            console.log("done uploading");
            cb(err, uuidname);
        });
    });
};

var downloadFileEss = function (fileKey, cb){
    var localString =  "./temp/" + fileKey;
    var downloadParams = {
        localFile: localString,

        s3Params: {
            Bucket: "bubblevid",
            Key: "mms/" + fileKey
        }
    };
    var downloader = client.downloadFile(downloadParams);
    downloader.on('error', function(err) {
        console.error("unable to download:", err.stack);
        cb(true, "nill")
    });
    downloader.on('progress', function() {
        console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function() {
        console.log("done downloading");
        cb(false, localString);
    });
};

var checkFileType = function (filename, fileList) {
    // Get the extention
    var ext = getFileType(filename);
    if(!Boolean(ext)){
        return false;
    }else{
        return _.contains(fileList, ext);
    }
};

var checkMimeType = function (mimeVal, checkingVal) {
    if(mimeVal === checkingVal){
        return true;
    }return false;
};





var textReader = function (textFile, cb) {
    var arr = [];
    var rd = readline.createInterface({
        input: fs.createReadStream(textFile),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', function(line) {
        //console.log(line.lastIndexOf('@') +1);
        var newString = line.split("@");
        arr.push(newString[0]);
    });
    rd.on('close', function () {
        cb(arr);
    })
};

// TODO: Send file to lowdb. Switch to mongo later. Need simple first






function csvconversion(filestring, cb){

    var stream = fs.createReadStream(filestring);
    var arr = [];
    var csvStream = csv()
        .on("data", function(data){
            //console.log(data);
            arr.push(data);
            //Search through array for all phone numbers
        })
        .on("end", function(){
            cb(arr);
        });

    stream.pipe(csvStream);
}

//csvconversion('factor.csv', function (yay) {
//    for(var i = 0; i < yay.length; i++){
//        for(var j = 0; j < yay[i].length; j++) {
//            checkNumber(yay[i][j])
//        }
//    }
//});
//textReader('testText.txt', function (derp) {
//    //console.log(derp)
//    for(var i = 0; i < derp.length; i++){
//        checkNumber(derp[i]);
//    }
//});




function checkNumber(string){
    var potential = S(string).strip(' ', '_', '-').s;
    var newPhone = phone(potential);
    if(Boolean(newPhone[1])){
        var lab = low('phones').find({phoneNumber: newPhone[0]}).value();
        if(lab){
            return;
        }else{
            low('phones').push({phoneNumber: newPhone[0], time: new Date().valueOf()});
            console.log(newPhone[0]);
        }
    }
}

var getNumbers = function (currentTime) {
    return low('phones').filter(function (val) {return val.time >= currentTime;}).value();
};

var getAll = function () {
    return low('phones').pluck('phoneNumber').value();
};

var deleteAll = function () {
    delete low.object.phones;
    low.save();
    return;
};

module.exports = {
    upload: uploadFileEss,
    download: downloadFileEss,
    fileCheck: checkFileType,
    mimeCheck: checkMimeType,
    fs: fs,
    txt: textReader,
    csv: csvconversion,
    numbers: getNumbers,
    checkNumber: checkNumber,
    fileType: getFileType,
    all: getAll,
    delete: deleteAll
};