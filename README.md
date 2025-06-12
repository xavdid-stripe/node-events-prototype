# Python Events Prototype

![](./misc/cactus.jpg)

Welcome to your first day at the Cactus Corporation! As you probably know, we've got two main product offerings: a shipping business and a movie streaming service.

To help our users keep track of the state of their account, we've recently launched CactusEvents. These are small webhook payloads that get sent when something changes in the user's account.

Initial user response has been good, but we strive to be the sharpest needle in the cactus and we haven't won yet. Specifically, we want to improve the experience of handling incoming events and are looking for fresh-eyed feedback.

## Docs

Cactus Corp sends "thin" events to our users, which contain minimal info but provide tools to fetch the full event data. Here is the full documentation for those shapes.

### Objects

We send events related to the the following object types:

```ts
interface Order {
  id: string;
  created: string;
  num_items: number;
  cost_cents: number;
  delivery_date: string;
}

interface Movie {
  id: string;
  title: string;
  release_year: number;
}
```

### Event Types

With our new V2 event parsing system, we've got classes for every event type. We send you the "pushed" version and you can "pull" the full version. They're identical **except** the pull version includes the event's `Data`

| type                       | related object | data properties                               |
| -------------------------- | -------------- | --------------------------------------------- |
| `order.shipped`            | `Order`        | `shipping_service`                            |
| `order.delivery_attempted` | `Order`        | `success`, `attempt_num`, `delivery_location` |
| `order.lost`               | None           | `last_seen_city`                              |
| `movie.started`            | `Movie`        | `date`                                        |
| `movie.completed`          | `Movie`        | `user`, `rating`                              |

#### Instance Methods

Each "pushed" event supports the following methods:

```ts
{
  /**
   * returns the full event type corresponding to this push event
   */
  pull();

  /**
   * retrieves the related object by id, if applicable
   */
  fetchRelatedObject();
}
```

### Client

The `CactusClient` is a convenient way to fetch data from CactusCorp. It handles authentication, retries, etc. It's got the following shape:

```ts
{
  /**
   * @deprecated
   */
  parseEventV1(body: string): GenericThinEvent

  parseEventV2(body: string): PushedThinEvent

  retrieveEvent(id: string): ThinEvent

  retrieveOrder(id: string): Order

  retrieveMovie(id: string): Movie
}
```

## Part 1

Today, you'll be using your cactus expertise to help a user fix bugs in their webhook handling code. It's been throwing runtime errors and they're struggling to resolve them. They've also been ignoring a lot of in-editor warnings, so that's probably related.

Please:

1. Swap `parseEventV1()` to `parseEventV2()`
2. Resolve any type errors (check w/ `npm run --silent typecheck`)
3. Remove any manual casts (`as ...`)
4. Resolve any runtime errors (run code w/ `npm run --silent part-1`)
5. Add a new handler branch for the `movie.completed` event. It should print the user's rating and the movie's title. Bear in mind that some data is on the event itself while other data is on the related object.

## Part 2

In the pursuit of even better event handling, we're working on a prototype `CactusHandler` that will make event handling _even_ easier. We're focusing on eliminating the manual type casts and abstracting away some of the complexity that comes with handling events.

It's a callback-based design. The `handle` function takes the incoming request body and calls the matching callback. For instance:

```ts
const handler = new CactusHandler().register("some.event", (thinEvent) => {
  console.log("handling", thinEvent.type);
});

handler.handle('{"type": "some.event"}'); // prints our line
```

For part 2, we'd like to migrate our handler from part 1 to this newer style. To do that:

1. Migrate the existing `eventHandler` function to a series of `handler.register(...)` calls
2. Resolve any type errors (check w/ `npm run --silent typecheck`)
3. Resolve any runtime errors (run code w/ `npm run --silent part-1`)
4. Delete `eventHandler` entirely.

When you're done, we'll talk about this new approach and compare the two.
