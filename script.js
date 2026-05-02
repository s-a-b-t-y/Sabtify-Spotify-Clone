async function getSongs() {
    const res = await fetch("./Library/songs/songs.json");
    if (!res.ok) {
        throw new Error("Failed to load songs.json");
    }
    return await res.json();
}

async function main() {
    // Code to list the song
    let songs = await getSongs();

    let audio = new Audio();

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
        <img class="invert" src="./Library/img/music.svg" alt="music">

        <div class="info">
            <div>${songName}</div>
            <div>${artist}</div>
        </div>

        <div class="playNow">
            <img class="invert" src="./Library/img/play.svg" alt="play">
            <span>Play Now</span>
        </div>
    </li>`;
    }

    

    audio.addEventListener("loadeddata", () => {
        console.log(audio.duration, audio.currentSrc, audio.currentTime);
    })
}

main();