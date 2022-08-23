/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Subject } from 'rxjs';

import { ClrDatagridComparatorInterface } from '../interfaces/comparator.interface';
import { ClrDatagridFilterInterface } from '../interfaces/filter.interface';
import { FiltersProvider } from './filters';
import { Items } from './items';
import { Page } from './page';
import { Sort } from './sort';
import { StateDebouncer } from './state-debouncer.provider';

const ALL_ITEMS = [9, 3, 5, 8, 2, 6, 10, 7, 4, 1];

type User = { name: string };

export default function (): void {
  describe('Items provider', function () {
    function setSmartItems(itemsInstance: Items<number> | Items<User>) {
      itemsInstance.smartenUp();
      itemsInstance.all = ALL_ITEMS;
    }

    let filtersInstance: FiltersProvider;
    let pageInstance: Page;
    let evenFilter: EvenFilter;
    let sortInstance: Sort;
    let comparator: TestComparator;
    let itemsInstance: Items;

    beforeEach(function () {
      const stateDebouncer = new StateDebouncer();
      pageInstance = new Page(stateDebouncer);
      filtersInstance = new FiltersProvider(pageInstance, stateDebouncer);
      evenFilter = new EvenFilter();
      filtersInstance.add(evenFilter);
      sortInstance = new Sort(stateDebouncer);
      comparator = new TestComparator();
      itemsInstance = new Items(filtersInstance, sortInstance, pageInstance);
    });

    afterEach(function () {
      itemsInstance.destroy();
    });

    it('starts uninitialized', function () {
      expect(itemsInstance.smart).toBe(false);
      expect(itemsInstance.displayed.length).toBe(0);
      expect(pageInstance.totalItems).toBe(0);
      expect(pageInstance.firstItem).toBe(0);
      expect(pageInstance.lastItem).toBe(-1);
    });

    it("doesn't process the items at all if not smart", function () {
      itemsInstance.all = ALL_ITEMS;
      evenFilter.toggle();
      sortInstance.toggle(comparator);
      pageInstance.size = 3;
      // Yes, this is toBe() and no toEqual() because we want absolutely zero processing,
      // not even copying the array.
      expect(itemsInstance.displayed).toBe(ALL_ITEMS);
    });

    it("doesn't process the items if no filter, sort or pagination has been set", function () {
      setSmartItems(itemsInstance);
      expect(itemsInstance.displayed).toEqual(ALL_ITEMS);
      expect(pageInstance.totalItems).toBe(10); // totalItems is explicitly set
    });

    it('filters according to the Filter provider', function () {
      setSmartItems(itemsInstance);
      evenFilter.toggle();
      expect(itemsInstance.displayed).toEqual([8, 2, 6, 10, 4]);
      evenFilter.toggle();
      expect(itemsInstance.displayed).toEqual(ALL_ITEMS);
    });

    it('sorts according to the Sort provider', function () {
      setSmartItems(itemsInstance);
      sortInstance.toggle(comparator);
      expect(itemsInstance.displayed).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      sortInstance.toggle(comparator);
      expect(itemsInstance.displayed).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });

    it('slices according to the Page provider', function () {
      setSmartItems(itemsInstance);
      pageInstance.size = 3;
      expect(itemsInstance.displayed).toEqual([9, 3, 5]);
      pageInstance.current = 2;
      expect(itemsInstance.displayed).toEqual([8, 2, 6]);
      pageInstance.current = 4;
      expect(itemsInstance.displayed).toEqual([1]);
    });

    it('combines filtering, sorting and pagination', function () {
      setSmartItems(itemsInstance);
      evenFilter.toggle();
      sortInstance.toggle(comparator);
      pageInstance.size = 3;
      expect(itemsInstance.displayed).toEqual([2, 4, 6]);
    });

    it('processes items immediately when they are set', function () {
      itemsInstance.smartenUp();
      evenFilter.toggle();
      sortInstance.toggle(comparator);
      pageInstance.size = 3;
      itemsInstance.all = ALL_ITEMS;
      expect(itemsInstance.displayed).toEqual([2, 4, 6]);
    });

    it('does not modify the original array', function () {
      const copy = ALL_ITEMS.slice();
      setSmartItems(itemsInstance);
      evenFilter.toggle();
      sortInstance.toggle(comparator);
      pageInstance.size = 3;
      expect(ALL_ITEMS).toEqual(copy);
    });

    it('sets the total number of items after filters in the Page provider', function () {
      setSmartItems(itemsInstance);
      expect(pageInstance.totalItems).toBe(10);
      evenFilter.toggle();
      expect(pageInstance.totalItems).toBe(5);
    });

    it('gets -1 of firstItem and lastItem if gets 0 item after filtering', function () {
      const filter = new NegativeFilter();
      filtersInstance.add(filter);
      setSmartItems(itemsInstance);
      expect(pageInstance.totalItems).toBe(10);
      filter.toggle();
      expect(pageInstance.totalItems).toBe(0);
      expect(pageInstance.firstItem).toBe(-1);
      expect(pageInstance.lastItem).toBe(-1);
    });

    it('exposes an Observable to follow items changes', function () {
      let nbChanges = 0;
      let latestDisplayed: number[];
      itemsInstance.change.subscribe((items: number[]) => {
        nbChanges++;
        latestDisplayed = items;
      });
      expect(latestDisplayed).toBeUndefined();
      const unprocessed = [3, 1, 2];
      itemsInstance.all = unprocessed;
      expect(latestDisplayed).toBe(unprocessed);
      setSmartItems(itemsInstance);
      expect(latestDisplayed).toEqual(ALL_ITEMS);
      evenFilter.toggle();
      expect(latestDisplayed).toEqual([8, 2, 6, 10, 4]);
      sortInstance.toggle(comparator);
      expect(latestDisplayed).toEqual([2, 4, 6, 8, 10]);
      pageInstance.size = 3;
      expect(latestDisplayed).toEqual([2, 4, 6]);
      itemsInstance.all = [42];
      expect(latestDisplayed).toEqual([42]);
      expect(nbChanges).toBe(6);
    });

    it('does not emit items changes until the page size is available', function () {
      let nbChanges = 0;
      itemsInstance.change.subscribe(() => {
        nbChanges++;
      });
      pageInstance.activated = true;
      expect(nbChanges).toEqual(0);
      setSmartItems(itemsInstance);
      expect(nbChanges).toEqual(0);
      pageInstance.size = 3;
      expect(nbChanges).toEqual(1);
    });

    describe('manual refresh', function () {
      let users: User[];

      beforeEach(function () {
        users = [{ name: 'hello' }, { name: 'world' }];
        itemsInstance.smartenUp();
        itemsInstance.all = users;
      });

      it('forces refiltering', function () {
        const filter = new NameFilter();
        filtersInstance.add(filter);
        filter.search('o');
        users[0].name = 'zzz';
        expect(itemsInstance.displayed).toEqual([{ name: 'zzz' }, { name: 'world' }]);
        itemsInstance.refresh();
        expect(itemsInstance.displayed).toEqual([{ name: 'world' }]);
      });

      it('forces resorting', function () {
        const comparator = new NameComparator();
        sortInstance.toggle(comparator);
        users[0].name = 'zzz';
        expect(itemsInstance.displayed).toEqual([{ name: 'zzz' }, { name: 'world' }]);
        itemsInstance.refresh();
        expect(itemsInstance.displayed).toEqual([{ name: 'world' }, { name: 'zzz' }]);
      });

      /*
       * No need to test pagination, the only way it would change is due to data mutation
       * is if the filters themselves changed, which we already tested
       */
    });
  });
}

