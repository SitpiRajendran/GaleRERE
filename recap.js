import fs from 'fs';

//get today day of the week
var today = new Date().getDay();
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var realLate = [];
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




console.log("Train Passé : " + getTrains("train_").length)
console.log("Train +1 minutes de retard: " + realLate.length)
console.log("Train officiellement retardé ou annulé : " + getTrains("weird_").length)