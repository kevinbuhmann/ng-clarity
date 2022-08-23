/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { DatagridPropertyStringFilter } from './datagrid-property-string-filter';

export default function (): void {
  describe('DatagridPropertyStringFilter', function () {
    it('checks if a string contains the search text', function () {
      const filter = new DatagridPropertyStringFilter('a');
      expect(filter.accepts({ a: 'abc' }, '')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'a')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'b')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'c')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'ab')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'bc')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'abc')).toBe(true);
      expect(filter.accepts({ a: 'abc' }, 'x')).toBe(false);
      expect(filter.accepts({ a: 'abc' }, 'ac')).toBe(false);
      expect(filter.accepts({ a: 'abc' }, 'cba')).toBe(false);
    });

    it('is case insensitive', function () {
      const filter = new DatagridPropertyStringFilter('a');
      expect(filter.accepts({ a: 'ABC' }, 'a')).toBe(true);
    });

    it('works on integers', function () {
      const filter = new DatagridPropertyStringFilter('a');
      expect(filter.accepts({ a: 123 }, '23')).toBe(true);
      expect(filter.accepts({ a: 123 }, '13')).toBe(false);
    });

    it('always rejects undefined', function () {
      const filter = new DatagridPropertyStringFilter('a');
      expect(filter.accepts({}, 'a')).toBe(false);
    });

    it('supports nested properties', function () {
      const filter = new DatagridPropertyStringFilter('a.b');
      expect(filter.accepts({ a: { b: 'abc' } }, 'a')).toBe(true);
    });
  });
}
