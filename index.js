import fetch from 'node-fetch';
import fs from 'fs';
import * as dotenv from 'dotenv'
import cron from 'node-cron';


dotenv.config();

const stationRef = "STIF:StopPoint:Q:41033:";
const url = 'https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=' + stationRef;
const options = {
    headers: {
        'apikey': process.env.SNCF_API_KEY
    }
};

var trainPassé = []
var trainFutur = []
var autreTrain = []
var nonNormal = []

cron.schedule('0,15,30,45 0-3,5-23 * * *', () => {
    console.log('running a task every minute');
    trainPassé = []
    trainFutur = []
    autreTrain = []
    nonNormal = []
    fetch(url, options)
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Something went wrong');
        })
        .then(json => {
            json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(train => {
                if (train.MonitoredVehicleJourney.LineRef.value == "STIF:Line::C01729:") {
                    if (train.MonitoredVehicleJourney.MonitoredCall.VehicleAtStop) {
                        trainPassé.push({
                            "id": train.MonitoredVehicleJourney.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
                            "ligne": "RER E",
                            "mission": train.MonitoredVehicleJourney.JourneyNote[0].value,
                            "destination": train.MonitoredVehicleJourney.DestinationName[0].value,
                            "arrivee": getTime(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime),
                            "arriveeReelle": getTime(train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime),
                            "status": train.MonitoredVehicleJourney.MonitoredCall.ArrivalStatus,
                            "difference": timeDiff(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime, train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
                        })
                    } else {
                        trainFutur.push({
                            "id": train.MonitoredVehicleJourney.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
                            "ligne": "RER E",
                            "mission": train.MonitoredVehicleJourney.JourneyNote[0].value,
                            "destination": train.MonitoredVehicleJourney.DestinationName[0].value,
                            "arrivee": getTime(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime),
                            "arriveeReelle": getTime(train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime),
                            "status": train.MonitoredVehicleJourney.MonitoredCall.ArrivalStatus,
                            "difference": timeDiff(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime, train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
                        })
                    }
                } else {
                    if (train.MonitoredVehicleJourney.LineRef.value == "STIF:Line::C01747:") {
                        autreTrain.push({
                            "id": train.MonitoredVehicleJourney.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
                            "ligne": "TER Grand Est",
                            "destination": train.MonitoredVehicleJourney.DestinationName[0].value,
                            "arrivee": getTime(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime),
                            "arriveeReelle": getTime(train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime),
                            "status": train.MonitoredVehicleJourney.MonitoredCall.ArrivalStatus,
                            "difference": timeDiff(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime, train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
                        })
                    }
                    if (train.MonitoredVehicleJourney.LineRef.value == "STIF:Line::C01730:") {
                        autreTrain.push({
                            "id": train.MonitoredVehicleJourney.FramedVehicleJourneyRef.DatedVehicleJourneyRef,
                            "ligne": "Ligne P",
                            "destination": train.MonitoredVehicleJourney.DestinationName[0].value,
                            "arrivee": getTime(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime),
                            "arriveeReelle": getTime(train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime),
                            "status": train.MonitoredVehicleJourney.MonitoredCall.ArrivalStatus,
                            "difference": timeDiff(train.MonitoredVehicleJourney.MonitoredCall.AimedArrivalTime, train.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime)
                        })
                    }
                }
            })

            console.log("Train passé : " + trainPassé.length)
            trainPassé.forEach(train => {
                console.log(train)
                if (train.status != 'onTime') {
                    nonNormal.push(train)
                }
            })
            console.log("\n ---- \n")
            console.log("Train futur : " + trainFutur.length)
            trainFutur.forEach(train => {
                console.log(train)
                if (train.status != 'onTime') {
                    nonNormal.push(train)
                }
            })
            console.log("\n ---- \n")
            console.log("Autre Train : " + autreTrain.length)
            autreTrain.forEach(train => {
            })
            console.log("\n ---- \n")
            console.log("Train Non Normal: " + nonNormal.length)
            nonNormal.forEach(train => {
                console.log(train)
            })

            writeToFile({ trains: trainPassé }, "train_")
            if (nonNormal.length > 0) {
                writeToFile({ trains: nonNormal }, "weird_")
            }
        }).catch((error) => {
            var logDate = new Date()
            console.log(logDate + " " + error)
        });

});

// function creating a file with curent date and time in the name and writing the content of the array in it
function writeToFile(array, start) {
    var date = new Date();
    var fileName = start + date.getFullYear() + "-" + addZero(date.getMonth() + 1) + "-" + addZero(date.getDate()) + "_" + addZero(date.getHours()) + "-" + addZero(date.getMinutes()) + "-" + addZero(date.getSeconds()) + ".json";
    fs.writeFile
        (fileName
            , JSON.stringify(array)
            , function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
}

function addZero(i) {
    if (i < 10) { i = "0" + i }
    return i;
}

function getTime(date1) {
    var time = new Date(date1);
    time.setTime(time.getTime() + 3600);
    return addZero(time.getHours()) + ":" + addZero(time.getMinutes()) + ":" + addZero(time.getSeconds())
}

// function calculating the time between two dates in minutes and seconds
function timeDiff(date2, date1) {
    var diff = Date.parse(date1) - Date.parse(date2);
    var minutes = Math.floor(diff / 1000 / 60);
    var seconds = Math.floor(diff / 1000) - (minutes * 60);
    return ((minutes > 0) ? minutes + " minutes et " : "") + (diff < 0 ? 60 - seconds : seconds) + " secondes" + (diff < 0 ? " d'avance" : " de retard");
}
