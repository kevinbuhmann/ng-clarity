/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DomAdapter } from '../../../utils/dom-adapter/dom-adapter';
import { ClrDatagridModule } from '../datagrid.module';
import { DatagridRenderOrganizer } from '../render/render-organizer';
import { ColumnsService } from './columns.service';
import { DetailService } from './detail.service';
import { FiltersProvider } from './filters';
import { Page } from './page';
import { Sort } from './sort';
import { StateDebouncer } from './state-debouncer.provider';
import { TableSizeService } from './table-size.service';

@Component({
  template: `
    <div [style.height.px]="height">
      <clr-dg-column [style.width.px]="202">Col 1</clr-dg-column>
      <clr-dg-column [style.width.px]="122">Col 2</clr-dg-column>
      <clr-dg-column [style.width.px]="302">Col 3</clr-dg-column>
      <clr-dg-column [style.width.px]="42">Col 4</clr-dg-column>
    </div>
  `,
  providers: [TableSizeService],
})
class TestComponent {
  constructor(public elementRef: ElementRef) {}

  public height = 300;
}

const PROVIDERS_NEEDED = [
  Sort,
  FiltersProvider,
  DatagridRenderOrganizer,
  DomAdapter,
  DetailService,
  Page,
  StateDebouncer,
  ColumnsService,
];

export default function (): void {
  describe('TableSizeService', function () {
    let fixture: ComponentFixture<TestComponent>;
    let sizeService: TableSizeService;
    let table: HTMLElement;

    beforeEach(function () {
      TestBed.configureTestingModule({
        imports: [ClrDatagridModule],
        declarations: [TestComponent],
        providers: [PROVIDERS_NEEDED],
      });
      fixture = TestBed.createComponent(TestComponent);
      sizeService = fixture.debugElement.injector.get(TableSizeService);
      fixture.detectChanges();
      table = fixture.elementRef.nativeElement.children[0]; // reference to the TestComponnt table
      sizeService.tableRef = table; // setting service up with the component table for testing
    });

    it('sets a tableRef property with an elementReference', function () {
      // sizeService.tableRef is set in beforeEach
      expect(sizeService.tableRef).toBeDefined();
    });

    it('calculates the correct column drag height', function () {
      expect(sizeService.getColumnDragHeight()).toEqual('300px');
      fixture.componentInstance.height = 422;
      fixture.detectChanges();
      expect(sizeService.getColumnDragHeight()).toEqual('422px');
    });
  });
}
