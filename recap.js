import fetch from 'node-fetch';
import fs from 'fs';
import * as dotenv from 'dotenv'
import cron from 'node-cron';

import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

dotenv.config();

const oauth = OAuth({
    consumer: {
        key: process.env.TWITTER_API_KEY,
        secret: process.env.TWITTER_API_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
    },
})

const token = {
    key: process.env.TWITTER_ACCESS_TOKEN,
    secret: process.env.TWITTER_ACCESS_SECRET
}

const request_data = {
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST',
    data: ''
}


//post request with header with Oauth token
const postRequest = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': oauth.toHeader(oauth.authorize(request_data, token))['Authorization']
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

//get today day of the week
var date = new Date();
date.setDate(date.getDate() - 1);
var today = date.getDay();
const weekday = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const months = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const normal = [41 + 39, 41 + 41, 41 + 41, 41 + 41, 41 + 41, 41 + 41, 41 + 39]

var all_trains = [];
var passed_trains = [];
var notLate = [];
var realLate = [];
var three_min_Late = [];

//function that get all json file in the folder and return an array of the file name
function getTrains(typeOfTrain) {
    var files = fs.readdirSync("./");
    var jsonFiles = [];
    files.forEach(file => {
        if (file.includes(typeOfTrain)) {
            readFile(file)['trains'].forEach(train => {
                if (!jsonFiles.some(el => el.id === train.id)) {
                    jsonFiles.push(train);
                    all_trains.push(train);
                    if (train.status != "cancelled")
                        passed_trains.push(train)
                    if (train.difference.includes("minutes") && train.difference.includes("retard")) {
                        realLate.push(train)
                        if (!train.difference.includes("1 minutes") && !train.difference.includes("2 minutes")) {
                            three_min_Late.push(train)
                        }
                    } else if (train.status.includes("onTime")) {
                        notLate.push(train)
                    }
                }
            });
        }
    });
    return jsonFiles;
}

//function that read the file and return the content of the file as a json object
function readFile(file) {
    var json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return json;
}

function addZero(i) {
    if (i < 10) { i = "0" + i }
    return i;
}

function writeToFile(array, start) {
    var date = new Date();
    var fileName = start + date.getFullYear() + "-" + addZero(date.getMonth() + 1) + "-" + addZero(date.getDate()) + "_" + addZero(date.getHours()) + "-" + addZero(date.getMinutes()) + "-" + addZero(date.getSeconds()) + ".json";
    fs.writeFile
        (fileName
            , JSON.stringify(array)
            , function (err) {
                if (err) throw err;
                console.log(start + ' is saved !');
            });
}

//function that delete all file in the folder starting by the string in parameter
function deleteFiles(start) {
    var files = fs.readdirSync("./");
    files.forEach(file => {
        if (file.includes(start)) {
            fs.unlink(file, err => {
                if (err) {
                    throw err
                }
            })
        }
    });
    console.log("Files deleted")
}


cron.schedule('1 4 * * *', () => {
    var string = "";
    all_trains = [];
    passed_trains = [];
    notLate = [];
    realLate = [];
    three_min_Late = [];
    
    date = new Date();
    date.setDate(date.getDate() - 1);
    today = date.getDay();
    
    getTrains("train_");
    var weird_trains = getTrains("weird_");


    string += "🚆 " + date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear() + " - Roissy en Brie\n"
    string += (notLate.length + realLate.length) + " trains sont passés aujourd'hui au lieu des " + normal[today] + " prévus pour un " + weekday[today].toLowerCase() + " sans perturbations\n\n"
    string += "✅ " + notLate.length + " sont passés à l'heure (" + (notLate.length / normal[today] * 100).toFixed(1) + "%)\n\n"
    string += "⏲ " + realLate.length + " avec +1 min de retard\n"
    string += "dont " + three_min_Late.length + " avec +3 min de retard\n\n"
    string += "❌ Train retardé ou annulé d'après la SNCF : " + weird_trains.length

    weird_trains.forEach(train => {
        console.log("    " + train.mission + " - " + train.destination + " : " + train.arrivee + " // " + train.status)
    })

    postRequest('https://api.twitter.com/2/tweets', {
        "text": string
    }).then(data => {
        console.log(data)
    }).catch(err => {
        console.log(err)
    })
    console.log(string)

    writeToFile(all_trains, "all_");
    deleteFiles("train_");
    deleteFiles("weird_");
});