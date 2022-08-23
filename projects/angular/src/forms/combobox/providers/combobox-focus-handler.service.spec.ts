/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ElementRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyCodes } from '../../../utils/enums/key-codes.enum';
import { ClrPopoverToggleService } from '../../../utils/popover/providers/popover-toggle.service';
import { SingleSelectComboboxModel } from '../model/single-select-combobox.model';
import { COMBOBOX_FOCUS_HANDLER_PROVIDER, ComboboxFocusHandler, OptionData } from './combobox-focus-handler.service';
import { OptionSelectionService } from './option-selection.service';

@Component({
  template: `
    <form (submit)="onSubmit()">
      <input type="text" #textInput /><button #trigger></button>
      <ul #listbox></ul>
    </form>
  `,
})
class SimpleHost {
  @ViewChild('textInput') textInput: ElementRef;
  @ViewChild('trigger') trigger: ElementRef;
  @ViewChild('listbox') listbox: ElementRef;
  onSubmit() {
    // do nothing; it makes eslint happy
  }
}

export default function (): void {
  describe('Basic focusHandler', function () {
    let fixture: ComponentFixture<SimpleHost>;
    let testComponent: SimpleHost;
    let focusHandler: ComboboxFocusHandler<any>;
    let selectionService: OptionSelectionService<any>;
    let toggleService: ClrPopoverToggleService;

    beforeEach(function () {
      TestBed.configureTestingModule({
        declarations: [SimpleHost],
        providers: [ClrPopoverToggleService, OptionSelectionService, COMBOBOX_FOCUS_HANDLER_PROVIDER],
      });
      fixture = TestBed.createComponent(SimpleHost);
      testComponent = fixture.componentInstance;
      focusHandler = fixture.debugElement.injector.get(ComboboxFocusHandler);
      toggleService = fixture.debugElement.injector.get(ClrPopoverToggleService);
      selectionService = fixture.debugElement.injector.get(OptionSelectionService);

      fixture.detectChanges();

      focusHandler.textInput = testComponent.textInput.nativeElement;
      focusHandler.trigger = testComponent.trigger.nativeElement;
      focusHandler.listbox = testComponent.listbox.nativeElement;

      focusHandler.addOptionValues([
        new OptionData('1', 'one'),
        new OptionData('2', 'two'),
        new OptionData('3', 'three'),
      ]);
    });

    it('declares itself as a ComboboxFocusHandler provider', function () {
      expect(focusHandler).toBeTruthy();
    });

    it('has empty pseudoFocus on initialization', function () {
      expect(focusHandler.pseudoFocus).toBeTruthy();
      expect(focusHandler.pseudoFocus.isEmpty()).toBeTrue();
      expect(toggleService.open).toBeFalse();
    });

    it('can open a listbox and set focus', function () {
      const event = new KeyboardEvent('keydown', { key: KeyCodes.ArrowDown });
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(toggleService.open).toBeTrue();
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('1', 'one'));
    });

    it('moves focus with keys', function () {
      const event = new KeyboardEvent('keydown', { key: KeyCodes.ArrowDown });
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('1', 'one'));
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('2', 'two'));
      const upEvent = new KeyboardEvent('keydown', { key: KeyCodes.ArrowUp });
      testComponent.textInput.nativeElement.dispatchEvent(upEvent);
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('1', 'one'));
    });

    it('closes popover on textInput blur', function () {
      toggleService.open = true;
      const event = new FocusEvent('blur');
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(toggleService.open).toBeFalse();
    });

    it('closes popover on trigger blur', function () {
      toggleService.open = true;
      const event = new FocusEvent('blur');
      testComponent.trigger.nativeElement.dispatchEvent(event);
      expect(toggleService.open).toBeFalse();
    });

    it('closes popover on listbox blur', function () {
      toggleService.open = true;
      const event = new FocusEvent('blur');
      testComponent.listbox.nativeElement.dispatchEvent(event);
      expect(toggleService.open).toBeFalse();
    });

    it('can set focus on textInput', function () {
      spyOn(testComponent.textInput.nativeElement, 'focus');
      focusHandler.focusInput();
      expect(testComponent.textInput.nativeElement.focus).toHaveBeenCalled();
    });

    it('can set focus on first active item', function () {
      selectionService.selectionModel = new SingleSelectComboboxModel();
      const item = 'two';
      selectionService.select(item);
      focusHandler.focusFirstActive();
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('2', 'two'));
    });

    it('can set focus on the first item if no item is active', function () {
      selectionService.selectionModel = new SingleSelectComboboxModel();
      focusHandler.focusFirstActive();
      expect(focusHandler.pseudoFocus.model).toEqual(new OptionData('1', 'one'));
    });

    it('Option data can be compared', function () {
      const item = new OptionData('1', 'one');
      const sameItem = new OptionData('1', 'one');
      const otherItem = new OptionData('2', 'two');

      expect(item.equals(sameItem)).toBeTrue();
      expect(item.equals(otherItem)).toBeFalse();
    });

    it('does submit on Enter when dialog is closed', function () {
      spyOn(testComponent, 'onSubmit');
      const event = new KeyboardEvent('keydown', { key: KeyCodes.Enter });
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(testComponent.onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit on Enter when dialog is open', function () {
      spyOn(testComponent, 'onSubmit');
      toggleService.open = true;
      const event = new KeyboardEvent('keydown', { key: KeyCodes.Enter });
      testComponent.textInput.nativeElement.dispatchEvent(event);
      expect(testComponent.onSubmit).not.toHaveBeenCalled();
    });
  });
}
