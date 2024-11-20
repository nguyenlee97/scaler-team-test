import * as fs from "fs";
import * as readline from "readline";

type RoomInfo = {
  roomType: string;
  sleepGuests: number;
  numberOfRooms: number;
  price: number;
};

interface RoomData {
  roomInfo: RoomInfo[];
}

const readRoomData = (): RoomData => {
  return JSON.parse(fs.readFileSync("roomInfo.json", "utf-8"));
};

function findReservationOption(guests: number): boolean {
  const roomData = readRoomData();
  const roomInfo = roomData.roomInfo;
  const numRoomType = roomInfo.length;
  //We initialize an array with the length of guests number + 1
  //dp[i] equal the cheapest price at the number of guests = i
  //The result we looking for will be stored in dp[guests]
  const dp = Array(guests + 1).fill(Infinity);
  //We use roomTracking array for tracking the room combination
  const roomTracking = Array(guests + 1)
    .fill(null)
    .map(() => Array(numRoomType).fill(0));

  //At 0 guests we dont cost any
  dp[0] = 0;

  for (let i = 1; i <= guests; i++) {
    for (let j = 0; j < numRoomType; j++) {
      const { sleepGuests, numberOfRooms, price } = roomInfo[j];

      if (
        //The number of guests of dp array must be equal or larger than sleepGuests of roomType
        i >= sleepGuests &&
        // Only update if the new assignment make the price lower
        dp[i - sleepGuests] + price < dp[i] &&
        //Only assign if there is available room of roomType
        roomTracking[i - sleepGuests][j] < numberOfRooms
      ) {
        //Update the new cheapest price at number of guests = i
        dp[i] = dp[i - sleepGuests] + price;
        //Store the added room into roomTracking
        roomTracking[i] = [...roomTracking[i - sleepGuests]];
        roomTracking[i][j]++;
      }
    }
  }

  if (dp[guests] === Infinity) {
    return false;
  } else {
    let output = "";

    for (let i = 0; i < numRoomType; i++) {
      const { roomType } = roomInfo[i];
      output += `${roomType} `.repeat(roomTracking[guests][i]);
    }

    console.log(`${output.trim()} - $${dp[guests]}`);

    return true;
  }
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
