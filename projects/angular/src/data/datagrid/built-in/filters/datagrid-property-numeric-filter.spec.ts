/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { DatagridPropertyNumericFilter } from './datagrid-property-numeric-filter';

export default function (): void {
  describe('DatagridPropertyNumericFilter', function () {
    it('checks if a number is within the range', function () {
      const filter = new DatagridPropertyNumericFilter('a');
      expect(filter.accepts({ a: 1 }, null, 10)).toBe(true);
      expect(filter.accepts({ a: 1 }, null, -1)).toBe(false);
      expect(filter.accepts({ a: 9 }, 1, null)).toBe(true);
      expect(filter.accepts({ a: 9 }, 10, null)).toBe(false);
    });

    it('accepts strings when not active', function () {
      const filter = new DatagridPropertyNumericFilter('a');
      expect(filter.accepts({ a: 'not a number' }, null, null)).toBe(true);
    });

    it('rejects strings when active', function () {
      const filter = new DatagridPropertyNumericFilter('a');
      expect(filter.accepts({ a: 'not a number' }, null, 1)).toBe(false);
    });

    it('always rejects undefined', function () {
      const filter = new DatagridPropertyNumericFilter('a');
      expect(filter.accepts({}, null, null)).toBe(false);
    });

    it('supports nested properties', function () {
      const filter = new DatagridPropertyNumericFilter('a.b');
      expect(filter.accepts({ a: { b: 1 } }, 0, 10)).toBe(true);
    });
  });
}
