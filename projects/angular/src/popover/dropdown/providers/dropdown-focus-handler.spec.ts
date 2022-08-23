/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { isObservable, Observable } from 'rxjs';

import { ArrowKeyDirection } from '../../../utils/focus/arrow-key-direction.enum';
import { FOCUS_SERVICE_PROVIDER, FocusService } from '../../../utils/focus/focus.service';
import { FocusableItem } from '../../../utils/focus/focusable-item/focusable-item';
import { MockFocusableItem } from '../../../utils/focus/focusable-item/focusable-item.mock';
import { Linkers } from '../../../utils/focus/focusable-item/linkers';
import { UNIQUE_ID } from '../../../utils/id-generator/id-generator.service';
import { ClrPopoverToggleService } from '../../../utils/popover/providers/popover-toggle.service';
import { DROPDOWN_FOCUS_HANDLER_PROVIDER, DropdownFocusHandler } from './dropdown-focus-handler.service';

// eslint-disable-next-line id-blacklist
import any = jasmine.any;

@Component({
  selector: 'simple-host',
  template: '',
  providers: [ClrPopoverToggleService, FOCUS_SERVICE_PROVIDER, DROPDOWN_FOCUS_HANDLER_PROVIDER],
})
class SimpleHost {}

@Component({
  template: '<simple-host></simple-host>',
  providers: [ClrPopoverToggleService, FOCUS_SERVICE_PROVIDER, DROPDOWN_FOCUS_HANDLER_PROVIDER],
})
class NestedHost {}

