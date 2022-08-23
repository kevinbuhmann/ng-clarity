/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClrIfActive } from './if-active.directive';
import { IF_ACTIVE_ID_PROVIDER, IfActiveService } from './if-active.service';

export default function (): void {
  describe('IfActive Directive', function () {
    describe('Typescript API', function () {
      let fixture: ComponentFixture<IfActiveTest>;
      let testComponent: IfActiveTest;
      let clarityDirective: ClrIfActive;
      let ifActiveService: IfActiveService;

      beforeEach(function () {
        TestBed.configureTestingModule({
          declarations: [ClrIfActive, IfActiveTest],
          providers: [IfActiveService, IF_ACTIVE_ID_PROVIDER],
        });
        fixture = TestBed.createComponent(IfActiveTest);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
        clarityDirective = fixture.componentInstance.directive;
        ifActiveService = TestBed.inject(IfActiveService);
      });

      it('sets the active state of the directive', function () {
        testComponent.activeState = true;
        fixture.detectChanges();
        expect(clarityDirective.active).toEqual(true);
      });

      it('gets the current value of the active state', function () {
        ifActiveService.current = new Object() as any;
        fixture.detectChanges();
        expect(testComponent.activeState).toEqual(false);
      });

      it('provides a function to update the view', function () {
        expect(clarityDirective.updateView).toBeDefined();

        // when activeState is false there should be no embedded views
        expect((clarityDirective as any).container.length).toEqual(0);

        // We can call the updateView function
        clarityDirective.updateView(true);
        expect((clarityDirective as any).container.length).toEqual(1);
      });

      it('emits an activeChange event only if the active state changes', function () {
        let nbChanges = 0;
        let currentChange: boolean;
        testComponent.directive.activeChange.subscribe((change: boolean) => {
          currentChange = change;
          nbChanges++;
        });
        expect(nbChanges).toBe(0);
        expect(currentChange).toBeUndefined();

        // setting the current to something other than the test directive's id
        ifActiveService.current = (testComponent.directive as any).id + 1;
        fixture.detectChanges();
        expect(nbChanges).toBe(0);
        expect(currentChange).toBeUndefined();

        // setting the current to the test directive's id
        ifActiveService.current = (testComponent.directive as any).id;
        fixture.detectChanges();
        expect(nbChanges).toBe(1);
        expect(currentChange).toBe(true);

        // setting the current to the test directive's id again
        ifActiveService.current = (testComponent.directive as any).id;
        fixture.detectChanges();
        expect(nbChanges).toBe(1);
        expect(currentChange).toBe(true);

        // setting the current to something other than the test directive's id again
        ifActiveService.current = (testComponent.directive as any).id + 1;
        fixture.detectChanges();
        expect(nbChanges).toBe(2);
        expect(currentChange).toBe(false);
      });
    });

    describe('View', function () {
      let fixture: ComponentFixture<IfActiveTest>;
      let testElement: HTMLElement;
      let clarityDirective: ClrIfActive;
      let ifActiveService: IfActiveService;

      beforeEach(function () {
        TestBed.configureTestingModule({
          declarations: [ClrIfActive, IfActiveTest],
          providers: [IfActiveService, IF_ACTIVE_ID_PROVIDER],
        });
        fixture = TestBed.createComponent(IfActiveTest);
        fixture.detectChanges();
        testElement = fixture.nativeElement;
        clarityDirective = fixture.componentInstance.directive;
        ifActiveService = TestBed.inject(IfActiveService);
      });

      // More for view tests.
      it('should not display anything when false', function () {
        expect(testElement.textContent.trim()).toBe('');
      });

      it('projects content when this directive is set to current', function () {
        ifActiveService.current = (clarityDirective as any).id;
        fixture.detectChanges();
        expect(testElement.textContent.trim()).toBe('Hello Template!');
      });
    });
  });
}

@Component({
  template: `<ng-template [(clrIfActive)]="activeState">Hello Template!</ng-template>`,
})
class IfActiveTest {
  @ViewChild(ClrIfActive) directive: ClrIfActive;
  activeState = false;
}
