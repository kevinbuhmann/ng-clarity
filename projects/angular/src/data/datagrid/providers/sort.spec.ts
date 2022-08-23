/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { ClrDatagridComparatorInterface } from '../interfaces/comparator.interface';
import { Sort } from './sort';
import { StateDebouncer } from './state-debouncer.provider';

export default function (): void {
  describe('Sort provider', function () {
    let sortInstance: Sort;
    let comparator: TestComparator;

    beforeEach(function () {
      sortInstance = new Sort(new StateDebouncer());
      comparator = new TestComparator();
    });

    it('compares according to the current comparator', function () {
      sortInstance.comparator = comparator;
      expect(sortInstance.compare(1, 10)).toBeLessThan(0);
      expect(sortInstance.compare(4, 4)).toBe(0);
      expect(sortInstance.compare(42, 3)).toBeGreaterThan(0);
    });

    it('can reverse the order of the current comparator', function () {
      sortInstance.comparator = comparator;
      sortInstance.reverse = true;
      expect(sortInstance.compare(1, 10)).toBeGreaterThan(0);
      expect(sortInstance.compare(4, 4)).toBe(0);
      expect(sortInstance.compare(42, 3)).toBeLessThan(0);
    });

    it('exposes a toggle method to set the comparator', function () {
      sortInstance.toggle(comparator);
      expect(sortInstance.comparator).toBe(comparator);
      sortInstance.toggle(comparator, true);
      expect(sortInstance.comparator).toBe(comparator);
    });

    it('reverses the order when toggle is called on the same comparator', function () {
      // Ascending
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(false);
      // Descending
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(true);
      // Ascending again
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(false);
    });

    it('always uses descending order if forceReverse is set', function () {
      // Force descending
      sortInstance.toggle(comparator, true);
      expect(sortInstance.reverse).toBe(true);
      // No forcing, so should toggle from previous state
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(false);
      // Toggling to descending
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(true);
      // Force descending again
      sortInstance.toggle(comparator, true);
      expect(sortInstance.reverse).toBe(true);
    });

    it('always uses ascending order when toggling a new comparator ', function () {
      sortInstance.comparator = comparator;
      expect(sortInstance.reverse).toBe(false);
      sortInstance.toggle(new TestComparator());
      expect(sortInstance.reverse).toBe(false);
      sortInstance.toggle(comparator);
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(true);
      sortInstance.toggle(new TestComparator());
      expect(sortInstance.reverse).toBe(false);
    });

    it('always uses descending order if forceReverse is set even when toggling a new comparator ', function () {
      sortInstance.comparator = comparator;
      expect(sortInstance.reverse).toBe(false);
      sortInstance.toggle(new TestComparator(), true);
      expect(sortInstance.reverse).toBe(true);
      sortInstance.toggle(comparator);
      sortInstance.toggle(comparator);
      expect(sortInstance.reverse).toBe(true);
      sortInstance.toggle(new TestComparator());
      expect(sortInstance.reverse).toBe(false);
    });

    it('exposes an Observable to follow sort changes', function () {
      let nbChanges = 0;
      let latestComparator: ClrDatagridComparatorInterface<number>;
      let latestReverse: boolean;
      sortInstance.change.subscribe((sort: Sort<number>) => {
        nbChanges++;
        latestComparator = sort.comparator;
        latestReverse = sort.reverse;
      });
      sortInstance.toggle(comparator);
      expect(latestComparator).toBe(comparator);
      expect(latestReverse).toBe(false);
      sortInstance.reverse = true;
      expect(latestComparator).toBe(comparator);
      expect(latestReverse).toBe(true);
      sortInstance.toggle(comparator);
      expect(latestComparator).toBe(comparator);
      expect(latestReverse).toBe(false);
      const secondComparator = new TestComparator();
      sortInstance.toggle(secondComparator);
      expect(latestComparator).toBe(secondComparator);
      expect(latestReverse).toBe(false);
      expect(nbChanges).toBe(4);
    });
  });
}

class TestComparator implements ClrDatagridComparatorInterface<number> {
  compare(a: number, b: number): number {
    return a - b;
  }
}
