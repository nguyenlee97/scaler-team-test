"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var readline = require("readline");
var RoomType;
(function (RoomType) {
    RoomType["Single"] = "Single";
    RoomType["Double"] = "Double";
    RoomType["Family"] = "Family";
})(RoomType || (RoomType = {}));
var maxLength = 1000000;
var readRoomData = function () {
    return JSON.parse(fs.readFileSync("roomInfo.json", "utf-8"));
};
// Sort roomInfo by price per sleepGuests
var sortRoomInfo = function (roomInfo) {
    return roomInfo.sort(function (a, b) {
        var pricePerGuestA = a.price / a.sleepGuests;
        var pricePerGuestB = b.price / b.sleepGuests;
        if (pricePerGuestA === pricePerGuestB) {
            // Sort by sleepGuests in descending order if pricePerGuest is equal
            return b.sleepGuests - a.sleepGuests;
        }
        // Sort by price per guest in ascending order
        return pricePerGuestA - pricePerGuestB;
    });
};
var bestCombinationOf4 = function (roomInfo, currentCombination) {
    var possibleCombination = [];
    var familyRoomInfo = roomInfo.find(function (r) { return r.roomType === RoomType.Family; });
    var doubleRoomInfo = roomInfo.find(function (r) { return r.roomType === RoomType.Double; });
    var singleRoomInfo = roomInfo.find(function (r) { return r.roomType === RoomType.Single; });
    //1 Family Room check
    if (familyRoomInfo &&
        familyRoomInfo.numberOfRooms - currentCombination[RoomType.Family] >= 1) {
        var obj = {
            combination: [
                {
                    roomType: RoomType.Family,
                    numberOfRooms: 1,
                },
            ],
            price: familyRoomInfo.price,
        };
        possibleCombination.push(obj);
    }
    //1 Double Room 2 Single Room check
    if (doubleRoomInfo &&
        singleRoomInfo &&
        doubleRoomInfo.numberOfRooms - currentCombination[RoomType.Double] >= 1 &&
        singleRoomInfo.numberOfRooms - currentCombination[RoomType.Single] >= 2) {
        var obj = {
            combination: [
                {
                    roomType: RoomType.Double,
                    numberOfRooms: 1,
                },
                {
                    roomType: RoomType.Single,
                    numberOfRooms: 2,
                },
            ],
            price: doubleRoomInfo.price + singleRoomInfo.price * 2,
        };
        possibleCombination.push(obj);
    }
    //2 Double Room check
    if (doubleRoomInfo &&
        doubleRoomInfo.numberOfRooms - currentCombination[RoomType.Double] >= 2) {
        var obj = {
            combination: [
                {
                    roomType: RoomType.Double,
                    numberOfRooms: 2,
                },
            ],
            price: doubleRoomInfo.price * 2,
        };
        possibleCombination.push(obj);
    }
    //4 Single Room check
    if (singleRoomInfo &&
        singleRoomInfo.numberOfRooms - currentCombination[RoomType.Single] >= 4) {
        var obj = {
            combination: [
                {
                    roomType: RoomType.Single,
                    numberOfRooms: 4,
                },
            ],
            price: singleRoomInfo.price * 4,
        };
        possibleCombination.push(obj);
    }
    if (possibleCombination.length > 0) {
        possibleCombination.sort(function (a, b) { return a.price - b.price; });
        return possibleCombination[0];
    }
    else
        return null;
};
function findReservationOption(guests) {
    var roomData = readRoomData();
    //Sort the room by price per guest, so the backtracking would always take the cheapest option first
    roomData.roomInfo = sortRoomInfo(roomData.roomInfo);
    //Flag for solution found
    var foundSolution = false;
    // Initialize the currentCombination object with all room types set to 0
    var initialCombination = {};
    for (var _i = 0, _a = roomData.roomInfo; _i < _a.length; _i++) {
        var room = _a[_i];
        initialCombination[room.roomType] = 0;
    }
    function backtrack(currentCombination, remainingGuests) {
        if (remainingGuests === 4) {
            var finalCombination = bestCombinationOf4(roomData.roomInfo, currentCombination);
            if (finalCombination) {
                for (var _i = 0, _a = finalCombination.combination; _i < _a.length; _i++) {
                    var room = _a[_i];
                    currentCombination[room.roomType] =
                        (currentCombination[room.roomType] || 0) + room.numberOfRooms;
                }
                remainingGuests = 0;
            }
        }
        // Terminate early if a solution has been found
        if (foundSolution)
            return;
        if (remainingGuests === 0) {
            // Set the flag to true, the backtracking will be terminated and the result will be shownd immediately
            foundSolution = true;
            var totalPrice = Object.entries(currentCombination).reduce(function (total, _a) {
                var roomType = _a[0], count = _a[1];
                var room = roomData.roomInfo.find(function (r) { return r.roomType === roomType; });
                return total + (room ? room.price * count : 0);
            }, 0);
            var output = "";
            for (var _b = 0, _c = Object.entries(currentCombination); _b < _c.length; _b++) {
                var _d = _c[_b], roomType = _d[0], count = _d[1];
                for (var i = 0; i < count; i++) {
                    var roomOutput = "".concat(roomType, " ");
                    // Check if adding the next room type exceeds maxLength
                    if (output.length + roomOutput.length > maxLength) {
                        console.log("".concat(output.trim()));
                        // Reset the output string
                        output = "";
                    }
                    output += roomOutput;
                }
            }
            // Log any remaining output after the loop
            if (output.length > 0) {
                console.log("".concat(output.trim(), " - $").concat(totalPrice));
            }
            return;
        }
        for (var i = 0; i < roomData.roomInfo.length; i++) {
            var room = roomData.roomInfo[i];
            if (currentCombination[room.roomType] < room.numberOfRooms &&
                remainingGuests >= room.sleepGuests) {
                //The max number of room can be added to achieve the cheapest price
                //Minus 4 in case the cheapest type of room is Single.
                //This way we can make sure we won't miss the combination where there is at least one Family room
                var maxAddedRoom = Math.floor((remainingGuests - 4) / room.sleepGuests) < 1
                    ? 1
                    : Math.floor((remainingGuests - 4) / room.sleepGuests);
                //Find the possible added room, the number of room cant be more than the current number of available room
                var possibleAddedRoom = maxAddedRoom < room.numberOfRooms - currentCombination[room.roomType]
                    ? maxAddedRoom
                    : room.numberOfRooms - currentCombination[room.roomType];
                currentCombination[room.roomType] =
                    (currentCombination[room.roomType] || 0) + possibleAddedRoom;
                backtrack(currentCombination, remainingGuests - room.sleepGuests * possibleAddedRoom);
                currentCombination[room.roomType] -= possibleAddedRoom;
            }
        }
    }
    backtrack(initialCombination, guests);
    return foundSolution;
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
