import * as fs from "fs";
import * as readline from "readline";

enum RoomType {
  Single = "Single",
  Double = "Double",
  Family = "Family",
}

type RoomInfo = {
  roomType: RoomType;
  sleepGuests: number;
  numberOfRooms: number;
  price: number;
};

interface RoomData {
  roomInfo: RoomInfo[];
}

const maxLength = 1000000;

const readRoomData = (): RoomData => {
  return JSON.parse(fs.readFileSync("roomInfo.json", "utf-8"));
};

// Sort roomInfo by price per sleepGuests
const sortRoomInfo = (roomInfo: RoomInfo[]) => {
  return roomInfo.sort((a, b) => {
    const pricePerGuestA = a.price / a.sleepGuests;
    const pricePerGuestB = b.price / b.sleepGuests;

    if (pricePerGuestA === pricePerGuestB) {
      // Sort by sleepGuests in descending order if pricePerGuest is equal
      return b.sleepGuests - a.sleepGuests;
    }
    // Sort by price per guest in ascending order
    return pricePerGuestA - pricePerGuestB;
  });
};

//When there are only 4 guests left, we find the cheapest available combination
//There are only 4 combinations in this case: 1 Family/2 Double/2 Single 1 Double/4 Single
//This will prevent case when the Single room is cheapest, but 2 Single 1 Double > 1 Family.
const bestCombinationOf4 = (
  roomInfo: RoomInfo[],
  currentCombination: Record<string, number>
) => {
  const possibleCombination: any = [];

  const familyRoomInfo = roomInfo.find((r) => r.roomType === RoomType.Family);
  const doubleRoomInfo = roomInfo.find((r) => r.roomType === RoomType.Double);
  const singleRoomInfo = roomInfo.find((r) => r.roomType === RoomType.Single);

  //1 Family Room check
  if (
    familyRoomInfo &&
    familyRoomInfo.numberOfRooms - currentCombination[RoomType.Family] >= 1
  ) {
    const obj = {
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
  if (
    doubleRoomInfo &&
    singleRoomInfo &&
    doubleRoomInfo.numberOfRooms - currentCombination[RoomType.Double] >= 1 &&
    singleRoomInfo.numberOfRooms - currentCombination[RoomType.Single] >= 2
  ) {
    const obj = {
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
  if (
    doubleRoomInfo &&
    doubleRoomInfo.numberOfRooms - currentCombination[RoomType.Double] >= 2
  ) {
    const obj = {
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
  if (
    singleRoomInfo &&
    singleRoomInfo.numberOfRooms - currentCombination[RoomType.Single] >= 4
  ) {
    const obj = {
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
    possibleCombination.sort((a: any, b: any) => a.price - b.price);
    return possibleCombination[0];
  } else return null;
};

function findReservationOption(guests: number): boolean {
  const roomData = readRoomData();
  //Sort the room by price per guest, so the backtracking would always take the cheapest option first
  roomData.roomInfo = sortRoomInfo(roomData.roomInfo);
  //Flag for solution found
  let foundSolution = false;
  // Initialize the currentCombination object with all room types set to 0
  const initialCombination: Record<string, number> = {};
  for (const room of roomData.roomInfo) {
    initialCombination[room.roomType] = 0;
  }

  function backtrack(
    currentCombination: Record<string, number>,
    remainingGuests: number
  ) {
    //When remainingGuest is 4, we find the best combination of 4 using 
    if (remainingGuests === 4) {
      const finalCombination = bestCombinationOf4(
        roomData.roomInfo,
        currentCombination
      );
      if (finalCombination) {
        for (const room of finalCombination.combination) {
          currentCombination[room.roomType] =
            (currentCombination[room.roomType] || 0) + room.numberOfRooms;
        }
        remainingGuests = 0;
      }
    }

    // Terminate early if a solution has been found
    if (foundSolution) return;

    if (remainingGuests === 0) {
      // Set the flag to true, the backtracking will be terminated and the result will be shown immediately
      foundSolution = true;
      const totalPrice = Object.entries(currentCombination).reduce(
        (total, [roomType, count]) => {
          const room = roomData.roomInfo.find((r) => r.roomType === roomType);
          return total + (room ? room.price * count : 0);
        },
        0
      );
      let output = "";
      for (const [roomType, count] of Object.entries(currentCombination)) {
        for (let i = 0; i < count; i++) {
          const roomOutput = `${roomType} `;
          // Check if adding the next room type exceeds maxLength
          if (output.length + roomOutput.length > maxLength) {
            console.log(`${output.trim()}`);
            // Reset the output string
            output = "";
          }
          output += roomOutput;
        }
      }

      // Log any remaining output after the loop
      if (output.length > 0) {
        console.log(`${output.trim()} - $${totalPrice}`);
      }
      return;
    }

    for (let i = 0; i < roomData.roomInfo.length; i++) {
      const room = roomData.roomInfo[i];
      if (
        currentCombination[room.roomType] < room.numberOfRooms &&
        remainingGuests >= room.sleepGuests
      ) {
        //The max number of room can be added to achieve the cheapest price
        //Minus 4 in case the cheapest type of room is Single.
        //This way we can make sure we won't miss the combination where there is at least one Family room
        const maxAddedRoom =
          Math.floor((remainingGuests - 4) / room.sleepGuests) < 1
            ? 1
            : Math.floor((remainingGuests - 4) / room.sleepGuests);

        //Find the possible added room, the number of room cant be more than the current number of available room
        const possibleAddedRoom =
          maxAddedRoom < room.numberOfRooms - currentCombination[room.roomType]
            ? maxAddedRoom
            : room.numberOfRooms - currentCombination[room.roomType];

        currentCombination[room.roomType] =
          (currentCombination[room.roomType] || 0) + possibleAddedRoom;

        backtrack(
          currentCombination,
          remainingGuests - room.sleepGuests * possibleAddedRoom
        );

        currentCombination[room.roomType] -= possibleAddedRoom;
      }
    }
  }

  backtrack(initialCombination, guests);
  return foundSolution;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const initialValidation = (guests: number) => {
  if (guests === 0) return false;

  const roomData = readRoomData();
  roomData.roomInfo.forEach((roomInfo) => {
    guests -= roomInfo.numberOfRooms * roomInfo.sleepGuests;
  });

  if (guests > 0) return false;
  return true;
};

const mainMenu = () => {
  console.log("\nChoose an option:");
  console.log("1. Book room for guests");
  console.log("2. Exit");
  rl.question("Enter your choice (1 or 2): ", (choice) => {
    if (choice === "1") {
      rl.question("Enter the number of guests: ", (guests) => {
        if (!initialValidation(parseInt(guests, 10))) {
          console.log("No option");
        } else {
          if (!findReservationOption(parseInt(guests, 10))) {
            console.log("No option");
          }
        }

        // Return to main menu after booking
        mainMenu();
      });
    } else if (choice === "2") {
      console.log("Exiting...");
      rl.close();
    } else {
      console.log("Invalid option. Please try again.");
      mainMenu();
    }
  });
};

// Start the menu
mainMenu();
