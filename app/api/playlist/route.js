import axios from 'axios';

const convertIso8601ToSeconds = (isoDuration) => {
  if (typeof isoDuration !== 'string') {
    console.error('Invalid duration format:', isoDuration);
    return 0;
  }

  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) {
    console.error('Unable to parse duration:', isoDuration);
    return 0;
  }

  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[2], 10) || 0;
  const seconds = parseInt(match[3], 10) || 0;

  return (hours * 3600) + (minutes * 60) + seconds;
};


const fetchVideoDetails = async (videoId, apiKey) => {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        id: videoId,
        key: apiKey
      }
    });

    const video = response.data.items[0];
    if (video && video.contentDetails && video.contentDetails.duration) {
      return {
        duration: convertIso8601ToSeconds(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.high.url
      };
    } else {
      console.error('Video duration not found for video ID:', videoId);
      return { duration: 0, thumbnail: '' };
    }
  } catch (error) {
    console.error('Error fetching video details:', error);
    return { duration: 0, thumbnail: '' };
  }
};

export async function POST(req) {
  const { playlistUrl } = await req.json();

  if (!playlistUrl) {
    return new Response('Playlist URL or ID is required', { status: 400 });
  }

 
  const urlParams = new URLSearchParams(new URL(playlistUrl).search);
  const playlistId = urlParams.get('list') || playlistUrl;

  if (!playlistId) {
    return new Response('Playlist ID could not be extracted', { status: 400 });
  }

  try {
    const apiKey = process.env.YOUTUBE_API_KEY; 
    if (!apiKey) {
      throw new Error('API key not found');
    }

    let allItems = [];
    let nextPageToken = '';
    do {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'contentDetails',
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
          key: apiKey
        }
      });

      allItems = allItems.concat(response.data.items);
      nextPageToken = response.data.nextPageToken || '';

    } while (nextPageToken);

    if (!allItems || allItems.length === 0) {
      throw new Error('No items found in the playlist');
    }

    
    const videoDetails = await Promise.all(allItems.map(async (item) => {
      const details = await fetchVideoDetails(item.contentDetails.videoId, apiKey);
      return { videoId: item.contentDetails.videoId, ...details };
    }));

    
    const totalDuration = videoDetails.reduce((total, video) => total + video.duration, 0);
    const averageDuration = videoDetails.length > 0 ? totalDuration / videoDetails.length : 0;

    return new Response(JSON.stringify({
      videoDetails,
      totalDuration,
      averageDuration
    }), { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response('Error fetching data', { status: 500 });
  }
}
