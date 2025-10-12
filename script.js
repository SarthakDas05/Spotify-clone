async function getSongs(folder) {
    try {
        // Fetches the list of .mp3 files from a specific album folder.
        let response = await fetch(`/Spotify-clone/songs/${folder}/`);
        if (!response.ok) return [];
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        let songs = [];
        for (const element of as) {
            if (element.href.endsWith(".mp3")) {
                // Pushes just the filename (e.g., "song.mp3") to the array
                songs.push(element.href.split("/").pop());
            }
        }
        return songs;
    } catch (error) {
        console.error("Could not get songs for folder:", folder, error);
        return [];
    }
}

async function displayAlbums() {
    try {
        // Fetches the main /songs/ directory to find all album folders.
        let response = await fetch('/Spotify-clone/songs/');
        let responseText = await response.text();
        let div = document.createElement("div");
        div.innerHTML = responseText;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".playlist-suggestion .cover ul");
        cardContainer.innerHTML = ""; // Clear any placeholder content

        for (const anchor of anchors) {
            let href = anchor.getAttribute('href');
            // Ensures we're only looking at links that are directories
            if (href && href.endsWith('/')) {
                let foldername = decodeURIComponent(href.slice(0, -1));
                
                try {
                    // Fetches the metadata for the current folder
                    let metaresponse = await fetch(`/Spotify-clone/songs/${foldername}/info.json`);
                    if (!metaresponse.ok) {
                        console.warn(`Missing info.json for '${foldername}'. Skipping.`);
                        continue;
                    }
                    let metadata = await metaresponse.json();
                    // Creates the album card HTML
                    cardContainer.innerHTML += `
                        <li data-folder="${foldername}">
                            <img src="/Spotify-clone/songs/${foldername}/cover.jpg" alt="Album Art">
                            <h3>${metadata.title}</h3>
                            <p>${metadata.description}</p>
                        </li>`;
                } catch (error) {
                    console.error(`Error processing folder '${foldername}':`, error);
                }
            }
        }
    } catch (error) {
        console.error("A critical error occurred while displaying albums.", error);
    }
}



async function main() {
    // --- SETUP ---
    var audio = new Audio();
    let currentFolder;
    let songs = [];

    // --- INITIALIZATION ---
    await displayAlbums();

    // --- EVENT LISTENERS ---

async function updatIcon(){
    let img1 = document.querySelector("#play")
    if(audio.paused){
        img1.src = "play.svg"
    }
    else{
            img1.src = "pause.svg";
    }
}
async function playpause() {
    
    document.querySelector('#play').addEventListener('click',(event)=>{
        let img1 = document.querySelector("#play")
        if(audio.paused){
            img1.src = "pause.svg";
            audio.play()
        }
        else{
            img1.src = "play.svg";
            audio.pause()
        }
    })
}



    // For clicking on an album card to load its songs
    document.querySelector(".playlist-suggestion .cover ul").addEventListener("click", async (event) => {
        let card = event.target.closest('li');
        if (card && card.dataset.folder) {
            currentFolder = card.dataset.folder;
            songs = await getSongs(currentFolder);
            let songUL = document.querySelector(".songlist ul");
            songUL.innerHTML = ""; // Clear the previous song list

            // Populate the song list in the left panel
            for (const song of songs) {
                let decodedSong = decodeURIComponent(song.replaceAll("%20", " ")).replace(".mp3", "");
                songUL.innerHTML += `
                    <li data-song="${song}">
                        <img class="invert" width="34" src="music.svg" alt="">
                        <div class="info">
                            <div>${decodedSong}</div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                        </div>
                    </li>`;
            }
            // Automatically play the first song from the album
            if (songs.length > 0) {
                audio.src = `/Spotify-clone/songs/${currentFolder}/${songs[0]}`;
                audio.play();
            }
        }
    });

    // For clicking on a specific song in the left-panel list
     document.querySelector(".songlist ul").addEventListener("click", (event) => {
        let songLi = event.target.closest('li');
        if(songLi && songLi.dataset.song){
            let filename = songLi.dataset.song;
            audio.src = `/Spotify-clone/songs/${currentFolder}/${filename}`;
            audio.play();
        }
    });

    // For updating the seekbar as the song plays
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            document.querySelector(".bar1 input").value = (audio.currentTime / audio.duration) * 100;
        }
    });

    // For seeking to a new time in the song
    document.querySelector(".bar1 input").addEventListener("change", (e) => {
        if (audio.duration) {
            audio.currentTime = (e.target.value / 100) * audio.duration;
        }
    });

    // For volume control
    document.querySelector('.queue input').addEventListener('change', (e) => {
        audio.volume = e.target.value / 100;
    });
    
    // For the Next and Previous buttons
    document.querySelector("#next").addEventListener("click", () => {
        if (!songs || songs.length === 0) return;
        let currentSongName = audio.src.split("/").pop();
        let currentIndex = songs.indexOf(currentSongName);
        let nextIndex = (currentIndex + 1) % songs.length; 
        audio.src = `/Spotify-clone/songs/${currentFolder}/${songs[nextIndex]}`;
        audio.play();
        updatIcon();
    });

    document.querySelector("#prev").addEventListener("click", () => {
        if (!songs || songs.length === 0) return;
        let currentSongName = decodeURIComponent(audio.src.split("/").pop());
        let currentIndex = songs.indexOf(currentSongName);
        let prevIndex = (currentIndex - 1 + songs.length) % songs.length;
        audio.src = `/Spotify-clone/songs/${currentFolder}/${songs[prevIndex]}`;
        audio.play();
        updatIcon();
    });

    await playpause();
    
}


main();