/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Observable, Subscription } from 'rxjs';

import { DatagridDisplayMode } from '../enums/display-mode.enum';
import { DatagridRenderStep } from '../enums/render-step.enum';
import { MockDatagridRenderOrganizer } from '../render/render-organizer.mock';
import { MockDisplayModeService } from './display-mode.mock';

export default function (): void {
  describe('DisplayMode Service', () => {
    let organizer: MockDatagridRenderOrganizer;
    let displayService: MockDisplayModeService;
    let displayViewServiceSubscription: Subscription;

    beforeEach(function () {
      organizer = new MockDatagridRenderOrganizer();
      displayService = new MockDisplayModeService(organizer);
    });

    afterEach(function () {
      if (displayViewServiceSubscription) {
        displayViewServiceSubscription.unsubscribe();
      }
    });

    it('exposes an Observable for display mode view state', function () {
      const viewObservable = displayService.view;
      expect(viewObservable).toBeDefined();
      expect(viewObservable instanceof Observable).toBe(true);
    });

    it('properly updates the view mode when organizer resizes', function () {
      let currentChange: DatagridDisplayMode;
      let displayChangeCount = 0;
      displayViewServiceSubscription = displayService.view.subscribe(viewChange => {
        displayChangeCount++;
        currentChange = viewChange;
      });
      expect(currentChange).toBe(DatagridDisplayMode.DISPLAY);
      organizer.resize();
      expect(currentChange).toBe(DatagridDisplayMode.DISPLAY);
      expect(displayChangeCount).toBe(3); // +1 b/c of the behavior subject.
    });

    it('it defaults to DatagridDisplayMode.DISPLAY', function () {
      const viewObservable = displayService.view;
      let currentView = null;
      displayViewServiceSubscription = viewObservable.subscribe(viewChange => {
        currentView = viewChange;
      });
      expect(currentView).toBe(DatagridDisplayMode.DISPLAY);
    });

    it('updates the view for DatagridDisplayMode.DISPLAY', function () {
      const viewObservable = displayService.view;
      let currentView = null;
      displayViewServiceSubscription = viewObservable.subscribe(viewChange => {
        currentView = viewChange;
      });
      organizer.updateRenderStep.next(DatagridRenderStep.CALCULATE_MODE_OFF);
      expect(currentView).toBe(DatagridDisplayMode.DISPLAY);
    });

    it('updates the view for DatagridDisplayMode.CALCULATE', function () {
      const viewObservable = displayService.view;
      let currentView = null;
      displayViewServiceSubscription = viewObservable.subscribe(viewChange => {
        currentView = viewChange;
      });
      organizer.updateRenderStep.next(DatagridRenderStep.CALCULATE_MODE_ON);
      expect(currentView).toBe(DatagridDisplayMode.CALCULATE);
    });
  });
}
