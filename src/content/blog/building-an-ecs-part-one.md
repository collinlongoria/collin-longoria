---
title: "Building an ECS: Part One"
date: 2026-3-6
summary: The Basic Components
tags: [Tech, C++, Game Engine, ECS]
coverImage: "/building_an_ecs/part_one.png"
---

# Introduction
Many people start building game engines with a very simple OOP solution.
Perhaps their engine contains _Player_ and _Enemy_ classes that each contain private variables such as
_Health_ and _Speed_. Any reasonable developer can immediately ascertain the issues with such an implementation, both
in terms of redundancy and code cleanliness, as well as in performance. Eventually, a good developer will go down the rabbit
hole of Data-Oriented Design.

Today, I start my series on my ECS library, **Curia**. Curia is a strictly archetype-based Entity Component System written in
modern C++. This post breaks down its basic architecture, how it achieves cache-friendly data locality, and the lessons learned
along the way.

# Why ECS is Good
Modern CPUs are super fast at most tasks, but they spend the majority of their time waiting for memory. This isn't new information,
but when you use traditional OOP for game entities, your data is scattered across the heap. Iterating over thousands - or even millions -
of entities causes constant cache misses.

An ECS solves this by decoupling data from logic:
- Entities are just IDs.
- Components are pure data.
- Systems are functions that iterate over the arrays.

Boom, super simple in concept. If you are reading this, it is highly likely you were already familiar with this. By packing
components tightly in memory using a Structure of Arrays (SoA) layout, we maximize CPU cache hits. When a system asks for,
say _Position_ or _Velocity_, the CPU prefetches the next items in the array automatically. This is the exact kind of memory
access pattern you'd need to say, feed massive amounts of the data to a renderer. Recall that object buffers in graphics APIs
require this exact kind of memory layout.

# Drawback and Common Mistakes
Like everything else, this section is entirely subjective. Moreover, anything I say is most certainly entirely wrong to somebody
else. In reality, all programming decisions contain an infinite amount of nuance. That being said, I assert there are common
decisions I think one ought to avoid.

Firstly, many ECS libraries and tutorials use **Sparse Sets**. Sparse sets are great for fast structural changes, but result in
fragmented memory layouts when iterating over multiple components at once. In addition, one utilizing sparse sets must ensure their
RHI handles the packing of the data when handing it over to the renderer, spending precious frame time waiting for such.

For perfectly contiguous memory, one requires an **Archetype** model. The drawback of archetypes is that structural mutations
are more expensive, since they require moving the entity's data to an entirely different block of memory. Curia accepts this trade
off, and I hope I can convince you too as well.

# Introducing Curia ECS
Curia is designed around two things: strict memory contiguity, and type safety. Let's look under the hood:

## Entities
As with most ECS, in Curia, an entity is simply a 64-bit integer.
```cpp
using Entity = uint64_t;
static constexpr Entity INVALID_ENTITY = ~Entity(0);
```
To safely recycle IDs when entities are destroyed, the 64-bit integer is split. The lower 32 bits act as the array index for
lookups, and the upper 32 bits act as a generation counter. If an entity is destroyed and its index is reused, the generation
counter increments, instantly invalidating any old handles.

## Components
Components in Curia, as with most ECS, must be pure data. To enforce this at compile time, Curia uses modern C++ concepts:
```cpp
template <typename T>
concept IsValidComponent = std::is_trivially_copyable_v<T> && std::is_standard_layout_v<T>;
```
This guarantee tells Curia that it can safely use _memcpy_ to move components around memory without worrying about copy
constructors or destructors. Component IDs are generated dynamically at runtime using a static atomic counter.

## Archetypes
At the heart of Curia is the _Archetype_. An Archetype represents a unique combo of components (this is frequently referred
to as a "signature" in other ECS tutorials). Every entity with the exact same components is physically grouped together into the
same Archetype.

When an entity changes its signature (e.g., gains or loses a component), Curia moves its data from its current Archetype to
the new one, performing a fast swap to ensure the old memory block remains perfectly packed. Again, doing so is important and
at the core of Curia's ideals.