class EvenFilter implements ClrDatagridFilterInterface<number> {
  private active = false;

  toggle() {
    this.active = !this.active;
    this.changes.next(this.active);
  }

  isActive(): boolean {
    return this.active;
  }

  changes = new Subject<boolean>();

  accepts(n: number): boolean {
    return n % 2 === 0;
  }
}

class NegativeFilter implements ClrDatagridFilterInterface<number> {
  private active = false;

  toggle() {
    this.active = !this.active;
    this.changes.next(this.active);
  }

  isActive(): boolean {
    return this.active;
  }

  changes = new Subject<boolean>();

  accepts(n: number): boolean {
    return n < 0;
  }
}

class TestComparator implements ClrDatagridComparatorInterface<number> {
  compare(a: number, b: number): number {
    return a - b;
  }
}

class NameFilter implements ClrDatagridFilterInterface<User> {
  private _search = '';
  public search(value: string) {
    this._search = value;
    this.changes.next(value);
  }

  isActive(): boolean {
    return this._search.length > 0;
  }

  changes = new Subject<string>();

  accepts(user: User): boolean {
    return user.name.includes(this._search);
  }
}

class NameComparator implements ClrDatagridComparatorInterface<User> {
  compare(a: User, b: User): number {
    return a.name < b.name ? -1 : 1;
  }
}
