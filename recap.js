import fs from 'fs';

//get today day of the week
var today = new Date().getDay();
var date = new Date();

const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

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
                    if (train.difference.includes("minutes") && train.difference.includes("retard")) {
                        realLate.push(train)
                        if (!train.difference.includes("1 minutes") && !train.difference.includes("2 minutes")) {
                            three_min_Late.push(train)
                        }
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

var all_trains = getTrains("train_");
var weird_trains = getTrains("weird_");

console.log(weekday[today] + " " + date.getDate() + " " + date.getMonth() + " " + date.getFullYear()) 
console.log("-")
console.log("Trains passés à Roissy en Brie : " + all_trains.length)
console.log("avec +1 minutes de retard: " + realLate.length)
console.log("dont avec +3 minutes de retard: " + three_min_Late.length)
console.log("")
console.log("Train officiellement retardé ou annulé : " + weird_trains.length)
weird_trains.forEach(train => {
    console.log("    " + train.mission + " - " + train.destination + " : " + train.arrivee + " // " +  train.status)
})
