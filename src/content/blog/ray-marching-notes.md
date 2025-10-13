---
title: Ray Marching Notes
date: 2025-09-21
summary: Practical notes from building a voxel ray marcher.
tags: [Vulkan, Compute, SDF]
---

# Ray Marching Notes

This post collects performance notes for my voxel ray marcher.

<div style="padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem">
<strong>Inline HTML works</strong> — handy for callouts or embeds.
</div>

```cpp
// Minimal Vulkan call
vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, pipeline);
```