/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ClrDatagridPlaceholder } from './datagrid-placeholder';
import { TestContext } from './helpers.spec';
import { FiltersProvider } from './providers/filters';
import { Items } from './providers/items';
import { Page } from './providers/page';
import { Sort } from './providers/sort';
import { StateDebouncer } from './providers/state-debouncer.provider';

export default function (): void {
  describe('ClrDatagridPlaceholder component', function () {
    describe('Typescript API', function () {
      let itemsProvider: Items;
      let component: ClrDatagridPlaceholder;

      beforeEach(function () {
        const pageProvider = new Page(new StateDebouncer());
        itemsProvider = new Items(null, null, pageProvider);
        component = new ClrDatagridPlaceholder(itemsProvider);
      });

      it('detects if the Datagrid is empty', function () {
        expect(component.emptyDatagrid).toBe(true);
        itemsProvider.all = new Array(1);
        expect(component.emptyDatagrid).toBe(false);
        itemsProvider.all = [];
        expect(component.emptyDatagrid).toBe(true);
      });
    });

    describe('View', function () {
      let context: TestContext<ClrDatagridPlaceholder<void>, SimpleTest>;
      let itemsProvider: Items<void>;

      beforeEach(function () {
        context = this.create(ClrDatagridPlaceholder, SimpleTest, [Items, Page, Sort, FiltersProvider, StateDebouncer]);
        itemsProvider = TestBed.inject(Items);
      });

      it('is empty when there are items', function () {
        itemsProvider.all = new Array(1);
        context.detectChanges();
        expect(context.clarityElement.textContent.trim()).toMatch('');
      });

      it('is empty when the data is loading', function () {
        itemsProvider.loading = true;
        context.detectChanges();
        expect(context.clarityElement.textContent.trim()).toMatch('');
      });

      it('projects content when there are no items', function () {
        expect(context.clarityElement.textContent.trim()).toMatch('Hello world');
      });

      it('should have role attribute for accessibility', function () {
        expect(context.clarityElement.querySelector('.datagrid-placeholder[role=row]')).not.toBeNull();
        expect(context.clarityElement.querySelector('span[role=gridcell]')).not.toBeNull();
      });
    });
  });
}

@Component({
  template: `<clr-dg-placeholder>Hello world</clr-dg-placeholder>`,
})
class SimpleTest {}
