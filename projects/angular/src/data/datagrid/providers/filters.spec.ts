/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Subject } from 'rxjs';

import { ClrDatagridFilterInterface } from '../interfaces/filter.interface';
import { FiltersProvider, RegisteredFilter } from './filters';
import { Page } from './page';
import { StateDebouncer } from './state-debouncer.provider';

export default function (): void {
  describe('FiltersProvider provider', function () {
    let filtersInstance: FiltersProvider;
    let evenFilter: EvenFilter;
    let positiveFilter: PositiveFilter;

    beforeEach(function () {
      const stateDebouncer = new StateDebouncer();
      filtersInstance = new FiltersProvider(new Page(stateDebouncer), stateDebouncer);
      evenFilter = new EvenFilter();
      positiveFilter = new PositiveFilter();
      filtersInstance.add(evenFilter);
      filtersInstance.add(positiveFilter);
    });

    it('detects if it has active filters', function () {
      expect(filtersInstance.hasActiveFilters()).toBe(false);
      evenFilter.toggle();
      expect(filtersInstance.hasActiveFilters()).toBe(true);
      evenFilter.toggle();
      expect(filtersInstance.hasActiveFilters()).toBe(false);
    });

    it('can return a list of active filters', function () {
      expect(filtersInstance.getActiveFilters()).toEqual([]);
      evenFilter.toggle();
      expect(filtersInstance.getActiveFilters()).toEqual([evenFilter]);
      positiveFilter.toggle();
      expect(filtersInstance.getActiveFilters()).toEqual([evenFilter, positiveFilter]);
      evenFilter.toggle();
      expect(filtersInstance.getActiveFilters()).toEqual([positiveFilter]);
    });

    it('ignores inactive filters', function () {
      expect(filtersInstance.accepts(-1)).toBe(true);
      expect(filtersInstance.accepts(-2)).toBe(true);
      expect(filtersInstance.accepts(1)).toBe(true);
      expect(filtersInstance.accepts(2)).toBe(true);
    });

    it('uses all active filters', function () {
      positiveFilter.toggle();
      expect(filtersInstance.accepts(-1)).toBe(false);
      expect(filtersInstance.accepts(-2)).toBe(false);
      expect(filtersInstance.accepts(1)).toBe(true);
      expect(filtersInstance.accepts(2)).toBe(true);
      evenFilter.toggle();
      expect(filtersInstance.accepts(-1)).toBe(false);
      expect(filtersInstance.accepts(-2)).toBe(false);
      expect(filtersInstance.accepts(1)).toBe(false);
      expect(filtersInstance.accepts(2)).toBe(true);
    });

    it('exposes an Observable that proxies all filters changes', function () {
      let nbChanges = 0;
      let latestChanges: ClrDatagridFilterInterface<number>[];
      filtersInstance.change.subscribe((changes: ClrDatagridFilterInterface<number>[]) => {
        nbChanges++;
        latestChanges = changes;
      });
      expect(latestChanges).toBeUndefined();
      evenFilter.toggle();
      expect(latestChanges).toEqual([evenFilter]);
      positiveFilter.toggle();
      expect(latestChanges).toEqual([positiveFilter]);
      evenFilter.toggle();
      expect(latestChanges).toEqual([evenFilter]);
      expect(nbChanges).toBe(3);
    });

    it('un-registers an inactive filter', function () {
      const filter = new InactiveFilter();
      const registerInactiveFilter = filtersInstance.add(filter);
      let nbChanges = 0;
      filtersInstance.change.subscribe(() => nbChanges++);
      filter.toggle();
      expect(filtersInstance.getActiveFilters()).toEqual([]);
      expect(nbChanges).toBe(1);
      registerInactiveFilter.unregister();
      expect(filtersInstance.getActiveFilters()).toEqual([]);
      expect(nbChanges).toBe(1);
      filter.toggle();
      expect(nbChanges).toBe(1);
    });

    it('un-registers an active filter', function () {
      const filter = new EvenFilter();
      const registeredFilter = filtersInstance.add(filter);
      let nbChanges = 0;
      filtersInstance.change.subscribe(() => nbChanges++);
      filter.toggle();
      expect(filtersInstance.getActiveFilters()).toEqual([filter]);
      expect(nbChanges).toBe(1);
      registeredFilter.unregister();
      expect(filtersInstance.getActiveFilters()).toEqual([]);
      expect(nbChanges).toBe(2);
      filter.toggle();
      expect(nbChanges).toBe(2);
    });

    it('correctly updates hasUnregistered property', function () {
      const filter = new ActiveFilter();
      const filter2 = new ActiveFilter();
      const filter3 = new ActiveFilter();
      let nbChanges = 0;
      filtersInstance.change.subscribe(() => nbChanges++);

      filtersInstance.add(filter);
      const registeredFilterTest = filtersInstance.add(filter2);
      filtersInstance.add(filter3);
      expect(nbChanges).toBe(3);

      registeredFilterTest.unregister();
      registeredFilterTest.unregister();
      expect(nbChanges).toBe(4);

      const filters = filtersInstance.getActiveFilters();
      expect(filters.length).toBe(2);
    });
  });

  describe('FiltersProvider provider unregisters filters correctly', function () {
    let filtersInstance: FiltersProvider;
    let registeredFilters: RegisteredFilter<any, NumFilter>[];

    beforeEach(function () {
      const stateDebouncer = new StateDebouncer();
      filtersInstance = new FiltersProvider(new Page(stateDebouncer), stateDebouncer);
      registeredFilters = [];
      for (let i = 0; i < 8; i++) {
        registeredFilters.push(filtersInstance.add(new NumFilter(i)));
      }
    });

    it('should unregister the designated filters', function () {
      expect(registeredFilters.length).toBe(filtersInstance.getActiveFilters().length);

      registeredFilters[0].unregister();
      registeredFilters[2].unregister();
      registeredFilters[4].unregister();
      registeredFilters[6].unregister();

      expect(filtersInstance.getActiveFilters().length).toBe(registeredFilters.length - 4);
      expect(filtersInstance.getActiveFilters()[0]).toEqual(registeredFilters[1].filter);
      expect(filtersInstance.getActiveFilters()[1]).toEqual(registeredFilters[3].filter);
      expect(filtersInstance.getActiveFilters()[2]).toEqual(registeredFilters[5].filter);
      expect(filtersInstance.getActiveFilters()[3]).toEqual(registeredFilters[7].filter);
    });
  });
}

abstract class TestFilter implements ClrDatagridFilterInterface<number> {
  private active = false;

  toggle() {
    this.active = !this.active;
    this.changes.next(this.active);
  }

  isActive(): boolean {
    return this.active;
  }

  changes = new Subject<boolean>();

  abstract accepts(n: number): boolean;
}

class EvenFilter extends TestFilter {
  accepts(n: number): boolean {
    return n % 2 === 0;
  }
}

class PositiveFilter extends TestFilter {
  accepts(n: number): boolean {
    return n > 0;
  }
}

class InactiveFilter extends TestFilter {
  isActive(): boolean {
    return false;
  }

  accepts(n: number): boolean {
    return n > 0;
  }
}

class ActiveFilter extends TestFilter {
  isActive(): boolean {
    return true;
  }

  accepts(n: number): boolean {
    return n > 0;
  }
}

class NumFilter extends TestFilter {
  indexNumber: number;
  constructor(_indexNumber: number) {
    super();
    this.indexNumber = _indexNumber;
  }
  accepts(n: number): boolean {
    return n % 2 === 0;
  }
  isActive(): boolean {
    return true;
  }
}
