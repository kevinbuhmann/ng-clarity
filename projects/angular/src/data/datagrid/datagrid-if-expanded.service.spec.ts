/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { ClrLoadingState } from '../../utils/loading/loading';
import { DatagridIfExpandService } from './datagrid-if-expanded.service';

export default function (): void {
  describe('Expand provider', function () {
    let expand: DatagridIfExpandService;

    beforeEach(function () {
      expand = new DatagridIfExpandService();
    });

    it('starts with the correct default settings', function () {
      let doesReplace = null;
      expand.replace.subscribe(expandChange => {
        doesReplace = expandChange;
      });
      expect(expand.expandable).toBe(0, 'not expandable');
      expect(doesReplace).toBe(false, 'not replacing the row');
      expect(expand.loading).toBe(false, 'already loaded');
      expect(expand.expanded).toBe(false, 'collapsed');
    });

    it('notifies when cells are replaced', function () {
      let isReplaced = null;
      expand.replace.subscribe(replaceChange => {
        isReplaced = replaceChange;
      });
      expect(isReplaced).toBe(false);
      expand.setReplace(true);
      expect(isReplaced).toBe(true);
    });

    it('implements LoadingListener', function () {
      expand.loadingStateChange(ClrLoadingState.LOADING);
      expect(expand.loading).toBe(true);
      expand.loadingStateChange(ClrLoadingState.DEFAULT);
      expect(expand.loading).toBe(false);
    });

    it('prepares the animation before requesting to expand', function () {
      const listeners: string[] = [];
      expand.animate.subscribe(() => listeners.push('animate'));
      expand.expandChange.subscribe(() => listeners.push('expand'));
      expand.expanded = true;
      expect(listeners).toEqual(['animate', 'expand']);
    });

    it('re-triggers animation when done loading', function () {
      let animates = 0;
      expand.animate.subscribe(() => animates++);
      expand.loadingStateChange(ClrLoadingState.LOADING);
      expand.expanded = true;
      expect(animates).toBe(1);
      expand.loadingStateChange(ClrLoadingState.DEFAULT);
      expect(animates).toBe(2);
    });

    it('expect to create expandableId property', function () {
      expect(expand.expandableId).toContain('clr-dg-expandable-row-');
    });
  });
}
