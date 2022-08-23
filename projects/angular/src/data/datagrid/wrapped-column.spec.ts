/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { WrappedColumn } from './wrapped-column';

@Component({
  template: `<dg-wrapped-column>Hello World!</dg-wrapped-column>`,
})
class WrappedColumnTest {
  @ViewChild(WrappedColumn, { static: true })
  wrapper: WrappedColumn;
}

export default function (): void {
  describe('WrappedColumn', () => {
    let wrapper: WrappedColumn;

    beforeEach(function () {
      TestBed.configureTestingModule({ declarations: [WrappedColumn, WrappedColumnTest] });
      const fixture = TestBed.createComponent(WrappedColumnTest);
      wrapper = fixture.componentInstance.wrapper;
      fixture.detectChanges();
    });

    it('should have a columnView', function () {
      expect(wrapper.columnView).toBeDefined();
    });

    it('should have a templateRef to the portal', function () {
      expect(wrapper.templateRef).toBeDefined();
    });

    it('projects content into the template', function () {
      expect(wrapper.columnView.rootNodes[0].textContent.trim()).toBe('Hello World!');
    });
  });
}
