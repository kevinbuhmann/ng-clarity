/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { DatagridRenderStep } from '../enums/render-step.enum';
import { DatagridRenderOrganizer } from './render-organizer';

export default function (): void {
  describe('DatagridRenderOrganizer', function () {
    let organizer: DatagridRenderOrganizer;

    beforeEach(function () {
      organizer = new DatagridRenderOrganizer();
    });

    it("doesn't clear widths on the first rendering", function () {
      let clearedWidths = false;
      organizer.renderStep.subscribe(step => {
        if (step === DatagridRenderStep.CLEAR_WIDTHS) {
          clearedWidths = true;
        }
      });
      organizer.resize();
      expect(clearedWidths).toBe(false);
      organizer.resize();
      expect(clearedWidths).toBe(true);
    });

    it('follows the correct rendering order', function () {
      // Initial sizing to make sure clearWidths is included in the next one.
      organizer.resize();
      const stepsRecieved: DatagridRenderStep[] = [];
      organizer.renderStep.subscribe(renderStep => {
        stepsRecieved.push(renderStep);
      });
      organizer.resize();

      expect(stepsRecieved).toEqual([
        DatagridRenderStep.CALCULATE_MODE_ON,
        DatagridRenderStep.CLEAR_WIDTHS,
        DatagridRenderStep.COMPUTE_COLUMN_WIDTHS,
        DatagridRenderStep.ALIGN_COLUMNS,
        DatagridRenderStep.CALCULATE_MODE_OFF,
      ]);
    });

    it('provides a filtering utility that targets one step', function () {
      let currentStep: DatagridRenderStep = null;
      organizer.filterRenderSteps(DatagridRenderStep.ALIGN_COLUMNS).subscribe(step => (currentStep = step));
      expect(currentStep).toBeNull();
      organizer.resize();
      expect(currentStep).toBe(DatagridRenderStep.ALIGN_COLUMNS);
    });
  });
}
