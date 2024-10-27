// lobby.js

let timer = 600; // 10 minutes in seconds
const timerDisplay = document.getElementById("timer");

function updateTimer() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    timer--;

    if (timer < 0) {
        timer = 600;
    }
}

setInterval(updateTimer, 1000);

function withdraw() {
    let walletAmount = parseInt(document.getElementById("walletAmount").innerText);
    if (timer <= 0) {
        walletAmount += 10;
        document.getElementById("walletAmount").innerText = walletAmount;
        timer = 600;
    } else {
        alert("You can only withdraw every 10 minutes!");
    }
}

function joinRoom(roomNumber) {
    alert(`Joining Room ${roomNumber}`);
}

function joinVipRoom() {
    alert("Requesting VIP Room Access...");
}
