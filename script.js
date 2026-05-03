async function getSongs() {
    const res = await fetch("./Library/songs/songs.json");
    if (!res.ok) {
        throw new Error("Failed to load songs.json");
    }
    return await res.json();
}

let audio = new Audio();

const playMusic = (track) => {
    audio.src = "./Library/songs/" + track;
    audio.play();
    play.src = "./Library/img/pause.svg"  // to change the icon when the song is played.

    document.querySelector(".songInfo").innerHTML = track;
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
}

async function main() {
    let currentSong;

    // Code to list the song
    let songs = await getSongs();

    // let audio = new Audio();

    // Code for showing all the song in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    for (const song of songs) {
        let decoded = decodeURIComponent(song);

        // Split into name and artist
        let parts = decoded.replace(".mp3", "").split("-");
        let songName = parts[0]?.trim();
        let artist = parts[1]?.trim() || "Unknown";

        songUL.innerHTML +=
            `<li data-file="${song}">
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

    //! attach an event listener  to each song
    Array.from(document.querySelector(".songList").getElementsByTagName('li')).forEach(e => {
        e.addEventListener("click", () => {
            let file = e.getAttribute("data-file");
            playMusic(file);
        });
    });

    //! attach an event listener to play next & previous song
    play.addEventListener("click", () => {
        if(audio.paused){
            audio.play();
            play.src = "./Library/img/pause.svg";
        }else{
            audio.pause();
            play.src = "./Library/img/play.svg"
        }
    })

    // audio.addEventListener("loadeddata", () => {
    //     console.log(audio.duration, audio.currentSrc, audio.currentTime);
    // })
}

main();