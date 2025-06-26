import { CactusClient, CactusHandler, INCOMING_EVENTS } from "./cactusSdk";

/**
 * Instructions:
 *
 * 1. Migrate the existing `eventHandler` function to a series of `handler.register(...)` calls
 * 2. Resolve any type errors (check w/ `npm run --silent typecheck`)
 * 3. Resolve any runtime errors (run code w/ `npm run --silent part-2`)
 * 4. Delete `eventHandler` entirely.
 *
 */

const client = new CactusClient();

// TODO: extend me!
const handler = new CactusHandler();

const eventHandler = (body: string): void => {
  const thinEvent = client.parseEventV2(body);

  if (thinEvent.type === "order.shipped") {
    const orderId = thinEvent.relatedObject.id;
    const order = client.retrieveOrder(orderId);
    console.log(
      `  Created a database record for ${orderId} w/ ${order.num_items} items`
    );
  } else if (thinEvent.type === "order.delivery_attempted") {
    const event = thinEvent.pull();
    console.log(
      `  Order ${event.relatedObject.id} has been delivered after ${event.data.attempt_num} attempt(s)!`
    );
  } else if (thinEvent.type === "order.lost") {
    const event = thinEvent.pull();
    console.log(
      `  An order was last seen in ${event.data.last_seen_city}... we have no additional information`
    );
  } else if (thinEvent.type === "movie.started") {
    const movie = thinEvent.fetchRelatedObject();
    console.log(`  Someone started watching ${movie.title}`);
  } else if (thinEvent.type === "movie.completed") {
    const event = thinEvent.pull();
    const movie = thinEvent.fetchRelatedObject();
    console.log(
      `  ${event.data.user} just finished ${movie.title} and rated it ${event.data.rating}/4`
    );
  } else {
    // @ts-ignore - there are other possible events, just not ones TS knows about
    throw new Error(`Unhandled event w/ type "${thinEvent.type}"`);
  }
};

INCOMING_EVENTS.forEach((body, idx) => {
  console.log(`\n== parsing event ${idx}`);
  try {
    handler.handle(body);
  } catch (e) {
    console.log(`  failed to handle: ${body}\n`);
    throw e;
  }
});
