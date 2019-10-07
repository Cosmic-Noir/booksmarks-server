function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: "Love Forever",
      url: "www.google.com",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
      rating: "9"
    },
    {
      id: 2,
      title: "Never Love",
      url: "www.google.com",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
      rating: "7"
    },
    {
      id: 3,
      title: "Always Love",
      url: "www.google.com",
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit",
      rating: "10"
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    url: "www.google.com",
    rating: 9
  };
  const expectedBookmark = {
    ...maliciousBookmark,
    title:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };
  return {
    maliciousBookmark,
    expectedBookmark
  };
}

module.exports = { makeBookmarksArray, makeMaliciousBookmark };
