function extractKeywords(text) {
  if (!text) return [];
  const stop = new Set([
    'the','is','and','or','of','a','an','to','in','on','for','with','by','as','at','be','are','from','that','this','it','its','into','your','you','we','they','their','our','about'
  ]);
  return (text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !stop.has(w) && w.length > 2)
    .slice(0, 12));
}

function buildQuery(input) {
  const text = (input || '').slice(0, 300);
  const kws = extractKeywords(text);
  // Prefer multi-word key phrases if present in original text (quick heuristic)
  const phrases = [];
  const lowered = text.toLowerCase();
  const candidates = [
    'introduction','basics','overview','examples','practice','tutorial','lecture','course','crash course',
    'exercises','problems','derivatives','integrals','matrix','vectors','probability','statistics','algebra','calculus','physics','chemistry','biology'
  ];
  for (const c of candidates) {
    if (lowered.includes(c)) phrases.push(c);
  }
  const terms = Array.from(new Set([...phrases, ...kws]));
  // Append common learning intents to improve relevance
  const learnTags = ['lecture','tutorial','crash course','explained'];
  const parts = [...terms, ...learnTags].slice(0, 8);
  return parts.join(' ');
}

export async function suggestVideos(topic) {
  const key = process.env.YOUTUBE_API_KEY;
  const query = buildQuery(topic) || 'study tutorial';
  if (!key) {
    // return mock videos for development
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `mock-${i}`,
      title: `${query ? query + ' - ' : ''}Study Video ${i + 1}`,
      channelTitle: 'EduLearn Channel',
      duration: '12:34',
      thumbnail: `https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      relevance: Math.random()
    }));
  }
  const { default: axios } = await import('axios');
  const q = encodeURIComponent(query);
  const params = `part=snippet&type=video&maxResults=6&safeSearch=moderate&relevanceLanguage=en&q=${q}&key=${key}`;
  const res = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );
  const items = Array.isArray(res.data?.items) ? res.data.items : [];
  if (!items.length) {
    // Fallback to a more generic query
    const q2 = encodeURIComponent(extractKeywords(topic).slice(0,5).join(' ') || 'study tips');
    const res2 = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${q2}&key=${key}`);
    return res2.data.items.map((it) => ({
      id: it.id.videoId,
      title: it.snippet.title,
      channelTitle: it.snippet.channelTitle,
      duration: '',
      thumbnail: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
      relevance: 1
    }));
  }
  return items.map((it) => ({
    id: it.id.videoId,
    title: it.snippet.title,
    channelTitle: it.snippet.channelTitle,
    duration: '',
    thumbnail: it.snippet.thumbnails?.high?.url || it.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
    relevance: 1
  }));
}
