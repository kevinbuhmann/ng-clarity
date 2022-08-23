/*
 * Copyright (c) 2016-2022 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Observable } from 'rxjs';

import { SignpostIdService } from './signpost-id.service';

export default function (): void {
  describe('Signpost Id Service', function () {
    let idService: SignpostIdService;

    beforeEach(function () {
      idService = new SignpostIdService();
    });

    it('should set an id', function () {
      let currentId;
      idService.id.subscribe(newId => {
        currentId = newId;
      });
      idService.setId('clr-id-1');
      expect(currentId).toBe('clr-id-1');
    });

    it('exposes and observable for latest id', function () {
      const idObservable = idService.id;
      expect(idObservable).toBeDefined();
      expect(idObservable instanceof Observable).toBe(true);
    });
  });
}
