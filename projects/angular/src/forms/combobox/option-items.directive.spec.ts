/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClrPopoverEventsService } from '../../utils/popover/providers/popover-events.service';
import { ClrPopoverPositionService } from '../../utils/popover/providers/popover-position.service';
import { ClrPopoverToggleService } from '../../utils/popover/providers/popover-toggle.service';
import { ClrComboboxModule } from './combobox.module';
import { ClrOptionItems } from './option-items.directive';
import { OptionSelectionService } from './providers/option-selection.service';

@Component({
  template: `
    <ul>
      <li *clrOptionItems="let v of values; trackBy: trackBy">{{ v }}</li>
    </ul>
  `,
  providers: [ClrPopoverEventsService, ClrPopoverPositionService],
})
class FullTest {
  @ViewChild(ClrOptionItems) optionItems: ClrOptionItems<string | number>;
  values: (string | number)[] = [0, 1, 2, 3];
  trackBy: (index: number, value: string | number) => any;
}

@Component({
  template: `
    <ul>
      <li *clrOptionItems="let n of numbers; trackBy: trackBy">{{ n }}</li>
    </ul>
  `,
  providers: [ClrPopoverEventsService, ClrPopoverPositionService],
})
class TrackByIndexTest {
  @ViewChild(ClrOptionItems) optionItems: ClrOptionItems<number>;
  numbers = [0, 1, 2, 3];
  trackBy = (index: number) => index;
}

@Component({
  template: `
    <ul>
      <li *clrOptionItems="let n of numbers; field: 'a'">{{ n.a }}</li>
    </ul>
  `,
  providers: [ClrPopoverEventsService, ClrPopoverPositionService],
})
class ObjectDataTest {
  @ViewChild(ClrOptionItems) optionItems: ClrOptionItems<number>;
  numbers = [{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }];
  trackBy = (index: number) => index;
}

const OPTION_ITEM_PROVIDERS = [OptionSelectionService, ClrPopoverToggleService];

export default function (): void {
  describe('ClrOptionItems directive', function () {
    describe('correctly initializes', () => {
      let fixture: ComponentFixture<FullTest>;
      let testComponent: FullTest;
      let clarityDirective: ClrOptionItems<any>;

      beforeEach(function () {
        TestBed.configureTestingModule({
          imports: [ClrComboboxModule],
          declarations: [FullTest],
          providers: OPTION_ITEM_PROVIDERS,
        });
        fixture = TestBed.createComponent(FullTest);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
        clarityDirective = testComponent.optionItems;
      });

      it('can handle changes', function () {
        const initialContent = fixture.elementRef.nativeElement.textContent;
        expect(initialContent.trim()).toEqual('0123');
        testComponent.values.push(6);
        fixture.detectChanges();
        const updatedContent = fixture.elementRef.nativeElement.textContent;

        /* This took me quite some time to research, so it needs a detailed explanation.
           The data not updating immediately does not mean that the new value will not be added to the combobox.
           It only means that it won't be added to the currently open popover. Which we do not want anyway, as:
           - it will cause flickering and focus loss/mess issues;
           - for performance reasons we're only updating the iterator on input change (replace, pushing does not
             count) and on filter change;
           - the user still has the workaround to replace the input reference instead of pushing.
           Based on the above, I prefer to avoid complicating the iterator, unless we have a real scenario for it.
        */
        // Deprecated check:
        // expect(updatedContent.trim()).toEqual('01236');
        expect(updatedContent.trim()).toEqual('0123');
      });

      it('handles a null input for the array of items', function () {
        testComponent.values = null;
        fixture.detectChanges();
        expect((clarityDirective as any)._rawItems).toEqual([]);
      });

      it('handles an undefined input for the array of items', function () {
        testComponent.values = undefined;
        fixture.detectChanges();
        expect((clarityDirective as any)._rawItems).toEqual([]);
      });

      it('can filter out items based on the option service currentInput field', function () {
        expect((clarityDirective as any).iterableProxy._ngForOf).toEqual([0, 1, 2, 3]);
        const optionService: OptionSelectionService<any> = TestBed.inject(OptionSelectionService);
        testComponent.values.push(12);
        optionService.currentInput = '1';
        fixture.detectChanges();
        expect((clarityDirective as any).iterableProxy._ngForOf).toEqual([1, 12]);
      });

      it('has case insensive filter', function () {
        const optionService: OptionSelectionService<any> = TestBed.inject(OptionSelectionService);
        testComponent.values.push('Room', 'Broom');
        optionService.currentInput = 'ro';
        fixture.detectChanges();
        expect((clarityDirective as any).iterableProxy._ngForOf).toEqual(['Room', 'Broom']);
      });
    });

    describe('handles arrays of simple data correctly', () => {
      let fixture: ComponentFixture<TrackByIndexTest>;
      let testComponent: TrackByIndexTest;
      let clarityDirective: ClrOptionItems<number>;

      beforeEach(function () {
        TestBed.configureTestingModule({
          imports: [ClrComboboxModule],
          declarations: [TrackByIndexTest],
          providers: OPTION_ITEM_PROVIDERS,
        });
        fixture = TestBed.createComponent(TrackByIndexTest);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
        clarityDirective = fixture.componentInstance.optionItems;
      });

      it('receives an input for the trackBy option', function () {
        expect((clarityDirective as any).iterableProxy.ngForTrackBy).toBe(testComponent.trackBy);
      });

      it('correctly mutates and resets an array with trackBy', function () {
        // Initial state
        fixture.nativeElement.querySelectorAll('li:first-child').forEach(li => (li.style.color = 'red'));
        const firstItem = fixture.nativeElement.querySelector('li');
        expect(firstItem.style.color).toBe('red');
        expect(firstItem.textContent.trim()).toBe('0');

        // First mutation
        testComponent.numbers.unshift(42);
        fixture.detectChanges();
        const unshiftedItem = fixture.nativeElement.querySelector('li');
        expect((clarityDirective as any)._rawItems).toEqual([42, 0, 1, 2, 3]);
        expect(unshiftedItem.style.color).toBe('red');

        // Resetting
        testComponent.numbers = [42];
        fixture.detectChanges();
        const replacedItem = fixture.nativeElement.querySelector('li');
        expect(replacedItem.style.color).toBe('red');
      });
    });

    describe('handles object arrays correctly', () => {
      let fixture: ComponentFixture<ObjectDataTest>;
      let testComponent: ObjectDataTest;
      let clarityDirective: ClrOptionItems<number>;

      beforeEach(function () {
        TestBed.configureTestingModule({
          imports: [ClrComboboxModule],
          declarations: [ObjectDataTest],
          providers: OPTION_ITEM_PROVIDERS,
        });
        fixture = TestBed.createComponent(ObjectDataTest);
        fixture.detectChanges();
        testComponent = fixture.componentInstance;
        clarityDirective = fixture.componentInstance.optionItems;
      });

      it('generates content', function () {
        const initialContent = fixture.elementRef.nativeElement.textContent;
        expect(initialContent.trim()).toEqual('0123');
      });

      it('sets display field', function () {
        const optionService: OptionSelectionService<any> = TestBed.inject(OptionSelectionService);
        expect((clarityDirective as any)._filterField).toEqual('a');
        expect(optionService.displayField).toEqual('a');
      });

      it('handles null values', function () {
        expect(() => {
          testComponent.numbers = [{ a: null }, ...testComponent.numbers];
          fixture.detectChanges();
        }).not.toThrow();
      });
    });
  });
}
