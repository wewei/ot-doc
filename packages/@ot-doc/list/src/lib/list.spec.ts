import { list } from './list';

describe('List', () => {
  describe('List#isEmpty', () => {
    it('should return whether the list is empty', () => {
      const lst = list<number>();
      expect(lst.isEmpty()).toBe(true);

      const del0 = lst.add(0);
      expect(lst.isEmpty()).toBe(false);

      del0();
      expect(lst.isEmpty()).toBe(true);
    });
  });

  describe('List#toArray', () => {
    it('should return an empty array on initial list', () => {
      const lst = list<number>();
      expect(lst.toArray()).toEqual([]);
    });

    it('should return an array of the elements in the list', () => {
      const lst = list<number>();
      const dels =  [0, 1, 2, 3].map(lst.add);

      expect(lst.toArray()).toEqual([0, 1, 2 ,3]);

      dels[1]();
      expect(lst.toArray()).toEqual([0, 2, 3]);
    });
  });

  describe('List#clear', () => {
    it('should empty the list', () => {
      const lst = list<number>();
      [0, 1, 2, 3].forEach(lst.add);

      expect(lst.toArray()).toEqual([0, 1, 2, 3]);

      lst.clear();
      expect(lst.toArray()).toEqual([]);
      expect(lst.isEmpty()).toBe(true);
    });
  });

  describe('List#add', () => {
    it('should add item to the list, and return a deleter', () => {
      const lst = list<number>();
      const dels = [0, 1, 2, 3].map(lst.add);

      expect(lst.toArray()).toEqual([0, 1, 2, 3]);

      dels.forEach(del => del());
      expect(lst.toArray()).toEqual([]);
    });

    it('should ignore double deletions', () => {
      const lst = list<number>();
      const dels = [0, 1, 2, 3].map(lst.add);

      dels[2]();
      expect(lst.toArray()).toEqual([0, 1, 3]);

      dels[2]();
      expect(lst.toArray()).toEqual([0, 1, 3]);

      const del2 = lst.add(2);
      expect(lst.toArray()).toEqual([0, 1, 3, 2]);

      lst.add(4);
      expect(lst.toArray()).toEqual([0, 1, 3, 2, 4]);

      del2();
      del2();
      expect(lst.toArray()).toEqual([0, 1, 3, 4]);
    });

  });

});
