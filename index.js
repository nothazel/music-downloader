const readline = require('readline');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const YouTube = require('youtube-sr').default;
const SpotifyWebApi = require('spotify-web-api-node');
const ProgressBar = require('cli-progress');
require('dotenv').config({ path: './keys.env' });

let color;
let rl;

(async () => {
    try {
        const chalkModule = await import('chalk');
        color = chalkModule.default;
    } catch (error) {
        console.error('Error loading chalk:', error);
    }

    console.log(color.yellow.bold.inverse('Enter "yt <keywords/link>" or "spotify <playlist>" to search/download from YouTube/Spotify or "exit" to quit.'));

    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const commandHandlers = {
        'yt': handleYTCommand,
        'spotify': handleSpotifyCommand,
        'exit': handleExitCommand
    };

    rl.on('line', async (input) => {
        const args = input.trim().split(' ');
        const command = args[0];

        const handler = commandHandlers[command];
        if (handler) {
            await handler(args.slice(1));
        } else {
            console.log(color.red.inverse('Invalid command. Use "yt <keywords/link>", "spotify <playlist>", or "exit" to quit.'));
        }
    });

    const downloadedFolderPath = './downloaded';
    if (!fs.existsSync(downloadedFolderPath)) {
        fs.mkdirSync(downloadedFolderPath);
        console.log(color.green.inverse('Created /downloaded folder.'));
    }
})();

// Important function handles all downloads (YT/Spotify)
async function dL(videoUrl) {
    const outputDir = './downloaded';
    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const sanitizedTitle = title.replace(/[\\/:"*?<>|]/g, '');

        const rawName = `${sanitizedTitle}.mp3`;
        const fileName = path.parse(rawName).name;
        const filePath = path.join(outputDir, rawName);

        const foundLocally = await findMusicLocally(rawName, outputDir);
        if (foundLocally) {
            console.log(color.cyan.bold(`The file "${fileName}" is already downloaded.`));
            return;
        }

        console.log(color.yellow.bold.inverse(`Downloading: ${title}`));

        const downloadStream = ytdl(videoUrl, { filter: 'audioonly' });
        let totalSize = 0;
        let downloadedSize = 0;
        let lastUpdate = Date.now();

        const progression = new ProgressBar.SingleBar({
            format: `{percentage}% [${color.magenta('{bar}')}] ETA: {eta}s Speed: {speed}`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });        
        
        downloadStream.on('response', (res) => {
            totalSize = parseInt(res.headers['content-length'], 10);
            progression.start(totalSize, 0);
        });

        downloadStream.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const now = Date.now();
            const elapsedTime = now - lastUpdate;
        
            if (elapsedTime > 0) {
                const speed = (chunk.length / elapsedTime) * 1000;
                const speedInMB = speed / (1024 * 1024);
                progression.update(downloadedSize, { speed: speedInMB.toFixed(2) + ' MB/s' });
            }
        
            lastUpdate = now;
        });
        

        downloadStream.pipe(fs.createWriteStream(filePath));

        await new Promise((resolve, reject) => {
            downloadStream.on('finish', () => {
                progression.update(totalSize);
                progression.stop();
                console.log(color.green.bold(`Downloaded: ${fileName}`));
                resolve();
            });
            downloadStream.on('error', (error) => {
                console.error(color.red.inverse('Error downloading from YouTube:', error));
                reject(error);
            });
        });
    } catch (error) {
        console.error(color.red.inverse('Error getting video info from YouTube:', error));
    }
}

// Validate if file exists before trying to download
async function findMusicLocally(musicName, folderPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const musicFile = files.find(file => file.toLowerCase().includes(musicName.toLowerCase()));
                resolve(musicFile);
            }
        });
    });
}

// Spotify related code down below
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
});

async function askForFuckingPermission() {
    try {
        console.log(color.yellow.bold('Requesting Spotify API client credentials grant...'));
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
    } catch (error) {
        console.error(color.red.inverse('Error authenticating with Spotify:', error));
        throw error;
    }
}

