/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, QueryList, Type, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClrEmphasisModule } from '../emphasis.module';
import { ClrAlert } from './alert';
import { ClrAlerts } from './alerts';
import { MultiAlertService } from './providers/multi-alert.service';

export default function () {
  describe('ClrAlerts component', function () {
    describe('Typescript API', function () {
      let component: ClrAlerts;
      let alert: ClrAlert;
      let service: MultiAlertService;
      let queryList: QueryList<ClrAlert>;

      beforeEach(function () {
        service = new MultiAlertService();

        TestBed.configureTestingModule({ imports: [ClrEmphasisModule] });

        const alertFixture = TestBed.createComponent(ClrAlert);
        alert = alertFixture.componentInstance;

        const anotherAlertFixture = TestBed.createComponent(ClrAlert);
        const anotherAlert = anotherAlertFixture.componentInstance;

        queryList = new QueryList<ClrAlert>();
        queryList.reset([alert, anotherAlert]);
        service.manage(queryList);
        component = new ClrAlerts(service);
      });

      it('knows the current alert', function () {
        expect(component.currentAlert).toEqual(alert);
      });
    });

    describe('Template API', function () {
      function create<T>(componentType: Type<T>) {
        TestBed.configureTestingModule({ imports: [ClrEmphasisModule], declarations: [componentType] });

        return TestBed.createComponent(componentType);
      }

      it('offers two way binding on the alert index', function () {
        const fixture = create(TestComponent);
        const testComponent = fixture.componentInstance;
        fixture.detectChanges();
        testComponent.currentAlertIndex = 0;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
        testComponent.alertsInstance.currentAlertIndex = 1;
        fixture.detectChanges();
        expect(testComponent.currentAlertIndex).toEqual(1);
      });

      it('allows changing alert index from 1 to 0', function () {
        const fixture = create(TestComponent);
        const testComponent = fixture.componentInstance;
        fixture.detectChanges();
        testComponent.currentAlertIndex = 1;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(1);
        testComponent.currentAlertIndex = 0;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
      });

      it('does not allow invalid indexes (undefined, null, -1, 1.5, string)', function () {
        const fixture = create(TestComponent);
        const testComponent = fixture.componentInstance;
        fixture.detectChanges();
        testComponent.currentAlertIndex = undefined;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
        testComponent.currentAlertIndex = null;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
        testComponent.currentAlertIndex = -1;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
        testComponent.currentAlertIndex = 1.5;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
        testComponent.currentAlertIndex = 'string' as any;
        fixture.detectChanges();
        expect(testComponent.alertsInstance.currentAlertIndex).toEqual(0);
      });

      it('offers two way binding on the alert instance', function () {
        const fixture = create(TestAlertInstance);
        fixture.detectChanges();

        const clarityComponent = fixture.componentInstance.alertsInstance;
        const testComponent = fixture.componentInstance;

        expect(testComponent.alertInstances.length).toBe(2);
        expect(testComponent.alertInstances.first).toBeTruthy();
        expect(testComponent.alertInstances.last).toBeTruthy();

        testComponent.currentAlert = testComponent.alertInstances.first;
        fixture.detectChanges();
        expect(clarityComponent.currentAlert).toEqual(testComponent.currentAlert);

        clarityComponent.currentAlert = testComponent.alertInstances.last;
        fixture.detectChanges();
        expect(testComponent.currentAlert).toEqual(clarityComponent.currentAlert);
      });
    });

    describe('View basics', function () {
      let fixture: ComponentFixture<TestComponent>;
      let compiled: any;
      let alertElements: Array<Element>;

      beforeEach(() => {
        TestBed.configureTestingModule({ imports: [ClrEmphasisModule], declarations: [TestComponent] });

        fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();
        compiled = fixture.nativeElement;
        alertElements = compiled.querySelectorAll('.alert');
        expect(alertElements.length).toEqual(2);
      });

      it('projects content based on clrCurrentAlertIndex', function () {
        expect(alertElements[0].textContent).toMatch(/This is the first alert/);
        expect(alertElements[0].classList).not.toContain('alert-hidden');
        expect(alertElements[1].classList).toContain('alert-hidden');

        fixture.componentInstance.currentAlertIndex = 1;
        fixture.detectChanges();

        expect(alertElements[1].textContent).toMatch(/This is the second alert/);
        expect(alertElements[1].classList).not.toContain('alert-hidden');
        expect(alertElements[0].classList).toContain('alert-hidden');
      });

      it('makes the previous alert active when the current alert is closed', function () {
        fixture.componentInstance.currentAlertIndex = 1;
        fixture.detectChanges();
        expect(alertElements[0].classList).toContain('alert-hidden');

        fixture.componentInstance.alertInstances.toArray()[1].close();
        fixture.detectChanges();
        expect(alertElements[0].classList).not.toContain('alert-hidden');
      });

      it('shows the pager only when there is more than one alert', function () {
        expect(compiled.querySelectorAll('clr-alerts-pager').length).toBe(1);
        fixture.componentInstance.alertInstances.toArray()[0].close();
        fixture.detectChanges();
        expect(compiled.querySelectorAll('clr-alerts-pager').length).toBe(0);
      });

      describe('sets classname as expected', function () {
        it('sets danger classname as expected', function () {
          const alertsContainer: Element = fixture.nativeElement.querySelector('.alerts');
          const myAlert: ClrAlert = fixture.componentInstance.alertsInstance.currentAlert;
          myAlert.alertType = 'danger';
          fixture.detectChanges();

          expect(alertsContainer.classList.contains('alert-danger')).toBe(true);
        });

        it('sets info classname as expected', function () {
          const alertsContainer: Element = fixture.nativeElement.querySelector('.alerts');
          const myAlert: ClrAlert = fixture.componentInstance.alertsInstance.currentAlert;
          myAlert.alertType = 'info';
          fixture.detectChanges();

          expect(alertsContainer.classList.contains('alert-info')).toBe(true);
        });

        it('sets success classname as expected', function () {
          const alertsContainer: Element = fixture.nativeElement.querySelector('.alerts');
          const myAlert: ClrAlert = fixture.componentInstance.alertsInstance.currentAlert;
          myAlert.alertType = 'success';
          fixture.detectChanges();

          expect(alertsContainer.classList.contains('alert-success')).toBe(true);
        });

        it('sets warning classname as expected', function () {
          const alertsContainer: Element = fixture.nativeElement.querySelector('.alerts');
          const myAlert: ClrAlert = fixture.componentInstance.alertsInstance.currentAlert;
          myAlert.alertType = 'warning';
          fixture.detectChanges();

          expect(alertsContainer.classList.contains('alert-warning')).toBe(true);
        });
        // no tests for unexpected/unrecognized values because the alert types service ignores them
        // and only changes an alert type when given a known value.
      });

      it('sets an aria label on the icon', function () {
        const myAlert: ClrAlert = fixture.componentInstance.alertsInstance.currentAlert;
        myAlert.alertType = 'warning';
        fixture.detectChanges();

        const icon: Element = fixture.nativeElement.querySelector('cds-icon[role="img"]');
        expect(icon.getAttribute('aria-label')).toEqual('Warning');
      });
    });

    describe('Supports dynamic alerts', function () {
      let fixture: ComponentFixture<DynamicAlerts>;

      beforeEach(function () {
        TestBed.configureTestingModule({ imports: [ClrEmphasisModule], declarations: [DynamicAlerts] });

        fixture = TestBed.createComponent(DynamicAlerts);
        fixture.detectChanges();
      });

      it('contains dynamic alerts and set an initial index', function () {
        expect(fixture.componentInstance.alertsInstance.currentAlertIndex).toEqual(0);
        expect(fixture.componentInstance.alertInstances.length).toEqual(2);
      });
    });
  });
}

