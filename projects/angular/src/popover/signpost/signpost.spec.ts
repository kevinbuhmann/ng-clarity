/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ElementRef, ViewChild } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';

import { ClrPopoverToggleService } from '../../utils/popover/providers/popover-toggle.service';
import { spec, TestContext } from '../../utils/testing/helpers.spec';
import { SignpostIdService } from './providers/signpost-id.service';
import { ClrSignpost } from './signpost';
import { ClrSignpostModule } from './signpost.module';

type Context = TestContext<ClrSignpost, TestDefaultSignpost | TestCustomTriggerSignpost>;

export default function (): void {
  describe('Signpost', function () {
    describe('default trigger', function () {
      let toggleService: ClrPopoverToggleService;

      spec(ClrSignpost, TestDefaultSignpost, ClrSignpostModule);

      beforeEach(function () {
        toggleService = this.getClarityProvider(ClrPopoverToggleService);
      });

      it('adds the .signpost class to clr-signpost', function (this: Context) {
        expect(this.clarityElement.classList).toContain('signpost');
      });

      it('has a default trigger that can hide/show content', function (this: Context) {
        const signpostToggle: HTMLElement = this.hostElement.querySelector('.signpost-action');
        let signpostContent: HTMLElement;

        // Test we have a trigger
        expect(signpostToggle).not.toBeNull();

        // // Test that content shows
        signpostToggle.click();
        this.detectChanges();
        signpostContent = this.hostElement.querySelector('.signpost-content');
        expect(signpostContent).not.toBeNull();
        expect(toggleService.open).toBe(true);

        // Test that content hides again
        signpostToggle.click();
        this.detectChanges();
        signpostContent = this.hostElement.querySelector('.signpost-content');
        expect(signpostContent).toBeNull();
        expect(toggleService.open).toBe(false);
      });
    });

    describe('focus management', function () {
      let toggleService: ClrPopoverToggleService;

      spec(ClrSignpost, TestDefaultSignpost, ClrSignpostModule);

      beforeEach(function (this: Context) {
        toggleService = this.getClarityProvider(ClrPopoverToggleService);
      });

      it('should not get focus on trigger initially', function (this: Context) {
        const signpostToggle: HTMLElement = this.hostElement.querySelector('.signpost-action');
        toggleService.open = false;
        this.detectChanges();
        expect(signpostToggle).not.toBeNull();
        expect(document.activeElement).not.toBe(signpostToggle);
      });

      it('should not get focus back on trigger if signpost gets closed with outside click on another interactive element', fakeAsync(function (
        this: Context
      ) {
        toggleService.open = true;
        tick();
        this.detectChanges();
        expect(this.hostElement.querySelector('.signpost-content')).not.toBeNull();

        // dynamic click doesn't set the focus so here manually focusing first
        this.hostComponent.outsideClickBtn.nativeElement.focus();
        this.hostComponent.outsideClickBtn.nativeElement.click();
        this.detectChanges();

        expect(this.hostElement.querySelector('.signpost-content')).toBeNull();
        expect(document.activeElement).toBe(this.hostComponent.outsideClickBtn.nativeElement);
      }));

      it('should get focus back on trigger if signpost gets closed with outside click on non-interactive element', fakeAsync(function (
        this: Context
      ) {
        toggleService.open = true;
        tick();
        this.detectChanges();
        expect(this.hostElement.querySelector('.signpost-content')).not.toBeNull();

        document.body.click();
        this.detectChanges();

        expect(this.hostElement.querySelector('.signpost-content')).toBeNull();
        expect(document.activeElement).toBe(this.hostElement.querySelector('.signpost-action'));
      }));

      it('should get focus back on trigger if signpost gets closed while focused element inside content', function (this: Context) {
        toggleService.open = true;
        this.detectChanges();

        const dummyButton: HTMLElement = this.hostElement.querySelector('.dummy-button');
        dummyButton.focus();

        toggleService.open = false;
        this.detectChanges();

        expect(document.activeElement).toBe(this.hostElement.querySelector('.signpost-action'));
      });

      it('should get focus back on trigger if signpost gets closed with ESC key', function (this: Context) {
        toggleService.open = true;
        this.detectChanges();
        expect(this.hostElement.querySelector('.signpost-content')).not.toBeNull();

        const event: KeyboardEvent = new KeyboardEvent('keydown', { key: 'Escape' });

        document.dispatchEvent(event);
        this.detectChanges();

        expect(this.hostElement.querySelector('.signpost-content')).toBeNull();
        expect(document.activeElement).toBe(this.hostElement.querySelector('.signpost-action'));
      });
    });

    describe('custom trigger', function () {
      let toggleService: ClrPopoverToggleService;

      spec(ClrSignpost, TestCustomTriggerSignpost, ClrSignpostModule);

      beforeEach(function (this: Context) {
        toggleService = this.getClarityProvider(ClrPopoverToggleService);
      });

      /********
       * This test assumes that if
       */
      it('does not display the default trigger', function (this: Context) {
        const triggerIcon: HTMLElement = this.hostElement.querySelector('cds-icon');

        /**********
         * If there is a cds-icon we are testing that it is not the same shape
         * used for the default trigger.
         */
        if (triggerIcon) {
          expect(triggerIcon.getAttribute('shape')).not.toBe('info');
        }
      });

      it('projects a custom trigger element to hide/show content', function (this: Context) {
        const signpostTrigger: HTMLElement = this.hostElement.querySelector('.signpost-action');
        let signpostContent: HTMLElement;

        expect(signpostTrigger.textContent.trim()).toBe('Custom trigger');

        // Test we have a trigger
        expect(signpostTrigger).not.toBeNull();

        // Test it shows after changes
        signpostTrigger.click();
        this.detectChanges();
        signpostContent = this.hostElement.querySelector('.signpost-content');
        expect(signpostContent).not.toBeNull();
        expect(toggleService.open).toBe(true);

        // Test it hide when clicked again
        signpostTrigger.click();
        this.detectChanges();
        signpostContent = this.hostElement.querySelector('.signpost-content');
        expect(signpostContent).toBeNull();
        expect(toggleService.open).toBe(false);
      });
    });

    describe('aria-control values', () => {
      let signpostIdService: SignpostIdService;
      let triggerButton: HTMLButtonElement;

      spec(ClrSignpost, TestDefaultSignpost, ClrSignpostModule);

      function checkAriaControlsId(id: string, element: HTMLElement) {
        const triggerControlsValue = element.querySelector('.signpost-action').getAttribute('aria-controls');
        const closeControlsValue = element
          .querySelector('.signpost-content .signpost-action')
          .getAttribute('aria-controls');
        const contentId = element.querySelector('.signpost-content').getAttribute('id');

        expect(id).toBe(
          contentId,
          'ClrSignpostContent id is out of sync (content gets a new id each time it is created)'
        );
        expect(id).toBe(
          triggerControlsValue,
          'ClrSignpost id does not match the signpost trigger aria-controls value on the signpost trigger'
        );
        expect(id).toBe(
          closeControlsValue,
          'ClrSignpost id does not match the aria-controls value on the close button'
        );
      }

      beforeEach(function (this: Context) {
        signpostIdService = this.getClarityProvider(SignpostIdService);
        triggerButton = this.hostElement.querySelector('.signpost-action');
      });

      it('are correct when content is opened', function (this: Context) {
        let currentId;
        signpostIdService.id.subscribe(idChange => {
          currentId = idChange;
        });

        // First open
        triggerButton.click();
        this.fixture.detectChanges();

        checkAriaControlsId(currentId, this.clarityElement);

        // Close it
        triggerButton.click();
        this.fixture.detectChanges();

        // Second open
        triggerButton.click();
        this.fixture.detectChanges();

        checkAriaControlsId(currentId, this.clarityElement);
      });
    });
  });
}

@Component({
  template: `
    <button #outsideClick type="button">Button to test clicks outside of the dropdown component</button>
    <clr-signpost>
      <button type="button" class="signpost-action btn btn-small btn-link" clrSignpostTrigger>Custom trigger</button>
      <clr-signpost-content *clrIfOpen="openState">Signpost content</clr-signpost-content>
    </clr-signpost>
  `,
})
class TestCustomTriggerSignpost {
  @ViewChild(ClrSignpost) signpost: ClrSignpost;
  openState = false;

  @ViewChild('outsideClick', { read: ElementRef, static: true })
  outsideClickBtn: ElementRef;

  position = 'right-middle';
}

@Component({
  template: `
    <button #outsideClick type="button">Button to test clicks outside of the dropdown component</button>
    <clr-signpost>
      <clr-signpost-content *clrIfOpen="openState">
        <button class="dummy-button" type="button">dummy button</button>
        Signpost content
      </clr-signpost-content>
    </clr-signpost>
  `,
})
class TestDefaultSignpost {
  @ViewChild(ClrSignpost) signpost: ClrSignpost;

  openState = false;

  @ViewChild('outsideClick', { read: ElementRef, static: true })
  outsideClickBtn: ElementRef;
}
