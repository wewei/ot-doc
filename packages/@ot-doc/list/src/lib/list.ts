const HEAD_VALUE = Symbol();

type Item<T> = {
  value: T | typeof HEAD_VALUE;
  prev: Item<T>;
  next: Item<T>;
};

export type Del = () => void;

export type List<T> = {
  isEmpty(): boolean;
  toArray(): T[];
  add(value: T): Del;
  clear(): void;
};

export function list<T>(): List<T> {
  const head = { value: HEAD_VALUE } as Item<T>;
  const close = (item: Item<T>) => {
    item.prev = item.next = item;
  };

  const clear = () => close(head);

  const isEmpty = () => head.prev === head;

  const toArray = () => {
    const arr: T[] = [];
    let iter = head.next;
    while (iter.value !== HEAD_VALUE) {
      arr.push(iter.value);
      iter = iter.next;
    }
    return arr;
  };

  const add = (value: T) => {
    const item = { value, prev: head.prev, next: head };
    head.prev = head.prev.next = item;
    return () => {
      item.prev.next = item.next;
      item.next.prev = item.prev;
      close(item);
    };
  }

  clear();

  return { isEmpty, toArray, clear, add };
}
