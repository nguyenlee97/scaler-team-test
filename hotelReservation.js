"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var readline = require("readline");
var readRoomData = function () {
    return JSON.parse(fs.readFileSync("roomInfo.json", "utf-8"));
};
function findReservationOption(guests) {
    var roomData = readRoomData();
    var roomInfo = roomData.roomInfo;
    var numRoomType = roomInfo.length;
    //We initialize an array with the length of guests number + 1
    //dp[i] equal the cheapest price at the number of guests = i
    //The result we looking for will be stored in dp[guests]
    var dp = Array(guests + 1).fill(Infinity);
    //We use roomTracking array for tracking the room combination
    var roomTracking = Array(guests + 1)
        .fill(null)
        .map(function () { return Array(numRoomType).fill(0); });
    //At 0 guests we dont cost any
    dp[0] = 0;
    for (var i = 1; i <= guests; i++) {
        for (var j = 0; j < numRoomType; j++) {
            var _a = roomInfo[j], sleepGuests = _a.sleepGuests, numberOfRooms = _a.numberOfRooms, price = _a.price;
            if (
            //The number of guests of dp array must be equal or larger than sleepGuests of roomType
            i >= sleepGuests &&
                // Only update if the new assignment make the price lower
                dp[i - sleepGuests] + price < dp[i] &&
                //Only assign if there is available room of roomType
                roomTracking[i - sleepGuests][j] < numberOfRooms) {
                //Update the new cheapest price at number of guests = i
                dp[i] = dp[i - sleepGuests] + price;
                //Store the added room into roomTracking
                roomTracking[i] = __spreadArray([], roomTracking[i - sleepGuests], true);
                roomTracking[i][j]++;
            }
        }
    }
    if (dp[guests] === Infinity) {
        return false;
    }
    else {
        var output = "";
        for (var i = 0; i < numRoomType; i++) {
            var roomType = roomInfo[i].roomType;
            output += "".concat(roomType, " ").repeat(roomTracking[guests][i]);
        }
        console.log("".concat(output.trim(), " - $").concat(dp[guests]));
        console.log(dp[guests])
        return true;
    }
}
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
var initialValidation = function (guests) {
    if (guests === 0)
        return false;
    var roomData = readRoomData();
    roomData.roomInfo.forEach(function (roomInfo) {
        guests -= roomInfo.numberOfRooms * roomInfo.sleepGuests;
    });
    if (guests > 0)
        return false;
    return true;
};
var mainMenu = function () {
    console.log("\nChoose an option:");
    console.log("1. Book room for guests");
    console.log("2. Exit");
    rl.question("Enter your choice (1 or 2): ", function (choice) {
        if (choice === "1") {
            rl.question("Enter the number of guests: ", function (guests) {
                if (!initialValidation(parseInt(guests, 10))) {
                    console.log("No option");
                }
                else {
                    if (!findReservationOption(parseInt(guests, 10))) {
                        console.log("No option");
                    }
                }
                // Return to main menu after booking
                mainMenu();
            });
        }
        else if (choice === "2") {
            console.log("Exiting...");
            rl.close();
        }
        else {
            console.log("Invalid option. Please try again.");
            mainMenu();
        }
    });
};
// Start the menu
mainMenu();
