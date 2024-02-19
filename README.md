# Music Downloader

This is a simple command-line tool for downloading music from YouTube and Spotify playlists. The script allows users to search for tracks using keywords or links and downloads them into a specified directory.

## Requirements

Before using this script, ensure you have the following:

- Node.js installed on your machine.
- A set of API keys for Spotify. These keys should be stored in a file named `keys.env` in the root directory of the project.

## FAQ

### How do I install Node.js?

To install Node.js on your machine, follow these steps:

1. **Download Node.js:**
   - Visit the [Node.js official website](https://nodejs.org/) and download the appropriate installer for your operating system.

2. **Install Node.js:**
   - Run the installer and follow the installation instructions provided.
   - Once the installation is complete, you can verify that Node.js and npm (Node Package Manager) are installed by opening a terminal or command prompt and running the following commands:
     ```
     node -v
     npm -v
     ```
   - If Node.js and npm are installed correctly, you will see their versions printed in the terminal.

### How do I create a Spotify API Key?

To create a Spotify API key, follow these steps:

1. **Sign up for a Spotify Developer Account:**
   - Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/login) and click on the "Log in" button.
   - If you don't have an account, sign up for one.

2. **Create a New App:**
   - Once logged in to the Spotify Developer Dashboard, click on the "Create an App" button.
   - Fill out the required information for your application, including its name, description, and other details.

3. **Get Your Client ID and Client Secret:**
   - After creating your application, Spotify will generate a Client ID and Client Secret for your app.
   - These keys are used to authenticate requests to the Spotify API.

4. **Note Your Client ID and Client Secret:**
   - Make sure to securely note down your Client ID and Client Secret. (You can place them in `keys.env`)
   - You will use these keys in your application to authenticate requests to the Spotify API.

5. **Start Using the Spotify API:**
   - With your Client ID and Client Secret, you can start making requests to the Spotify API in your application.
   - Follow Spotify's API guidelines and terms of service when using their API.

By following these steps, you should be able to create a Spotify API key and integrate it into your application for accessing Spotify's services.

## Installation

1. Clone or download the repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install dependencies by running the command (If you don't have the packages):

```js
npm install
```

## Usage

To start the application, run the `run.bat` file. This will launch the command-line interface for interacting with the downloader.

### Commands

- `yt <keywords/link>`: Search and download music from YouTube based on keywords or a video link (it supports playlists).
- `spotify <playlist>`: Fetch music names from a Spotify playlist and download them from YouTube. Provide the Spotify playlist URL as the argument.
- `exit`: Terminate the application.

### Examples

To download music from YouTube:
```js
yt despacito

or

yt https://www.youtube.com/watch?v=kJQP7kiw5Fk
```

To download tracks from a Spotify playlist:
```js
spotify https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
```


## Configuration

You can configure the script by modifying the following:

- **Download Directory**: By default, downloaded tracks are saved in the `./downloaded` directory. You can change this path in the script if needed.

## Notes

- Make sure your Spotify API keys are kept confidential and not shared publicly. (This is why I don't recommend keeping them in `index.js`)
- This script relies on external APIs and services, so it requires a stable internet connection to function properly. (File might corrupt if your connection isn't stable)
- Please note that the Spotify command fetches music names from Spotify playlists and downloads them from YouTube, as Spotify's terms of service prohibit downloading music directly. (Spotify please don't kill my family)

## Things to mention

This script utilizes the following libraries:

- `ytdl-core` for downloading YouTube videos.
- `youtube-sr` for searching YouTube.
- `spotify-web-api-node` for interacting with the Spotify Web API.
- `dotenv` for loading environment variables from a `.env` file.
- `readline` for creating a command-line interface.
- `chalk` for terminal styling.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
