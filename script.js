
async function getSongs() {
    let a = await fetch("http://127.0.0.1:3000/Library/songs/");
    let response = await a.text();
    console.log(response);

    let element = document.createElement("div");
    element.innerHTML = response;
    let as = element.getElementsByTagName("a");
    console.log(as);

    let songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href)
        }
    }
    return songs;
}


async function main() {
    // Get the list of the song collection
    

    // playing the first song
    var audio = new Audio(songs[0]);
    // audio.play(); //* currently off feels uncomfortable...

    audio.addEventListener("loadeddata", () => {
        let duration = audio.duration;
        console.log(audio.duration, audio.currentSrc, audio.currentTime);
    })
}

main();