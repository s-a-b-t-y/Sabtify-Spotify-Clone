async function getSongs() {
    let a = await fetch("http://127.0.0.1:3000/Library/songs/");
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    let songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.innerText.split("\\").pop());
        }
    }
    return songs;
}

async function main() {
    // Code to list the song
    let songs = await getSongs();

    // Code for showing all the song in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    for (const song of songs) {
        let decoded = decodeURIComponent(song);

        // Split into name and artist
        let parts = decoded.replace(".mp3", "").split("-");
        let songName = parts[0]?.trim();
        let artist = parts[1]?.trim() || "Unknown";

        songUL.innerHTML += 
    `<li>
        <img class="invert" src="Library/img/music.svg" alt="music">

        <div class="info">
            <div>${songName}</div>
            <div>${artist}</div>
        </div>

        <div class="playNow">
            <img class="invert" src="Library/img/play.svg" alt="play">
            <span>Play Now</span>
        </div>
    </li>`;
    }

    

    audio.addEventListener("loadeddata", () => {
        console.log(audio.duration, audio.currentSrc, audio.currentTime);
    })
}

main();