// app.js
const { useState, useEffect } = React;

const App = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [commits, setCommits] = useState([]);
  const [selectedCommitSha, setSelectedCommitSha] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [githubUrl, setGithubUrl] = useState('https://github.com/scarletstudio/scarletstudio.github.io/blob/main/_blog/mentors.md');

  // Extract details from GitHub URL
  const extractGithubDetails = (url) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.*)/);
    if (match) {
      const [, owner, repo, branch, path] = match;
      return { owner, repo, branch, path };
    }
    return null;
  };

  // Fetch the latest version of the markdown file
  const fetchMarkdown = async (sha) => {
    try {
      setLoading(true);
      const { owner, repo, path } = extractGithubDetails(githubUrl);
      const branch = sha || extractGithubDetails(githubUrl).branch;
      const response = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      );
      const rawMarkdown = response.data;
      const strippedMarkdown = rawMarkdown.replace(/^---[\s\S]*?---\n/, ''); // Remove YAML front matter
      // Remove any Liquid tags (e.g., {:target="_blank"})
      const cleanedMarkdown = strippedMarkdown.replace(/\{:[^}]*\}/g, '');
      setMarkdownContent(cleanedMarkdown);
    } catch (error) {
      console.error('Error fetching markdown:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the commit history of the file
  const fetchCommits = async () => {
    try {
      const { owner, repo, path } = extractGithubDetails(githubUrl);
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}`
      );
      setCommits(response.data);
    } catch (error) {
      console.error('Error fetching commits:', error);
    }
  };

  // Handle commit selection change
  const handleCommitChange = (event) => {
    const sha = event.target.value;
    setScrollPosition(window.scrollY); // Save the current scroll position
    setSelectedCommitSha(sha);
    fetchMarkdown(sha);
  };

  // Handle GitHub URL input change
  const handleUrlChange = () => {
    const urlInput = document.getElementById('github-url-input').value;
    if (extractGithubDetails(urlInput)) {
      setGithubUrl(urlInput);
      setCommits([]); // Reset commits
      setSelectedCommitSha(''); // Reset selected commit
      fetchCommits(); // Fetch new commits
      document.querySelector('.selector-container').classList.add('visible');
    } else {
      alert('Invalid GitHub URL format. Please enter a valid URL.');
    }
  };

  useEffect(() => {
    if (commits.length > 0) {
      const initialSha = commits[0].sha;
      setSelectedCommitSha(initialSha);
      fetchMarkdown(initialSha);
    }
  }, [commits]);

  // Restore scroll position after content is loaded
  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, scrollPosition);
    }
  }, [markdownContent, loading]);

  return (
    <div className="app-wrapper">
      <div className="app-container">
        <h1>Markdown Viewer with GitHub History</h1>
        <div className="url-input-container">
          <input
            id="github-url-input"
            type="text"
            placeholder="https://github.com/scarletstudio/scarletstudio.github.io/blob/main/_blog/mentors.md"
            defaultValue={githubUrl}
            className="github-url-input"
          />
          <button onClick={handleUrlChange} className="github-url-button">Load</button>
        </div>
        {loading && <p>Loading...</p>}
        <div className={`selector-container ${commits.length > 0 ? 'visible' : ''}`}>
          <label htmlFor="commit-selector">Select Commit:</label>
          <select
            id="commit-selector"
            value={selectedCommitSha}
            onChange={(e) => handleCommitChange(e)}
            className="commit-selector"
          >
            <option value="">Select a commit</option>
            {commits.map((commit) => (
              <option key={commit.sha} value={commit.sha}>
                {new Date(commit.commit.author.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} - {commit.commit.message} ({commit.sha.substring(0, 7)})
              </option>
            ))}
          </select>
        </div>
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: marked.parse(markdownContent) }}
        ></div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