## Chunk Storage
To avoid any massive reallocations, Archetypes do not use a single massive vector. Instead, they allocate memory in fixed-size
blocks.
```cpp
struct Chunk {
    static constexpr size_t CHUNK_SIZE = 16384;
    alignas(16) std::byte data[CHUNK_SIZE];
    uint32_t entity_count = 0;
};
```
Each Chunk holds 16KB of raw byte storage aligned to 16-bytes. Inside the Chunk, the Archetype computes a perfect SoA layout. This
ensures that all components of the same type are all right next to each other, followed by the next component, and so on and so on.
```
Chunk (16 KB)

Position: [P0 P1 P2 P3 P4 ...]
Velocity: [V0 V1 V2 V3 V4 ...]
Health:   [H0 H1 H2 H3 H4 ...]
```

## World
The World is the central coordinator of the ECS. It maintains the Entity directory, mapping every active Entity to its specific
Archetype, the Chunk it lives in, and its exact row index.

Because of this directory, looking up an entity's components is an O(1) operation:
1. Extract the 32-bit index from the Entity ID.
2. Look up the _EntityRecord_.
3. Jump straight to the memory address in the chunk.

## Queries
As memory is chunked and packed, querying becomes trivial, and perfectly linear. The Query system extracts the raw array pointers
from the Chunk and executes a callback.

Even better, because Chunks are completely independent of one another, Curia supports zero-overhead multithreading.
```cpp
std::for_each(std::execution::par_unseq, work.begin(), work.end(), 
    // ... parallel chunk iteration
);
```
Though I did not state it as such, thread safety and multithreading capabilities are a core design trait of Curia (although
it can be improved, which I discuss later).

## The Command Buffer
Because structural changes (adding/removing components or entities) move data around, you cannot safely do this while iterating
over a Query.

Curia attempts to solve this with a simple CommandBuffer. Systems can defer structural changes by capturing operations in 
a _std::function_ lambda, protected by a mutex (issue!). Once the iteration phase is done, the world executes the buffer, applying all
changes safely in a single batch.

# Example Usage
Here is what setting up a basic simulation step looks like in Curia:
```cpp
#include "curia.hpp"

struct Position { float x, y; };
struct Velocity { float dx, dy; };

int main() {
    curia::World world;

    // Spawn 100,000 entities
    for (int i = 0; i < 100000; ++i) {
        curia::Entity e = world.create();
        world.add(e, Position{0.0f, 0.0f});
        world.add(e, Velocity{1.0f, 0.5f});
    }

    // Create a query
    auto movement_query = world.query<Position, Velocity>();

    // Execute across all available cores
    movement_query.par_each([](Position& pos, const Velocity& vel) {
        pos.x += vel.dx;
        pos.y += vel.dy;
    });

    return 0;
}
```

# Performance Results
To prove the cache-friendly nature of the Curia architecture, I ran a comprehensive test suite using Google Benchmark on a 
16-core CPU. The results perfectly demonstrate the fundamental trade-off of Archetype ECS, that is the structural mutations are
expensive, but the component iteration and lookups are sufficiently fast.

