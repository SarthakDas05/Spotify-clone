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
                             <div class="card-play"><img src="play.svg" class="card-play-icon" alt=""></div>
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
    let isSeeking = false;
    let currentSongIndex = 0;
    const hamburger = document.querySelector("#hamburger");
    const closeButton = document.querySelector("#close");
    const leftPanel = document.querySelector(".left");
    // --- INITIALIZATION ---
    await displayAlbums();
    mutebtn();
    // --- EVENT LISTENERS ---

    async function playSong(filename) {
        // Set the audio source
        audio.src = `/Spotify-clone/songs/${currentFolder}/${filename}`;
        await audio.play(); // Use await to ensure play starts

        // Update the player bar info
        let songName = decodeURIComponent(filename).replaceAll("%20", " ").replace(".mp3", "");
        document.querySelector("#song-title").innerHTML = songName;
        document.querySelector("#song-artist").innerHTML = "Artist"; // We'll talk about this!
        document.querySelector("#player-cover-img").src = `/Spotify-clone/songs/${currentFolder}/cover.jpg`;

        // Update the play/pause icon
        await updateIcon(); // Call your fixed function name

        // IMPORTANT: Update our new index variable
        currentSongIndex = songs.indexOf(filename);
    }

    function formatTime(totalseconds) {
        let minutes = Math.floor(totalseconds / 60);
        let seconds = Math.floor(totalseconds % 60);
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        if (minutes < 10) {
            minutes = "0" + minutes
        }
        return minutes + ":" + seconds;
    }

    audio.addEventListener('loadedmetadata', () => {
        let totalDurationSpan = document.querySelector("#totalDuration");
        totalDurationSpan.innerHTML = formatTime(audio.duration);
    })


    async function updateIcon() {
        let img1 = document.querySelector("#play")
        if (audio.paused) {
            img1.src = "play.svg"
        }
        else {
            img1.src = "pause.svg";
        }
    }
    function playpause() {

        document.querySelector('#play').addEventListener('click', (event) => {
            let img1 = document.querySelector("#play")
            if (audio.paused) {
                img1.src = "pause.svg";
                audio.play()
            }
            else {
                img1.src = "play.svg";
                audio.pause()
            }
        })
    }

    function mutebtn(){
        document.querySelector("#mute").addEventListener('click',()=>{
            let img1 =document.querySelector("#mute");
            if(audio.muted){
                img1.src = "volume.svg"
                audio.muted = false;  
            }
            else{
                audio.muted = true;
                img1.src = "mute.svg"
            }
        })
    }

    // For clicking on an album card to load its songs
    document.querySelector(".playlist-suggestion .cover ul").addEventListener("click", async (event) => {
        let card = event.target.closest('li');
        let playButtonClicked = event.target.closest('.card-play');
        if (card && card.dataset.folder) {
            if (playButtonClicked) {
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
                playSong(songs[0]); // <-- Look how clean!
            }
        }
        }
    });

    // For clicking on a specific song in the left-panel list
    document.querySelector(".songlist ul").addEventListener("click", (event) => {
        let songLi = event.target.closest('li');
        if (songLi && songLi.dataset.song) {
            let filename = songLi.dataset.song;
            playSong(filename); // <-- So much cleaner!
        }
    });

    audio.addEventListener("timeupdate", () => {
        console.log("Time update event fired!");
        if (audio.duration) {
            document.querySelector(".bar1 input").value = (audio.currentTime / audio.duration) * 100;
            document.querySelector("#currentTime").innerHTML = formatTime(audio.currentTime);
        }
    });

    document.querySelector(".bar1 input").addEventListener("input", (e) => {
        if (audio.duration) {
            // Tell the audio to jump to the new time
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
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playSong(songs[currentSongIndex]);
    });

    document.querySelector("#prev").addEventListener("click", () => {
        if (!songs || songs.length === 0) return;
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playSong(songs[currentSongIndex]);
    });

     
    if(hamburger && leftPanel){
        hamburger.addEventListener('click',()=>{
            leftPanel.classList.add('left-panel-open');
        })
    };
    if(closeButton && leftPanel){
        closeButton.addEventListener('click',()=>{
            leftPanel.classList.remove('left-panel-open');
        })
    };
        playpause();
    }



main();