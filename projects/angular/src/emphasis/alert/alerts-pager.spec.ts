/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, QueryList, Type, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ClrEmphasisModule } from '../../emphasis/emphasis.module';
import { ClrCommonStringsService } from '../../utils/i18n/common-strings.service';
import { ClrAlert } from './alert';
import { ClrAlertsPager } from './alerts-pager';
import { MultiAlertService } from './providers/multi-alert.service';

export default function () {
  describe('ClrAlerts pager component', function () {
    describe('Typescript API', function () {
      let component: ClrAlertsPager;
      let service: MultiAlertService;

      beforeEach(() => {
        service = new MultiAlertService();
        component = new ClrAlertsPager(service, new ClrCommonStringsService());
      });

      afterEach(() => {
        service = null;
        component = null;
      });

      it('page up calls the multi alert service', function () {
        spyOn(service, 'next').and.callFake(() => {
          // Do nothing
        });
        component.pageUp();
        expect(service.next).toHaveBeenCalled();
      });

      it('page down calls the multi alert service', function () {
        spyOn(service, 'previous').and.callFake(() => {
          // Do nothingno
        });
        component.pageDown();
        expect(service.previous).toHaveBeenCalled();
      });
    });

    describe('Template API', function () {
      function create<T>(componentType: Type<T>) {
        const service = new MultiAlertService();
        const queryList = new QueryList<ClrAlert>();

        TestBed.configureTestingModule({
          imports: [ClrEmphasisModule],
          declarations: [componentType],
          providers: [{ provide: MultiAlertService, useValue: service }],
        });
        const fixture = TestBed.createComponent(componentType);

        const alertFixture = TestBed.createComponent(ClrAlert);
        const alert = alertFixture.componentInstance;
        const secondAlertFixture = TestBed.createComponent(ClrAlert);
        const secondAlert = secondAlertFixture.componentInstance;

        queryList.reset([alert, secondAlert]);
        service.manage(queryList);

        fixture.detectChanges();

        return { fixture, alertFixture, alert, secondAlertFixture, secondAlert };
      }

      it('offers two way binding on the alert index', function () {
        const { fixture } = create(TestIndex);
        fixture.componentInstance.index = 1;
        fixture.detectChanges();
        expect(fixture.componentInstance.pagerInstance.currentAlertIndex).toEqual(1);

        fixture.componentInstance.pagerInstance.currentAlertIndex = 0;
        fixture.detectChanges();
        expect(fixture.componentInstance.index).toEqual(0);
      });

      it('offers two way binding on the alert instance', function () {
        const { fixture, alert, secondAlert } = create(TestInstance);

        fixture.componentInstance.currentAlert = secondAlert;
        fixture.detectChanges();
        expect(fixture.componentInstance.pagerInstance.currentAlert).toEqual(secondAlert);

        fixture.componentInstance.pagerInstance.currentAlert = alert;
        fixture.detectChanges();
        expect(fixture.componentInstance.currentAlert).toEqual(alert);
      });
    });
  });
}

@Component({
  template: `<clr-alerts-pager [(clrCurrentAlertIndex)]="index"></clr-alerts-pager>`,
})
export class TestIndex {
  @ViewChild(ClrAlertsPager) pagerInstance: ClrAlertsPager;
  index = 0;
}

@Component({
  template: `<clr-alerts-pager [(clrCurrentAlert)]="currentAlert"></clr-alerts-pager>`,
})
export class TestInstance {
  @ViewChild(ClrAlertsPager) pagerInstance: ClrAlertsPager;
  currentAlert: ClrAlert;
}
