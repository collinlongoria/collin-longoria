---
title: Curia ECS
date: 2026
summary: Moden C++ Entity Component System for Game Engines
tags: [C++, Engine]
category: Personal Projects
group: Library
coverImage: "/curia/logo.png"
featured: true
---

<img
src="/curia/banner.png"
alt="Curia ECS Banner"
class="mx-auto"
/>

<section>
<h2>Description: </h2>
<p>
Curia is a Entity Component System (ECS) written in C++. The goal of this project was to implement an ECS library I could use in my own work,
but also to learn modern C++ 21 and 23 features.

Features of Curia include:
1. Fully Archetype-based components with an Archetype graph for rapid iteration.
2. Thread safe and alloc-free command buffer.
3. 0-sized tags and observer architecture for handling small states (i.e., isDirty)

Planned features include an entity prefab system, and more.

I am currently writing a blog about Curia, which you can find PART ONE of linked below.
</p>
</section>

<linkbutton href="https://collinlongoria.com/blog/building-an-ecs-part-one">Read the Blog</linkbutton>