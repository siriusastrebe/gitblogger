const markdown = require('markdown').markdown;
const express  = require('express');
const app      = express();
const port     = 3000;
const git      = require('isomorphic-git');
const http     = require('isomorphic-git/http/node')
const fs       = require('fs')

let lastPull;

// Fresh repository pull
clone().then(pull).then(runServer);

function runServer() {
  app.get('/', async (req, res) => {
    await poll()
    const dir = await fs.promises.readdir('./blog/blogs/');

    const promises = dir.map(async (d) => {
      return fs.promises.readFile('./blog/blogs/' + d, 'utf8');
    });

    const contents = await Promise.all(promises)

    res.send(HTMLFormat(contents));
  });

  app.get('/:blog', async (req, res) => {
    const blog = req.params.blog;
    const extension = blog.split('.')[1];

    const promises = [];
    if (extension) {
      promises.push(fs.promises.readFile('./blog/blogs/' + blog, 'utf8'));
    } else {
      // Try opening both HTML and .md files
      promises.push(fs.promises.readFile('./blog/blogs/' + blog + '.html', 'utf8'));
      promises.push(fs.promises.readFile('./blog/blogs/' + blog + '.md', 'utf8'));
    }

    try {
      const contents = await Promise.any(promises);
      res.send(HTMLFormat([contents]));
    } catch (e) {
      res.sendStatus(404);
    }
  });

  app.listen(port, () => console.log(`Gitblogger running on http://localhost:${port}`))
}

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
async function clone() {
  const remote = 'https://github.com/siriusastrebe/gitblog.git';
  const dir = './blog';
  console.log(`Git - Clone ${remote} to ${dir}`)

  await git.clone({
    fs,
    http,
    dir: dir,
    url: remote,
    singleBranch: true
  })
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
  })
}

async function poll() {
  if (new Date() - lastPull > 60000) {
    return await pull();
  }
}


function HTMLFormat(posts) {
  let html = "<!DOCTYPE html><html><body>";

  posts.forEach((post, i) => {
    html += formatFile(post);
  });

  html += "</body>";
  html += "<style type=\"text/css\">body{margin:40px auto;max-width:800px;line-height:1.6;font-size:18px;color:#444;padding:0 10px}h1,h2,h3{line-height:1.2}pre{background:lightyellow;overflow:scroll;padding:0 20px}</style>";
  html += "</html>";
  return html;
}

function formatFile(contents) {
  try {
    return markdown.toHTML(contents);
  } catch {
    return contents;
  }
}

// ----------------------------------------------------------------
// Shims
// ----------------------------------------------------------------
Promise.any = function (promises) {
  return new Promise((resolve, reject) => {
    let rejectCount = 0;
    let resolved = false;
    for (let i=0; i<promises.length; i++) {
      const promise = promises[i];
      promise.then((result) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      }).catch((e) => {
        rejectCount = rejectCount + 1;
        if (rejectCount === promises.length) {
          reject(e)
        }
      });
    }
  });
}
