export async function suggestVideos(topic) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    // return mock videos for development
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `mock-${i}`,
      title: `${topic ? topic + ' - ' : ''}Study Video ${i + 1}`,
      channelTitle: 'EduLearn Channel',
      duration: '12:34',
      thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      relevance: Math.random()
    }));
  }
  const { default: axios } = await import('axios');
  const q = encodeURIComponent(topic || 'study tips');
  const res = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${q}&key=${key}`
  );
  return res.data.items.map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channelTitle: it.snippet.channelTitle,
    duration: '',
    thumbnail: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
    relevance: 1
  }));
}
