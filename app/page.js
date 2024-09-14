"use client";

import { useState } from 'react';
import axios from 'axios';
import { IoTimeSharp } from 'react-icons/io5';
import { FaGithub } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

// Convert seconds to readable format
const formatDuration = (seconds) => {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return 'Invalid duration';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    secs > 0 ? `${secs}s` : null,
  ].filter(Boolean).join(' ');
};

export default function Home() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [videoDetails, setVideoDetails] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [averageDuration, setAverageDuration] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Start loading

    try {
      const res = await axios.post('/api/playlist', { playlistUrl });
      setVideoDetails(res.data.videoDetails);
      setTotalDuration(res.data.totalDuration);
      setAverageDuration(res.data.averageDuration);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data. Please check the Playlist URL or ID and try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleCheckboxChange = (videoId) => {
    setVideoDetails((prevDetails) =>
      prevDetails.map((video) =>
        video.videoId === videoId ? { ...video, selected: !video.selected } : video
      )
    );
  };

  const calculateSelectedDuration = () => {
    const selectedVideos = videoDetails.filter(video => video.selected !== false);
    const total = selectedVideos.reduce((total, video) => total + video.duration, 0);
    return total;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-gray-100">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-md py-8 shadow-lg">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-white">Playlist Duration Calculator</h1>
          <p className="text-gray-300 mt-2 text-lg">Calculate the total and average duration of your YouTube playlists effortlessly.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl p-8 bg-black bg-opacity-50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg">
          <h2 className="text-3xl font-semibold text-center text-white mb-6">Get Playlist Duration</h2>
          <p className="text-gray-300 mb-6 text-center">Enter your YouTube playlist URL or ID to calculate the total and average duration of all videos in the playlist.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center border-b border-gray-700 py-2">
              <IoTimeSharp className="text-gray-400 text-2xl mr-2" />
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="Enter Playlist URL or ID"
                className="bg-transparent border-none w-full text-gray-100 placeholder-gray-400 py-1 px-2 leading-tight focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
            >
              Calculate Duration
            </button>
          </form>

          {loading && (
            <div className="text-center mt-4">
              <FiLoader className="animate-spin text-white text-3xl" />
            </div>
          )}

          {error && (
            <div className="text-center font-medium text-red-400 mt-4 p-4 bg-gray-800 rounded-md shadow-md">
              {error}
            </div>
          )}

          {videoDetails.length > 0 && !loading && (
            <>
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-white">Duration Summary</h3>
                <p className="text-gray-300 mt-2">Total Duration: {formatDuration(totalDuration)}</p>
                <p className="text-gray-300 mt-2">Average Duration: {formatDuration(averageDuration)}</p>
                <p className="text-gray-300 mt-2">Selected Total Duration: {formatDuration(calculateSelectedDuration())}</p>
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold text-white">Video List</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {videoDetails.map((video) => (
                    <li key={video.videoId} className="bg-black bg-opacity-50 backdrop-blur-md border border-gray-800 p-4 rounded-lg flex flex-col items-center space-y-2">
                      <input
                        type="checkbox"
                        checked={video.selected !== false}
                        onChange={() => handleCheckboxChange(video.videoId)}
                        className="form-checkbox h-6 w-6 text-gray-500"
                      />
                      <img src={video.thumbnail} alt="Thumbnail" className="w-48 h-32 object-cover rounded-lg" />
                      <div className="text-center">
                        <p className="text-white font-semibold">{video.title}</p>
                        <p className="text-gray-400 mt-1">Duration: {formatDuration(video.duration)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 backdrop-blur-md py-4">
        <div className="container mx-auto text-center text-gray-400">
          <p className="mb-2">
            <a href="https://github.com/turbo7slug/yt_playlist_length" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <FaGithub className="inline w-6 h-6 mr-2" />
              <span className="text-lg">View Source Code</span>
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
