---
title: "Building an ECS: Part Two"
date: 2026-3-11
summary: Alloc-Free and Lock-Free Command Buffer
tags: [Tech, C++, Game Engine, ECS]
coverImage: "/building_an_ecs/part_two.png"
private: true
---

# Introduction
Welcome back. I am currently at GDC, but felt like getting out the next part of
this blog. I am about three blog posts ahead in terms of actual work, and need to do some catchup.
In Part One of this series, I introduced you to Curia, an archetype-based Entity Component System written in
C++23. In it, we covered how strict memory contiguity via Chunks gives us super duper fast query iteration.

However, at the end of that post, I confessed a dirty secret about Curia's architecture: the Command Buffer sucks a little bit. Because
Archetpye ECS models require moving data between memory blocks whenever an entity's signature changes, 