---
title: "Rendering Three.js Games in Markdown: My Blog Pipeline"
date: 2026-1-8
summary: Here is how I render a three.js canvas in a markdown file.
tags: [Tech, Javascript]
coverImage: "/blog_misc/cube_render.png"
---

# Purpose
I wanted a simple blog setup where I could write posts easily in Markdown but still embed interactive content like Three.js
canvases, since I intend to focus my blog mainly on my graphics programming career. Here is how I built it.

Shockingly, getting this to work requires very little work.

# The Basic Idea
My blog posts are just markdown files. When you visit a post, the "BlogPost" component loads the markdown content and passes
it to a "ContentRenderer" component that does the heavy lifting of turning that markdown into React components (The rest of
my website uses a Typescript + React + Tailwind stack).

The magic happens with "react-markdown", which converts the markdown to React elements, plus two other plugins: "remark-gfm"
for GitHub-like markdown features and "rehype-raw", which is the key to everything. This plugin allows me to embed custom HTML
tags directly in my markdown.

# Custom HTML Tags in Markdown
This is where it gets interesting. I can write something like this in a markdown file:

```html
<threegame data-id="my-game-id" />

<youtube data-id="dQw4w9WgXcQ" data-title="Cool Video" />
```

These aren't real HTML tags of course, they're custom tags I define in the ContentRenderer. The rehype-raw plugin preserves
them, and then I map them to actual React components.

Currently, most of the tags I have defined are for the portfolio section of my website, since entries into that are also Markdown.
For example, the image carousels found in that section are created when I add a `<imagescroller>` tag to the Markdown.

The custom components that need it extract their data from attributes in the same why tradition HTML tags do. For instance,
my `<youtube>` tag, which adds an embedded iframe to play Youtube videos, grabs the 'data-id' attribute and reconstructs the
embed URL.

# Handling Block vs Inline Content
One issue I ran into was that Markdown's `<p>` tags can mess things up when you're embedding block-level elements. If I put
a `<youtube>` tag in my markdown, markdown wants to wrap it in a paragraph tag, which breaks the layout, and usually threw
a hydration error. 

I solved this with a function that checks if a paragraph contains any of my custom block-level tags. If it does, I skip the `<p>`
wrapper and just render the children directly. A simple fix, but given this website was my first go-around with React, this took
a while to figure out.

```javascript
const containsBlockHTML = (node: any) =>
    (node?.children ?? []).some((c: any) => {
        if (c.type === 'element') {
            const t = String(c.tagName || '').toLowerCase()
            return ['youtube','imagescroller','section','div','iframe', 'threegame'].includes(t)
        }
        if (c.type === 'raw' && typeof c.value === 'string') {
            return /<(youtube|imagescroller|section|div|iframe|threegame)\b/i.test(c.value)
        }
        return false
    })
```

# Why This Works
This setup gives me the best of all worlds:

- I can write in markdown, which is fast and clean
- I can drop in interactive React components wherever and whenever I need them
- The blog posts are just static markdown files, no database or 3rd party service required
- Adding new component types is as simple as adding a new mapping in ContentRenderer

The Three.js games run in their own canvas elements, completely isolated from the rest of the page content. Each game component
is self-contained, so I can reuse the same game in multiple posts or build a whole library of interactive demos.

TL;DR It's a simple pipeline that scales well, is easy to add to, and stays clean and readable.

# So, Do You See It?
Below should be a spinning cube. This is a three.js canvas rendering in real time. If you cannot see it, then you probably
have an outdated browser. As far as I am aware, the most up-to-date versions of Firefox and Chrome support WebGPU.

<b>Update: Looks like webgpu is still unsupported by current mobile versions of these browsers.</b>

I've been extremely pleased with how my blog pipeline has turned out, and I hope to be able to explore various real-time
rendering techniques right here in the future. Thanks for reading!

<threegame data-id="spinning-cube"></threegame>