/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { NestedProperty } from './nested-property';

export default function (): void {
  describe('NestedProperty (internal)', function () {
    it('accesses root properties', function () {
      const property = new NestedProperty('a');
      expect(property.getPropValue({ a: 42 })).toBe(42);
    });

    it('accesses deep properties', function () {
      const property = new NestedProperty('my.deep.prop');
      expect(property.getPropValue({ my: { deep: { prop: 42 } } })).toBe(42);
    });

    it('returns gracefully undefined when any of the intermediate properties is missing', function () {
      const property = new NestedProperty('my.deep.prop');
      expect(property.getPropValue({})).toBeUndefined();
      expect(property.getPropValue({ my: {} })).toBeUndefined();
      expect(property.getPropValue({ my: { deep: {} } })).toBeUndefined();
    });
  });
}
