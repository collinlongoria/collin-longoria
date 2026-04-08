---
title: "Building an ECS: Part Two"
date: 2026-3-11
summary: Alloc-Free and Lock-Free Command Buffer
tags: [Tech, C++, Game Engine, ECS]
coverImage: "/building_an_ecs/part_two.png"
---

# Introduction
Welcome back. I am currently at GDC, but felt like getting out the next part of
this blog. I am about three blog posts ahead in terms of actual work, and need to do some catchup.
In Part One of this series, I introduced you to Curia, an archetype-based Entity Component System written in
C++23. In it, we covered how strict memory contiguity via Chunks gives us super duper fast query iteration.

However, at the end of that post, I confessed a dirty secret about Curia's architecture: the Command Buffer sucks a little bit. Because
Archetpye ECS models require moving data between memory blocks whenever an entity's signature changes, you cannot safely add or remove
components while iterating over queries. I can solve this by deferring those structural changes.

But my original solution was flawed, and required some fixes. Today, I'm exploring my journey in building a lock-free, alloc-free command buffer, the mistakes I ended up making, 
and what actually ended up working for me an, hopefully, for you.

# The Original Sin
Here is a simple look at how the Command Buffer was implemented in Part One:
```cpp
class CommandBuffer {
    std::vector<std::function<void(World&)>> deferred_commands;
    std::mutex cmd_mutex;
    // ...
    template <IsValidComponent T>
    void deferred_add(Entity e, T data) {
        std::lock_guard<std::mutex> lock(cmd_mutex);
        deferred_commands.push_back([e, data](World& world) {
            world.add<T>(e, data);
        });
    }
};
```
Any cracked C++ developer can see the performance issues here:
1. **Thread Contention**: When iterating over queries across 16 cores, multiple threads trying to defer commands will violently collide at the ``std::mutex``.
2. **Hidden Allocations**: `std::function`` is a type-erased wrapper. If the captured lambda is larger than the small-object optimization buffer, it allocated on the heap. This could be potentially done thousands of times per frame.

In short, I needed a solution that required zero locks and zero heap allocations.

# My First Attempt
My first attempt here was to ditch ```std::function``` entirely and write commands into a raw, pre-allocated byte buffer.

I allocated a massive 2MB ``std::unique_ptr<std::byte[]>`` buffer. To keep it lock-free, I used a ``std::atomic<size_t>`` for the write offset.
When a thread wants to defer a command, it just calls ``fetch_add`` on the atomic offset, claims its block of memory, and writes a header (containing the function pointer and payload size)
followed by the raw component data.
```cpp
size_t alloc_size = align_up(payload_size);
size_t current_offset = write_offset.fetch_add(alloc_size, std::memory_order_relaxed);

std::byte* cmd_ptr = buffer.get() + current_offset;

auto* header = reinterpret_cast<CommandHeader*>(cmd_ptr);
header->size = alloc_size;
header->exec = [](World& world, std::byte* ptr) { /* ... */ };
```
In theory, this worked as I wanted it to. It was entirely lock-free with no mutex, and because the buffer was pre-allocated, it was at least alloc-free during the hot loop.

But the benchmarks painted a different picture. As you can see in the performance table below, adding components actually got _slower_ in some cases. When testing large component addition
batches, the original impl was hitting roughly 8.17 million items per second. This solution dropped that to 6.64 million items per second (which is arguably still good, but objectively magnitudes worse).

The issue, I think, is execution. Reading through a heterogeneous byte buffer means executing a different function pointer for every single command. The instruction cache was likely getting thrashed, and
the CPU couldn't predict the branches or inline the execution logic. I had solved the threading problem, but created what was essentially an execution bottleneck.

# My Second Attempt
Taking a step back, I thought about ways I could increase branch prediction robustly. I figured the best way to go about this was, instead of interleaving different
commands into one giant byte buffer stream, I group them by component type.

To do this, I created an ``IQueue`` interface and a ``TypedQueue<T>`` impl. Each component type gets its own queue, holding a simple ``std::vector`` of ``std::pair<Entity, T>``.
```cpp
template <IsValidComponent T>
struct TypedQueue final : IQueue {
    std::vector<std::pair<Entity, T>> adds;
    std::vector<Entity> removes;

    void execute(World& world) override {
        for (auto& [e, data] : adds) {
            world.add<T>(e, std::move(data)); // <- Note this is likely to get fully inlined...
        }
        // ...
    }
};
```
Because ``TypedQueue<T>`` knows the exact type at compile time, the compiler can completely inline the ``world.add<T>`` calls during execution. The data is processed
sequentially, which is incredibly cache-friendly.

# Benchmarks
Here are the benchmark comparisons, tested on the same 16-core CPU as part one. I'm focusing just on structural mutations for this part, as the query iteration speeds
remained largely unaffected across all versions.

| Benchmark | Original        | Attempt 1       | Attempt 2           |
| :--- |:----------------|:----------------|:--------------------|
| **`BM_EntityCreateWithComponents/10000`** | 4.33M items/s   | 4.65M items/s   | **14.33M items/s**  |
| **`BM_EntityCreateWithComponents/100000`** | 3.49M items/s   | 3.52M items/s   | **8.33M items/s**   |
| **`BM_AddComponent/10000`** | 8.17M items/s   | 6.64M items/s   | **31.02M items/s**  |
| **`BM_AddComponent/100000`** | 5.43M items/s   | 4.97M items/s   | **11.37M items/s**  |
| **`BM_EntityDestroy/10000`** | 113.77M items/s | 120.75M items/s | **139.13M items/s** |
| **`BM_CommandBufferAdd/10000`** | N/A             | N/A             | **12.41M items/s**  |

The results from attempt two are exactly what I wanted to see. Creating 10,000 entities with components went from 4.33 million items per second to 14.33 million items per second.
Adding components to existing entities saw a whopping 3.8x speedup!

# Lessons Learned
Data layout absolutely matters just as much for the commands that mutate the ECS as it does for the ECS itself!!! A heterogeneous stream of commands
ruins branch prediction. Grouping identical operations together allows the compiler to do what it is made to do.

Now there is a downside to my final attempt, which is obviously that I gave up the instant lock-free atomics of the first attempt. Calling ``push_back`` on
a vector is not inherently thread-safe. To make it fully parallel-safe without locks, I will need to upgrade it to use thread-local ``TypedQueue`` instances
that merge their results at the end of the frame.

But given the massive performance ceiling I reached, I think I figured out the right path forward in the end.

Next up, I will be attempting to implement a robust Archetype Graph to reduce the O(N) linear search overhead when components actually transition.

Stay tuned, and remember: this blog post was brought to you by the number 7 and the letter Y.

<linkbutton href="https://github.com/collinlongoria/curia-ecs" data-icon="github">All Source Code Here!</linkbutton>