@Component({
  template: `
    <clr-alerts [(clrCurrentAlertIndex)]="currentAlertIndex">
      <clr-alert
        [clrAlertType]="'alert-danger'"
        [clrAlertClosable]="true"
        [clrAlertClosed]="false"
        [clrAlertAppLevel]="true"
      >
        <clr-alert-item>
          <span class="alert-text">This is the first alert!</span>
        </clr-alert-item>
      </clr-alert>
      <clr-alert
        [clrAlertType]="'alert-danger'"
        [clrAlertClosable]="true"
        [clrAlertClosed]="false"
        [clrAlertAppLevel]="true"
      >
        <clr-alert-item>
          <span class="alert-text">This is the second alert!</span>
        </clr-alert-item>
      </clr-alert>
    </clr-alerts>
  `,
})
class TestComponent {
  @ViewChild(ClrAlerts) public alertsInstance: ClrAlerts;
  @ViewChildren(ClrAlert) public alertInstances: QueryList<ClrAlert>;

  currentAlertIndex = 0;
}

@Component({
  template: `
    <clr-alerts [(clrCurrentAlert)]="currentAlert">
      <clr-alert
        [clrAlertType]="'alert-danger'"
        [clrAlertClosable]="true"
        [clrAlertClosed]="false"
        [clrAlertAppLevel]="true"
      >
        <clr-alert-item>
          <span class="alert-text">This is the first alert!</span>
        </clr-alert-item>
      </clr-alert>
      <clr-alert
        [clrAlertType]="'alert-danger'"
        [clrAlertClosable]="true"
        [clrAlertClosed]="false"
        [clrAlertAppLevel]="true"
      >
        <clr-alert-item>
          <span class="alert-text">This is the second alert!</span>
        </clr-alert-item>
      </clr-alert>
    </clr-alerts>
  `,
})
class TestAlertInstance {
  @ViewChild(ClrAlerts) public alertsInstance: ClrAlerts;
  @ViewChildren(ClrAlert) public alertInstances: QueryList<ClrAlert>;

  public currentAlert: ClrAlert;
}

@Component({
  template: `
    <clr-alerts>
      <clr-alert *ngFor="let alert of dynamicAlerts" [clrAlertAppLevel]="true">
        <div class="alert-item">
          <span class="alert-text">
            {{ alert.text }}
          </span>
        </div>
      </clr-alert>
    </clr-alerts>
  `,
})
class DynamicAlerts {
  @ViewChild(ClrAlerts) public alertsInstance: ClrAlerts;
  @ViewChildren(ClrAlert) public alertInstances: QueryList<ClrAlert>;

  dynamicAlerts: Array<any>;

  ngOnInit() {
    this.dynamicAlerts = [
      { type: 'alert-info', text: "I'm an informational" },
      { type: 'alert-danger', text: 'Watch out!' },
    ];
  }
}