Here is the full results:
```
Run on (16 X 2918 MHz CPU s)
CPU Caches:
  L1 Data 48 KiB (x8)
  L1 Instruction 32 KiB (x8)
  L2 Unified 1280 KiB (x8)
  L3 Unified 24576 KiB (x1)
------------------------------------------------------------------------------------------------
Benchmark                                      Time             CPU   Iterations UserCounters...
------------------------------------------------------------------------------------------------
BM_EntityCreation/10000                   117308 ns       114443 ns         6690 items_per_second=87.3796M/s
BM_EntityCreation/100000                 2447456 ns      2287946 ns          280 items_per_second=43.7073M/s
BM_EntityCreation/1000000               30854927 ns     31250000 ns           22 items_per_second=32M/s
BM_EntityCreateWithComponents/10000      1505488 ns      1420455 ns          407 items_per_second=7.04M/s
BM_EntityCreateWithComponents/100000    21392543 ns     21114865 ns           37 items_per_second=4.736M/s
BM_EntityCreateWithComponents/1000000  504007900 ns    500000000 ns            1 items_per_second=2M/s
BM_IteratePositionVelocity/10000            7614 ns         7673 ns        89600 items_per_second=1.30327G/s
BM_IteratePositionVelocity/100000          90105 ns        88937 ns         8960 items_per_second=1.12439G/s
BM_IteratePositionVelocity/1000000       2052390 ns      1981027 ns          560 items_per_second=504.789M/s
BM_ParIteratePositionVelocity/10000        14231 ns         8161 ns        74667 items_per_second=1.2253G/s
BM_ParIteratePositionVelocity/100000       59445 ns        55804 ns        11200 items_per_second=1.792G/s
BM_ParIteratePositionVelocity/1000000     407261 ns       254981 ns         2635 items_per_second=3.92186G/s
BM_RandomGetComponent/10000                 3.61 ns         3.37 ns    194782609
BM_RandomGetComponent/100000                4.03 ns         3.44 ns    213333333
BM_RandomGetComponent/1000000               3.94 ns         3.74 ns    213333333
BM_EntityDestroy/10000                     59924 ns        51271 ns        14933 items_per_second=195.043M/s
BM_EntityDestroy/100000                   725805 ns       767299 ns         1120 items_per_second=130.327M/s
BM_EntityDestroy/1000000                10997675 ns      9375000 ns           75 items_per_second=106.667M/s
BM_AddComponent/10000                     984921 ns       823103 ns         1120 items_per_second=12.1492M/s
BM_AddComponent/100000                  12772958 ns     14160156 ns           64 items_per_second=7.06207M/s
BM_AddComponent/1000000                569972700 ns    500000000 ns            2 items_per_second=2M/s
BM_IterateWideArchetype/10000              11443 ns        10463 ns        74667 items_per_second=955.738M/s
BM_IterateWideArchetype/100000            192371 ns       188337 ns         4480 items_per_second=530.963M/s
BM_IterateWideArchetype/1000000          2357806 ns      2176339 ns          280 items_per_second=459.487M/s
```
One can see how good the iteration speeds are. Iterating over a million entities sequentially takes just under 2 milliseconds.
When we fan that exact same query out across 16 cores, it drops to a staggering 0.25 milliseconds. To put it into perspective,
that is functionally processing **4 billion items per second**. Because memory is perfectly contiguous in 16KB Chunks, thread contention
is non-existent, and the CPU cache is fully saturated with useful data.

In addition, each random lookup taking only approx. 4 nanoseconds confirm the O(1) directory lookup is working as intended.

Conversely, the benchmark exposes the issue of Archetype-based ECS: adding a component to a million existing entities takes half a second.
Every component addition requires moving data from one memory chunk to another. In a high-performance engine, one might mitigate this by avoiding
structural changes in the hot loop, treating component addition as a one-off initialization cost.

# Future Improvements
Although Curia's foundation is highly functional, there remain several key upgrades I want to make. These include:
- **Lock-Free and Alloc-Free Command Buffers**: The current Command Buffer uses _std::function_ and _std::mutex_, which introduces dynamic memory allocations and thread contention during parallel simulation steps. I need to replace this with a custom byte-stream bump allocator to allow lock-free, zero-alloc deferred commands.
- **Archetype Graph**: The benchmark showed that adding existing components is the biggest bottleneck. Currently, the ECS performs a linear search through existing archetypes when a signature changes. By implementing an Archetype graph, which is simply a hash map of state transitions, I could reduce the overhead of finding the target archetype to O(1).
- **Tags**: It can be useful to flag an entity with a state (e.g., 'IsFalling', 'IsDirty', 'IsPineapple') without actually attaching any data. I want to upgrade the ECS to support zero-sized tag components. This would, in theory, allow for super fast query filtering without wasting a single byte of chunk memory or requiring data movement during copies.

I intend to implement these changes/features, and release more blog parts describing in detail the work that was done, and the benchmarks.

# Conclusion
I hate writing conclusions in non-persuasive writings, so I will just cut to the chase. Working on Curia the last few days has
been a super cool project to work on, especially because it has provided me so much opportunity to work with modern C++ features.

If you are building a custom engine, I highly recommend using the archetype model for your ECS. It forces you to think about how your data actually
sits in RAM, and the performance rewards are well worth it.

Please feel free to take a look at my source code for Curia (linked below) and use it in your own projects. Ideally by just forking/using Curia, but honestly
feel free to copy-paste it and claim it as your own, however you see fit.

Stay tuned for future parts of this blog. Have a good day and don't die.

<linkbutton href="https://github.com/collinlongoria/curia-ecs" data-icon="github">All Source Code Here!</linkbutton>

<linkbutton href="https://collinlongoria.com/blog/building-an-ecs-part-two">Blog Part Two</linkbutton>