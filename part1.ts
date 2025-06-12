import {
  CactusClient,
  INCOMING_EVENTS,
  type OrderLostEvent,
  type OrderShippedEvent,
} from "./cactusSdk";

/**
 * Instructions:
 *
 * 1. Swap `parseEventV1()` to `parseEventV2()`
 * 2. Resolve any type errors (check w/ `npm run --silent typecheck`)
 * 3. Remove any manual casts (`as ...`)
 * 4. Resolve any runtime errors (run code w/ `npm run --silent part-1`)
 * 5. Add a new handler branch for the `movie.completed` event. It should print the user's rating and the movie's title. Bear in mind that some data is on the event itself while other data is on the related object.
 *
 */

const client = new CactusClient();

const eventHandler = (body: string): void => {
  const thinEvent = client.parseEventV1(body);

  if (thinEvent.type === "order.shiped") {
    const orderId = thinEvent.relatedObject.id;
    const order = client.retrieveOrder(orderId);
    console.log(
      `  Created a database record for ${orderId} w/ ${order.num_items} items`
    );
  } else if (thinEvent.type === "order.delivery_attempted") {
    const event = client.retrieveEvent(thinEvent.id) as OrderShippedEvent;
    console.log(
      `  Order ${event.relatedObject.id} has been delivered after ${event.data.attempt_num} attempt(s)!`
    );
  } else if (thinEvent.type === "order.lost") {
    const orderId = thinEvent.relatedObject.id;
    const event = client.retrieveEvent(thinEvent.id) as OrderLostEvent;
    const order = client.retrieveOrder(orderId);
    console.log(
      `  An order was last seen in ${event.data.last_seen_city}... we have no additional information`
    );
  } else if (thinEvent.type === "movie.started") {
    const movieId = thinEvent.relatedObject.id;
    const movie = client.retrieveOrder(movieId);
    console.log(`  Someone started watching ${movie.title}`);
  } else {
    throw new Error(`Unhandled event w/ type "${thinEvent.type}"`);
  }
};

INCOMING_EVENTS.forEach((ev, idx) => {
  console.log(`\n== parsing event ${idx}`);
  try {
    eventHandler(ev);
  } catch (e) {
    console.log(`  failed to handle: ${ev}\n`);
    throw e;
  }
});
