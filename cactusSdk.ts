// == base interfaces
export interface RelatedObject {
  id: string;
  type: string;
}

export interface BaseThinEvent {
  id: string;
  type: string;
}

export interface GenericThinEvent extends BaseThinEvent {
  relatedObject?: RelatedObject;
}

// == objects
export interface Order {
  id: string;
  created: string;
  num_items: number;
  cost_cents: number;
  delivery_date: string;
}

export interface Movie {
  id: string;
  title: string;
  release_year: number;
}

// == events
export interface OrderShippedPushedEvent extends BaseThinEvent {
  type: "order.shipped";
  relatedObject: RelatedObject;
  pull(): OrderShippedEvent;
  fetchRelatedObject(): Order;
}
export interface OrderShippedData {
  shipping_service: string;
}
export interface OrderShippedEvent extends OrderShippedPushedEvent {
  data: OrderShippedData;
}

export interface OrderDeliveryAttemptedPushedEvent extends BaseThinEvent {
  type: "order.delivery_attempted";
  relatedObject: RelatedObject;
  pull(): OrderDeliveryAttemptedEvent;
  fetchRelatedObject(): Order;
}
export interface OrderDeliveryAttemptedData {
  success: boolean;
  attempt_num: number;
  delivery_location: string;
}
export interface OrderDeliveryAttemptedEvent
  extends OrderDeliveryAttemptedPushedEvent {
  data: OrderDeliveryAttemptedData;
}

export interface OrderLostPushedEvent extends BaseThinEvent {
  type: "order.lost";
  pull(): OrderLostEvent;
}
export interface OrderLostData {
  last_seen_city: string;
}
export interface OrderLostEvent extends OrderLostPushedEvent {
  data: OrderLostData;
}

export interface MovieStartedPushedEvent extends BaseThinEvent {
  type: "movie.started";
  relatedObject: RelatedObject;
  pull(): MovieStartedEvent;
  fetchRelatedObject(): Movie;
}
export interface MovieStartedData {
  date: string;
}
export interface MovieStartedEvent extends MovieStartedPushedEvent {
  data: MovieStartedData;
}

export interface MovieCompletedPushedEvent extends BaseThinEvent {
  type: "movie.completed";
  relatedObject: RelatedObject;
  pull(): MovieCompletedEvent;
  fetchRelatedObject(): Movie;
}
export interface MovieCompletedData {
  user: string;
  rating: number;
}
export interface MovieCompletedEvent extends MovieCompletedPushedEvent {
  data: MovieCompletedData;
}

export type PushedThinEvent =
  | OrderShippedPushedEvent
  | OrderDeliveryAttemptedPushedEvent
  | OrderLostPushedEvent
  | MovieStartedPushedEvent
  | MovieCompletedPushedEvent;

export type ThinEvent =
  | OrderShippedEvent
  | OrderDeliveryAttemptedEvent
  | OrderLostEvent
  | MovieStartedEvent
  | MovieCompletedEvent;

export class CactusClient {
  /**
   * @deprecated
   */
  parseEventV1(body: string): GenericThinEvent {
    const { id, type, relatedObject } = JSON.parse(body);
    return { id, type, relatedObject };
  }

  parseEventV2(body: string): PushedThinEvent {
    const o = this.parseEventV1(body);

    const pull = () => this.retrieveEvent(o.id);
    const fetchRelatedObject = () => {
      if (!o.relatedObject?.id) {
        throw new Error("no related object!");
      }
      const relatedObj = DATABASE[o.relatedObject.id];
      if (!relatedObj) {
        throw new Error(
          `failed to find related object for id ${o.relatedObject.id}`
        );
      }
      return relatedObj;
    };

    return {
      ...o,
      // @ts-expect-error - we're just always returning a method; types cover it
      pull,
      // @ts-expect-error - we're just always returning a method; types cover it
      fetchRelatedObject,
    };
  }

