const markdown = require('markdown').markdown;
const express  = require('express');
const app      = express();
const port     = 3000;
const git      = require('isomorphic-git');
const http     = require('isomorphic-git/http/node');
const fs       = require('fs');

let lastPull;

// Fresh repository pull
clone().then(pull).then(runServer);

function runServer() {
  app.get('/', async (req, res) => {
    const page = Number(req.params.page) || 0;

    await poll()
    const dir = await fs.promises.readdir('./blog/posts/');

    const sorted = dir.sort((a, b) => a < b ? 1 : -1);
    newestSixPosts = sorted.slice(0 + page * 6, 6 + page * 6);

    const promises = newestSixPosts.map(async (d) => {
      return fs.promises.readFile('./blog/posts/' + d, 'utf8');
    });

    const contents = await Promise.all(promises);

    res.send(HTMLFormat(contents, dir));
  });

  app.get('/:filename', async (req, res) => {
    const filename = req.params.filename;

    await poll()

    try {
      contents = await fs.promises.readFile('./blog/posts/' + filename, 'utf8');
      res.send(HTMLFormat([contents], [filename]));
    } catch (e) {
      res.sendStatus(404);
    }
  });

  app.listen(port, () => console.log(`Gitblogger running on http://localhost:${port}`));
}

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
async function clone() {
  const remote = 'https://github.com/siriusastrebe/blog.git';
  const dir = './blog';
  console.log(`Git - Clone ${remote} to ${dir}`);

  await git.clone({
    fs,
    http,
    dir: dir,
    url: remote,
    singleBranch: true
  });
}

async function pull() {
  const dir = './blog';
  lastPull = new Date();
  console.log(`Git - Pull ${dir}`);

  await git.pull({
    fs,
    http,
    dir: dir,
    ref: 'master',
    author: {name: 'siriusastrebe', email: ''},
    singleBranch: true
  });
}

async function poll() {
  if (new Date() - lastPull > 60000) {
    return await pull();
  }
}

function HTMLFormat(posts, filenames) {
  let html = "<!DOCTYPE html><html><body>";

  posts.forEach((post, i) => {
    html += formatFile(post, filenames[i]);
  });

  html += "</body>";
  html += "<style type=\"text/css\">body{margin:40px auto;max-width:800px;font-size:20px;color:#333;padding:0 10px;background:#FAFBFC}h1,h2,h3{line-height:1.2}pre{background:lightyellow;overflow:scroll;padding:0 20px}</style>";
  html += "</html>";
  return html;
}

function formatFile(contents, filename) {
  if (filename.substring(filename.length - 3) === '.md') {
    return markdown.toHTML(contents);
  } else if (filename.substring(filename.length - 5) === '.html') {
    return contents;
  }
}
