/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Subscription } from 'rxjs';

import { Page } from './page';
import { StateDebouncer } from './state-debouncer.provider';

export default function (): void {
  describe('Page provider', function () {
    let subscriptions: Subscription[] = [];
    let pageInstance: Page;

    beforeEach(function () {
      pageInstance = new Page(new StateDebouncer());
    });

    afterEach(function () {
      subscriptions.forEach(sub => sub.unsubscribe());
      subscriptions = [];
    });

    it('has page size 0 by default', function () {
      expect(pageInstance.size).toBe(0);
    });

    it('starts at page 1', function () {
      expect(pageInstance.current).toBe(1);
    });

    it('computes the last page', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 42;
      expect(pageInstance.last).toBe(5);
    });

    it('computes the indexes of the first and last displayed items', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 42;
      pageInstance.current = 3;
      expect(pageInstance.firstItem).toBe(20);
      expect(pageInstance.lastItem).toBe(29);
    });

    it('returns -1 for the firstItem and lastItem of none items', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 0;
      pageInstance.current = 1;
      expect(pageInstance.firstItem).toBe(-1);
      expect(pageInstance.lastItem).toBe(-1);
    });

    it("doesn't paginate when size is 0", function () {
      pageInstance.next();
      expect(pageInstance.current).toBe(1);
    });

    it('moves to the new last page when the number of items becomes too small', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 42;
      pageInstance.current = 4;
      expect(pageInstance.current).toBe(4);
      pageInstance.totalItems = 20;
      expect(pageInstance.current).toBe(2);
    });

    it('updates the current page when page size changes', function () {
      pageInstance.size = 20;
      pageInstance.totalItems = 42;
      pageInstance.current = 2;
      expect(pageInstance.current).toBe(2);
      pageInstance.size = 10;
      expect(pageInstance.current).toBe(3);
      pageInstance.size = 0;
      expect(pageInstance.current).toBe(1);
    });

    it("correctly uses the last item's index if the last page is not full", function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 42;
      pageInstance.current = 5;
      expect(pageInstance.lastItem).toBe(41);
    });

    it('offers a method to safely move to the next page', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 15;
      expect(pageInstance.current).toBe(1);
      pageInstance.next();
      expect(pageInstance.current).toBe(2);
      pageInstance.next();
      expect(pageInstance.current).toBe(2);
    });

    it('offers a method to safely move to the previous page', function () {
      pageInstance.size = 10;
      pageInstance.totalItems = 15;
      pageInstance.current = 2;
      expect(pageInstance.current).toBe(2);
      pageInstance.previous();
      expect(pageInstance.current).toBe(1);
      pageInstance.previous();
      expect(pageInstance.current).toBe(1);
    });

    it('exposes an Observable to follow page changes', function () {
      let nbChanges = 0;
      let currentPage: number;
      subscriptions.push(
        pageInstance.change.subscribe((page: number) => {
          nbChanges++;
          currentPage = page;
        })
      );
      expect(currentPage).toBeUndefined();
      pageInstance.current = 2;
      expect(currentPage).toBe(2);
      pageInstance.current = 5;
      expect(currentPage).toBe(5);
      pageInstance.current = 1;
      expect(currentPage).toBe(1);
      expect(nbChanges).toBe(3);
    });

    it('does not emit changes when resetPageSize if set to preventEmit', function () {
      // This test is a bit convoluted perhaps, but testing all ways to emit changes
      let nbChanges = 0;
      let currentPage: number;
      pageInstance.size = 10; // Emit avoided by setting before subscribe
      subscriptions.push(
        pageInstance.change.subscribe((page: number) => {
          nbChanges++;
          currentPage = page;
        })
      );
      expect(currentPage).toBeUndefined();
      pageInstance.current = 2; // First emit
      expect(currentPage).toBe(2);
      expect(nbChanges).toBe(1);
      pageInstance.resetPageSize(true); // No emit
      expect(currentPage).toBe(2);
      expect(nbChanges).toBe(1);
      pageInstance.size = 10; // Second emit
      expect(nbChanges).toBe(2);
      pageInstance.current = 3; // Third emit
      expect(currentPage).toBe(3);
      expect(nbChanges).toBe(3);
      pageInstance.resetPageSize(); // Fourth emit
      expect(currentPage).toBe(1);
      expect(nbChanges).toBe(4);
    });
  });
}