  retrieveEvent(id: string): ThinEvent {
    if (!id.startsWith("evt_")) {
      throw new Error(`Unable to fetch event with invalid id: ${id}`);
    }

    const event = DATABASE[id] as ThinEvent | undefined;
    if (!event) {
      throw new Error(`404: event ${id} not found`);
    }
    if ("relatedObject" in event) {
      event.fetchRelatedObject = () => DATABASE[event.relatedObject.id] as any;
    }

    return event;
  }

  retrieveOrder(id: string): Order {
    if (!id.startsWith("ord_")) {
      throw new Error(`Unable to fetch order with invalid id: ${id}`);
    }

    const order = DATABASE[id] as Order | undefined;
    if (!order) {
      throw new Error(`404: order ${id} not found`);
    }

    return order;
  }

  retrieveMovie(id: string): Movie {
    if (!id.startsWith("mov_")) {
      throw new Error(`Unable to fetch movie with invalid id: ${id}`);
    }

    const movie = DATABASE[id] as Movie | undefined;
    if (!movie) {
      throw new Error(`404: movie ${id} not found`);
    }

    return movie;
  }
}

type EventTypes = PushedThinEvent["type"];
type Handler<T extends EventTypes> = (
  thinEvent: T extends "order.shipped"
    ? OrderShippedPushedEvent
    : T extends "order.delivery_attempted"
    ? OrderDeliveryAttemptedPushedEvent
    : T extends "order.lost"
    ? OrderLostPushedEvent
    : T extends "movie.started"
    ? MovieStartedPushedEvent
    : T extends "movie.completed"
    ? MovieCompletedPushedEvent
    : BaseThinEvent
) => void;

export class CactusHandler {
  private handlers: Partial<Record<EventTypes, Handler<EventTypes>>> = {};

  handle(body: string) {
    const event = new CactusClient().parseEventV2(body);

    const handler = this.handlers[event.type];

    if (handler) {
      handler(event);
    } else {
      this.onOther(event);
    }
  }

  onOther(event: PushedThinEvent) {
    throw new Error(`unhnandled event of type: "${event.type}"`);
  }

  /**
   * Add a new event handler
   */
  register<T extends EventTypes>(eventType: T, handler: Handler<T>): this {
    if (eventType in this.handlers) {
      throw new Error(
        `can't re-register handler for event type "${eventType}"`
      );
    }
    this.handlers[eventType] = handler;
    return this;
  }
}

// Sample database
const DATABASE: Record<string, ThinEvent | Order | Movie> = {
  evt_441: {
    id: "evt_441",
    type: "order.shipped",
    relatedObject: { id: "ord_452", type: "order" },
    data: { shipping_service: "usps" },
  } as OrderShippedEvent,
  evt_631: {
    id: "evt_631",
    type: "order.delivery_attempted",
    relatedObject: { id: "ord_452", type: "order" },
    data: { success: true, attempt_num: 2, delivery_location: "front porch" },
  } as OrderDeliveryAttemptedEvent,
  evt_849: {
    id: "evt_849",
    type: "order.lost",
    data: { last_seen_city: "Boulder" },
  } as OrderLostEvent,
  evt_509: {
    id: "evt_509",
    type: "movie.started",
    relatedObject: { id: "mov_261", type: "movie" },
    data: { date: "2025-06-01" },
  } as MovieStartedEvent,
  evt_606: {
    id: "evt_606",
    type: "movie.completed",
    relatedObject: { id: "mov_261", type: "movie" },
    data: { user: "usr_223", rating: 4 },
  } as MovieCompletedEvent,
  ord_452: {
    id: "ord_452",
    created: "2025-05-09",
    num_items: 5,
    cost_cents: 300,
    delivery_date: "2025-06-09",
  } as Order,
  mov_261: {
    id: "mov_261",
    title: "Kung Fu Panda",
    release_year: 2008,
  } as Movie,
};

// Sample incoming events
export const INCOMING_EVENTS = Object.values(DATABASE)
  .filter((item): item is ThinEvent => "type" in item)
  // @ts-expect-error - related object exists enough
  .map(({ id, type, relatedObject }) =>
    JSON.stringify({ id, type, relatedObject })
  );
