/**
 * Created by kevin on 1/16/15.
 * Manipulates A text file to scan and remove phone numbers
 */

var fs = require('fs'),
    readline = require('readline');

var S = require('string');
var csv = require('fast-csv');
var phone = require('phone');
var low = require('./../controllers/low');


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

var csvStuff = function (cb) {
    csvconversion('factor.csv', function (yay) {
        for(var i = 0; i < yay.length; i++){
            for(var j = 0; j < yay[i].length; j++) {
                checkNumber(yay[i][j])
            }
        }
    });
};

textReader('testText.txt', function (derp) {
    //console.log(derp)
    for(var i = 0; i < derp.length; i++){
        checkNumber(derp[i]);
    }
});




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

module.exports = {
    txt: textReader,
    csv: csvconversion,
    check: checkNumber,
    all: getAll,
    numbers: getNumbers
};