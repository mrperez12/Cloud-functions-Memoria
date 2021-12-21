/* eslint-disable max-len */
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

// eslint-disable-next-line max-len
exports.onDataAdded = functions.database.ref("/users/{userId}/Ponds/{pondName}/data/{dataId}")
    .onCreate((snapshot, context) => {
      const temperature = parseFloat(snapshot.child("temperature").val());
      const density = parseFloat(snapshot.child("den").val());
      const lux = parseFloat(snapshot.child("lux").val());
      const ph = parseFloat(snapshot.child("ph").val());
      const Agi = parseFloat(snapshot.child("agi").val());
      const WaterLvl = parseFloat(snapshot.child("water").val());
      const userId = context.params.userId;
      const pond = context.params.pondName;

      // eslint-disable-next-line max-len
      return admin.database().ref("/users/"+userId+"/Ponds/"+pond+"/Configuration").once("value").then((response)=>{
        const minTemperature = parseFloat(response.child("minTemp").val());
        const maxTemperature = parseFloat(response.child("maxTemp").val());
        const minDen = parseFloat(response.child("minDen").val());
        const maxDen = parseFloat(response.child("maxDen").val());
        const minLux = parseFloat(response.child("minLux").val());
        const maxLux = parseFloat(response.child("maxLux").val());
        const minPh = parseFloat(response.child("minPh").val());
        const maxPh = parseFloat(response.child("maxPh").val());
        const minAgi = parseFloat(response.child("minAgi").val());
        const maxAgi = parseFloat(response.child("maxAgi").val());
        const minWater = -1.0;
        const maxWater = 1.0;

        let errorTemp = false;
        let errorDen = false;
        let errorLux = false;
        let errorPh = false;
        let errorAgi = false;
        let errorWater = false;

        // check temperature
        if (minTemperature > temperature) {
          console.log("low temperature");
          errorTemp = true;
        } else {
          if (maxTemperature < temperature) {
            console.log("high temperature");
            errorTemp = true;
          }
        }

        // check ph
        if (minPh > ph) {
          console.log("low Ph");
          errorPh = true;
        } else {
          if (maxPh < ph) {
            console.log("high Ph");
            errorPh = true;
          }
        }

        // check density
        if (minDen > density) {
          console.log("low Density");
          errorDen = true;
        } else {
          if (maxDen < density) {
            console.log("high Density");
            errorDen = true;
          }
        }

        // check lux
        if (minLux > lux) {
          console.log("low luminosity");
          errorLux = true;
        } else {
          if (maxLux < lux) {
            console.log("high luminosity");
            errorLux = true;
          }
        }

        // check agitation
        if (minAgi > Agi) {
          console.log("low Agitation");
          errorAgi = true;
        } else {
          if (maxAgi < Agi) {
            console.log("high Agitation");
            errorAgi = true;
          }
        }

        // check water lvl
        if (minWater == WaterLvl) {
          console.log("Water lvl below minimum");
          errorWater = true;
        } else {
          if (maxWater == WaterLvl) {
            console.log("Maximum water lvl exceeded");
            errorWater = true;
          }
        }

        if (errorTemp || errorLux || errorPh || errorDen || errorAgi || errorWater) {
          // create payload message based on errors
          return admin.database().ref("/users/"+userId+"/user-info").once("value").then((snap)=>{
            const token = snap.child("messaging_token").val();
            const messageTitle = "Alerta! Problemas en " + pond;
            let messageBody = "Valores fuera de rango para:\n";
            if (errorTemp == true) {
              messageBody += "-Temperatura\n";
            }
            if (errorLux == true) {
              messageBody += "-Luminosidad\n";
            }
            if (errorPh == true) {
              messageBody += "-Ph\n";
            }
            if (errorDen == true) {
              messageBody += "-Densidad del agua\n";
            }
            if (errorAgi == true) {
              messageBody += "-Agitacion del agua\n";
            }
            if (errorWater == true) {
              messageBody += "-Nivel del agua\n";
            }
            const payload = {
              "notification": {
                "title": messageTitle,
                "body": messageBody,
                "sound": "default",
              },
            };
            return admin.messaging().sendToDevice(token, payload).then(function(response) {
              console.log("Successfully sent message:", response);
              return admin.database().ref("/users/"+userId+"/Ponds/"+pond+"/Information/status").set("Error");
            }).catch(function(error) {
              console.log("Error sending message:", error);
            });
          });
        } else {
          return admin.database().ref("/users/"+userId+"/Ponds/"+pond+"/Information/status").set("Ok");
        }
      });
    });
