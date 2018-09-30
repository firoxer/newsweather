const NEWS_URL = "/cors/https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss";
async function fetchHeadlineData() {
  return new Promise((resolve, reject) => {
    fetch(NEWS_URL)
      .then(response => response.text())
      .then(body => resolve(body))
      .catch(reject);
  });
}

function parseHeadlines(headlineData) {
  const headlineMatcher = /<title>([^<]+)<\/title>[\s\S]*?<link>([^<]+)<\/link>/g;

  const headlines = [];
  while (true) {
    const match = headlineMatcher.exec(headlineData);
    if (match === null) {
      break;
    }
    headlines.push({ text: match[1], link: match[2] });
  }

  return headlines.slice(1); // The first line is not important
}

function shareLink(emailAddress, link) {
  fetch(
    `/email/${encodeURIComponent(emailAddress)}`,
    {
      method: 'POST',
      body: `message=${encodeURIComponent(link)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  )
    .then(res => console.log(res));
}

function showHeadlineShare(link) {
  const shareElem = document.createElement('div');
  shareElem.id = 'headline-share';
  shareElem.onclick = () => document.body.removeChild(shareElem);

  for (const { name, address } of EMAIL_ADDRESSES) { // eslint-disable-line
    const buttonElem = document.createElement('button');
    buttonElem.appendChild(document.createTextNode(name));
    buttonElem.onclick = () => shareLink(address, link);
    shareElem.appendChild(buttonElem);
  }

  document.body.appendChild(shareElem);
}

function renderHeadlines(headlines) {
  const headlinesElem = document.getElementById('headlines');

  // Empty the parent
  while (headlinesElem.firstChild) {
    headlinesElem.removeChild(headlinesElem.firstChild);
  }

  for (const { text, link } of headlines) {
    const decodedText = text.replace(/&quot;/g, '\u201D');

    const headlineElem = document.createElement('p');
    headlineElem.appendChild(document.createTextNode(decodedText));
    headlineElem.onclick = () => showHeadlineShare(link);
    headlinesElem.appendChild(headlineElem);
  }
}

async function refreshNews() {
  const headlineData = await fetchHeadlineData();
  const headlines = parseHeadlines(headlineData);
  renderHeadlines(headlines);
}
