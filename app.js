const markdown = require('markdown').markdown;
const express  = require('express');
const app      = express();
const port     = 3000;
const git      = require('nodegit');
const fs       = require('fs');


cloneRepository().then((repo) => {
  runServer()
});

async function cloneRepository(url, path) {
  try {
    await git.Clone('https://github.com/siriusastrebe/gitblog/', './blog');
  } catch {
  } finally {
    const repo = await git.Repository.open('./blog');
console.log('zope', repo);
  }
}


function runServer() {
  app.get('/', async (req, res) => {
    console.log('yo!');
  });

  app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))
}

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------

function HTMLFormat(posts, metadatas) {
  let html = "<!DOCTYPE html><html><body>";


  posts.forEach((post, i) => {
    html += formatFile(post, metadatas[i].name);
  });

  html += "</body>";
  html += "<style type=\"text/css\">body{margin:40px auto;max-width:800px;line-height:1.6;font-size:18px;color:#444;padding:0 10px}h1,h2,h3{line-height:1.2}pre{background:lightyellow;overflow:scroll;padding:0 20px}</style>";
  html += "</html>";
  return html;
}

function formatFile(contents, name) {
  const extension = name.split('.')[name.split('.').length - 1];
  switch (extension) {
    case 'md':
      //return markdown.toHTML(contents);
    case 'html':
      return contents;
  }
}
