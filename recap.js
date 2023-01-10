import fs from 'fs';

//get today day of the week
var today = new Date().getDay();
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var realLate = [];
var three_min_Late = [];
console.log(weekday[today])  

//function that get all json file in the folder and return an array of the file name
function getTrains(typeOfTrain) {
    var files = fs.readdirSync("./");
    var jsonFiles = [];
    files.forEach(file => {
        if (file.includes(typeOfTrain)) {
            readFile(file)['trains'].forEach(train => {
                if (!jsonFiles.some(el => el.id === train.id)) {
                    jsonFiles.push(train);
                    if (train.difference.includes("minutes") && train.difference.includes("retard")){
                        realLate.push(train)
                        if (!train.difference.includes("1 minutes") && !train.difference.includes("2 minutes")) {
                            three_min_Late.push(train)
                        }
                    }
                }
            });
        }
    });
//    console.log(jsonFiles)
    return jsonFiles;
}

//function that read the file and return the content of the file as a json object
function readFile(file) {
    var json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return json;
}



const weird_trains = getTrains("weird_")

console.log("Train Passé : " + getTrains("train_").length)
console.log("Train +1 minutes de retard: " + realLate.length)
console.log("dont avec +3 minutes de retard: " + three_min_Late.length)
console.log("Train officiellement retardé ou annulé : " + weird_trains.length)
