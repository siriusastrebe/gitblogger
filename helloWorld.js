const markdown = require('markdown-it')();
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const html = return markdown.render(contents);
  res.send("<html><body>" + html + "</body></html>");
});

app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))