export default function (): void {
  describe('DropdownFocusHandler', function () {
    let fixture: ComponentFixture<SimpleHost | NestedHost>;
    let toggleService: ClrPopoverToggleService;
    let focusService: FocusService;
    let focusHandler: DropdownFocusHandler;
    let trigger: HTMLElement;
    let container: HTMLElement;
    let outside: HTMLElement;
    let children: FocusableItem[];

    describe('basic dropdown', function () {
      beforeEach(function () {
        TestBed.configureTestingModule({ declarations: [SimpleHost] });
        fixture = TestBed.createComponent(SimpleHost);
        toggleService = fixture.debugElement.injector.get(ClrPopoverToggleService);
        focusService = fixture.debugElement.injector.get(FocusService);
        focusHandler = fixture.debugElement.injector.get(DropdownFocusHandler, null);
        trigger = document.createElement('button');
        container = document.createElement('div');
        outside = document.createElement('button');
        // We need the elements in the DOM to be able to focus them
        document.body.append(trigger, container, outside);
        children = new Array(3).fill(0).map((_, i) => new MockFocusableItem(`${i}`));
      });

      afterEach(function () {
        trigger.remove();
        container.remove();
        outside.remove();
      });

      it('declares a UNIQUE_ID provider', function () {
        expect(fixture.debugElement.injector.get(UNIQUE_ID, 'not_found')).not.toBe('not_found');
      });

      it('declares a DropdownFocusHandler provider', function () {
        expect(focusHandler).not.toBeNull();
      });

      it('aliases the DropdownFocusHandler as a FocusableItem', function () {
        expect(fixture.debugElement.injector.get(FocusableItem, null)).toBe(focusHandler);
      });

      it('toggles open when arrow up or down on the trigger', fakeAsync(function () {
        expect(toggleService.open).toBeFalsy();
        focusHandler.trigger = trigger;

        focusHandler.trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'arrowup' }));
        tick();
        expect(toggleService.open).toBeTruthy();

        //once open, the up/down arrow keys control the focus on menu items, so we close again for the next test
        toggleService.open = false;
        tick();
        expect(toggleService.open).toBeFalsy();

        focusHandler.trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'arrowdown' }));
        tick();
        expect(toggleService.open).toBeTruthy();
      }));

      it('listens to arrow keys on the trigger', function () {
        const spy = spyOn(focusService, 'listenToArrowKeys');
        focusHandler.trigger = trigger;
        expect(spy).toHaveBeenCalledWith(trigger);
      });

      it('proxies focus() and blur() to the trigger', function () {
        focusHandler.trigger = trigger;
        expect(document.activeElement).not.toBe(trigger);
        focusHandler.focus();
        expect(document.activeElement).toBe(trigger);
        focusHandler.blur();
        expect(document.activeElement).not.toBe(trigger);
      });

      it('clicks on the trigger when activated', function () {
        let clicks = 0;
        trigger.addEventListener('click', () => clicks++);
        focusHandler.trigger = trigger;
        expect(clicks).toBe(0);
        focusHandler.activate();
        expect(clicks).toBe(1);
        focusHandler.activate();
        expect(clicks).toBe(2);
      });

      it('registers the container to the FocusService', function () {
        const spy = spyOn(focusService, 'registerContainer');
        focusHandler.container = container;
        expect(spy).toHaveBeenCalledWith(container);
      });

      it('sets a tabindex of 0 on the container', function () {
        focusHandler.container = container;
        expect(container.getAttribute('tabindex')).toBe('0');
      });

      it('closes the dropdown when the container is blurred', function () {
        focusHandler.container = container;
        toggleService.open = true;
        container.focus();
        expect(toggleService.open).toBeTruthy();
        container.blur();
        expect(toggleService.open).toBeFalsy();
      });

      it('blurs the focused items when container is focused and blurred', function () {
        focusHandler.container = container;
        focusHandler.addChildren(children);
        toggleService.open = true;

        const spyBlur = spyOn(children[0], 'blur');
        container.focus();
        expect(spyBlur).not.toHaveBeenCalled();

        container.blur();
        expect(spyBlur).toHaveBeenCalled();
      });

      it('puts focus back on the trigger when the dropdown becomes closed', function () {
        focusHandler.trigger = trigger;
        focusHandler.container = container;
        expect(document.activeElement).not.toBe(trigger);
        toggleService.open = true;
        toggleService.open = false;
        expect(document.activeElement).toBe(trigger);
      });

      it('does not prevent moving focus to a different part of the page', fakeAsync(function () {
        focusHandler.trigger = trigger;
        focusHandler.container = container;
        toggleService.open = true;
        tick();
        outside.focus();
        expect(document.activeElement).toBe(outside);
      }));

      it('links received children vertically', function () {
        const spy = spyOn(Linkers, 'linkVertical');
        focusHandler.addChildren(children);
        expect(spy).toHaveBeenCalledWith(children);
      });

      it('points down to the first child', function () {
        let down: FocusableItem;
        focusHandler.down.subscribe(child => (down = child));
        focusHandler.addChildren(children);
        expect(down).toBe(children[0]);
      });

      it('points up to the last child', function () {
        let up: FocusableItem;
        focusHandler.up.subscribe(child => (up = child));
        focusHandler.addChildren(children);
        expect(up).toBe(children[children.length - 1]);
      });

      it('does not point left or right', function () {
        focusHandler.addChildren(children);
        expect((focusHandler as FocusableItem).left).toBeUndefined();
        expect((focusHandler as FocusableItem).right).toBeUndefined();
      });

      it('points correctly even if children have been added early', function () {
        let down: FocusableItem;
        focusHandler.addChildren(children);
        focusHandler.down.subscribe(child => (down = child));
        expect(down).toBe(children[0]);
      });

      it('properly resets children', function () {
        focusHandler.addChildren(children);
        focusHandler.resetChildren();
        focusHandler.down.subscribe(() => fail('Expected no pointer down.'));
        focusHandler.up.subscribe(() => fail('Expected no pointer up.'));
      });

      it('opens the dropdown when trying to go down or up', function () {
        expect(toggleService.open).toBeFalsy();
        focusHandler.down.subscribe(() => null);
        expect(toggleService.open).toBeTruthy();
        toggleService.open = false;
        focusHandler.up.subscribe(() => null);
        expect(toggleService.open).toBeTruthy();
      });

      it('moves to the first child when opened with a click', fakeAsync(function () {
        focusHandler.addChildren(children);
        const moveTo = spyOn(focusService, 'moveTo');
        const move = spyOn(focusService, 'move');
        toggleService.toggleWithEvent({});
        tick();

        // First we move to the clicked item, which is the trigger,
        expect(moveTo).toHaveBeenCalledWith(focusHandler);
        // then we move down to the first item,
        expect(move).toHaveBeenCalledWith(ArrowKeyDirection.DOWN);
        // but maybe that's too detailed for this unit test? It's just the easiest way to test it right now.
      }));
    });

    describe('nested dropdown', function () {
      beforeEach(function () {
        TestBed.configureTestingModule({ declarations: [SimpleHost, NestedHost] });
        fixture = TestBed.createComponent(NestedHost);
        const nestedInjector = fixture.debugElement.query(By.directive(SimpleHost)).injector;
        toggleService = nestedInjector.get(ClrPopoverToggleService);
        focusService = nestedInjector.get(FocusService);
        focusHandler = nestedInjector.get(DropdownFocusHandler, null);
        trigger = document.createElement('button');
        container = document.createElement('div');
        // We need the elements in the DOM to be able to focus them
        document.body.append(trigger, container);
        children = new Array(3).fill(0).map((_, i) => new MockFocusableItem(`${i}`));
      });

      afterEach(function () {
        trigger.remove();
        container.remove();
      });

      it('calls native elements focus() and blur when focused and blurred', function () {
        focusHandler.trigger = trigger;
        focusHandler.focus();
        expect(document.activeElement).toBe(trigger);
        focusHandler.blur();
        expect(document.activeElement).not.toBe(trigger);
      });

      it('does not register the container to the FocusService', function () {
        const spy = spyOn(focusService, 'registerContainer');
        focusHandler.container = container;
        expect(spy).not.toHaveBeenCalled();
      });

      it('does not focus on the container when the dropdown becomes open', fakeAsync(function () {
        focusHandler.container = container;
        toggleService.open = true;
        // This specific focusing action is asynchronous so we have to tick
        tick();
        expect(document.activeElement).not.toBe(container);
      }));

      it('does not focus on the trigger when the dropdown becomes closed', function () {
        focusHandler.trigger = trigger;
        focusHandler.container = container;
        toggleService.open = true;
        toggleService.open = false;
        expect(document.activeElement).not.toBe(trigger);
      });

      it('points right to the first child', function () {
        let right: FocusableItem;
        focusHandler.right.subscribe(child => (right = child));
        focusHandler.addChildren(children);
        expect(right).toBe(children[0]);
      });

      it('does not point up, down or left', function () {
        focusHandler.addChildren(children);
        expect((focusHandler as FocusableItem).up).toBeUndefined();
        expect((focusHandler as FocusableItem).down).toBeUndefined();
        expect((focusHandler as FocusableItem).left).toBeUndefined();
      });

      it('links received children back to the trigger', function () {
        const spy = spyOn(Linkers, 'linkParent');
        focusHandler.addChildren(children);
        expect(spy).toHaveBeenCalledWith(children, any(Observable), ArrowKeyDirection.LEFT);
      });

      it('closes the dropdown when trying to go back to the trigger', function () {
        focusHandler.addChildren(children);
        toggleService.open = true;
        const back = children[0].left;
        expect(isObservable(back)).toBeTruthy();
        (back as Observable<FocusableItem>).subscribe(() => null);
        expect(toggleService.open).toBeFalsy();
      });

      it('moves to the first child when opened with a click', fakeAsync(function () {
        focusHandler.addChildren(children);
        const moveTo = spyOn(focusService, 'moveTo');
        const move = spyOn(focusService, 'move');
        toggleService.toggleWithEvent({});
        tick();

        expect(moveTo).toHaveBeenCalledWith(focusHandler);
        expect(move).toHaveBeenCalledWith(ArrowKeyDirection.RIGHT);
      }));
    });
  });
}
