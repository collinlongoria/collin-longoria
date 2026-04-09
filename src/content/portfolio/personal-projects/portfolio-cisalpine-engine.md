---
title: Cisalpine Engine
date: 2026
summary: 2D Fully GPU-Driven Falling Sand Sim.
tags: [C++, OpenGL, Engine]
category: Personal Projects
group: Software
coverImage: "/cisalpine/screenshot_3.png"
featured: true
---

<img
src="/cisalpine/banner.png"
alt="Cisalpine Engine Banner"
class="mx-auto"
/>

<section>
<h2>Description: </h2>
<p>
Cisalpine Engine was built from scratch in C++. It is a falling sand simulation where the entire world runs on the GPU. No CPU simulation. Every particle, fire spread, explosion is a GLSL compute shader dispatching over a texture.

I'm most proud of the physics implementation, which handles force diffusion, and the actual particles push/pull from this data.

Rendering uses colors/normals for 2D diffuse and specular lighting, then calculates ray-marches shadows and multi-bounced indirect lighting, before applying various other visual effects. Particle materials can bend light, or change its color.

All elements live in a JSON file, which generates injection code into the GLSL shaders, meaning elements can be added without ever changing the shaders.
</p>
</section>
<imagescroller data-images="/cisalpine/screenshot_1.png,/cisalpine/screenshot_2.png,/cisalpine/screenshot_3.png,/cisalpine/screenshot_4.png"></imagescroller>

<linkbutton href="https://github.com/collinlongoria/cisalpine-engine" data-icon="github">Source Code</linkbutton>