function isValidSpotifyPlaylist(str) {
    const regex = /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9?=_-]+$/;
    return regex.test(str);
}

function isolateSpotifyID(playlistUrl) {
    const match = playlistUrl.match(/playlist\/(\w+)/);
    return match && match.length > 1 ? match[1] : null;
}

async function handleSpotifyPlaylist(playlistUrl, folderPath) {
    try {
        if (!isValidSpotifyPlaylist(playlistUrl)) {
            console.error(color.red.inverse('Invalid Spotify playlist URL.'));
            return;
        }

        const playlistId = isolateSpotifyID(playlistUrl);

        console.log(color.yellow.bold('Handling Spotify playlist:'), playlistId);
        await askForFuckingPermission();
        
        let offset = 0;
        let totalTracks = 0;
        let playlistTracks;
        
        do {
            playlistTracks = await spotifyApi.getPlaylistTracks(playlistId, { offset: offset });
            const tracks = playlistTracks.body.items;
            
            for (const result of tracks) {
                const trackName = result.track.name;
                const artistNames = result.track.artists.map(artist => artist.name);
                const query = `${trackName} ${artistNames.join(' ')}`;
                console.log(color.yellow.bold('Processing track:'), query);
                await dLByKeyword(query, folderPath);
            }

            totalTracks += tracks.length;
            offset += 100; // limit for each api call is 100

        } while (offset < playlistTracks.body.total);
        
        console.log(color.green.bold('Playlist tracks processed successfully. Total tracks:', totalTracks));
    } catch (error) {
        console.error(color.red.inverse('Error handling Spotify playlist:', error));
        throw error;
    }
}

// Youtube related code down below
function isValidYTPlaylist(str) {
    return /^(http|https):\/\/[^?&]+\/watch\?v=[^&]+&list=[^&]+/.test(str);
}

async function dLByKeyword(keywords) {
    try {
        const searchResults = await YouTube.search(keywords, { limit: 1 });
        if (searchResults && searchResults[0]) {
            const videoUrl = searchResults[0].url;
            await dL(videoUrl);
        } else {
            console.error(color.red.inverse('No search results found for the given keyword(s).'));
        }
    } catch (error) {
        console.error(color.red.inverse('Error searching YouTube:', error));
    }
}

async function downloadFromURL(videoUrl) {
    try {
        await dL(videoUrl);
    } catch (error) {
        console.error(color.red.inverse('Error downloading video from URL:', error));
    }
}

async function handleYTPlaylist(playlistURL) {
    try {
        console.log('Fetching playlist:', playlistURL);
        const playlist = await YouTube.getPlaylist(playlistURL, { fetchAll: true });
        console.log('Playlist fetched successfully:', playlist.title);

        const videos = playlist.videos;
        console.log('Number of videos in the playlist:', videos.length);

        if (videos && videos.length > 0) {
            for (let video of videos) {
                const videoUrl = video.url;
                console.log('Downloading video:', videoUrl);
                await dL(videoUrl);
            }
            console.log(color.green.bold('Playlist tracks processed successfully.'));
        } else {
            console.error(color.red.inverse('No videos found in the playlist.'));
        }
    } catch (error) {
        console.error(color.red.inverse('Error fetching or processing playlist:', error));
    }
}

// Keep Command Handling under here so it doesnt get mixed with other functions.

async function handleYTCommand(args) {
    const str = args.join(' ');
    if (isValidYTPlaylist(str)) {
        if (str.includes('list=')) {
            await handleYTPlaylist(str);
        } else {
            await downloadFromURL(str);
        }
    } else {
        await dLByKeyword(str);
    }
}

async function handleSpotifyCommand(args) {
    const playlistId = args[0];
    await handleSpotifyPlaylist(playlistId, './downloaded');
}

function handleExitCommand() {
    rl.close();
}
