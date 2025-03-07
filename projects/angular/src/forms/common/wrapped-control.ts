/*
 * Copyright (c) 2016-2023 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  InjectionToken,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import { DynamicWrapper } from '../../utils/host-wrapping/dynamic-wrapper';
import { HostWrapper } from '../../utils/host-wrapping/host-wrapper';
import { CONTROL_SUFFIX } from './abstract-control';
import { IfControlStateService } from './if-control-state/if-control-state.service';
import { ContainerIdService } from './providers/container-id.service';
import { ControlClassService } from './providers/control-class.service';
import { ControlIdService } from './providers/control-id.service';
import { MarkControlService } from './providers/mark-control.service';
import { Helpers, NgControlService } from './providers/ng-control.service';

@Directive()
export class WrappedFormControl<W extends DynamicWrapper> implements OnInit, OnDestroy {
  _id: string;

  protected renderer: Renderer2;
  protected controlIdService: ControlIdService;
  protected ngControlService: NgControlService;
  protected el: ElementRef<any>;
  protected index = 0;
  protected subscriptions: Subscription[] = [];

  private ifControlStateService: IfControlStateService;
  private controlClassService: ControlClassService;
  private markControlService: MarkControlService;
  private containerIdService: ContainerIdService;
  private _containerInjector: Injector;

  // I lost way too much time trying to make this work without injecting the ViewContainerRef and the Injector,
  // I'm giving up. So we have to inject these two manually for now.
  constructor(
    protected vcr: ViewContainerRef,
    protected wrapperType: Type<W>,
    injector: Injector,
    private ngControl: NgControl,
    renderer: Renderer2,
    el: ElementRef
  ) {
    this.renderer = renderer;
    this.el = el;
    try {
      this.ngControlService = injector.get(NgControlService);
      this.ifControlStateService = injector.get(IfControlStateService);
      this.controlClassService = injector.get(ControlClassService);
      this.markControlService = injector.get(MarkControlService);
    } catch (e) {
      // Swallow errors
    }

    if (this.controlClassService) {
      this.controlClassService.initControlClass(renderer, el.nativeElement);
    }
    if (this.markControlService) {
      this.subscriptions.push(
        this.markControlService.touchedChange.subscribe(() => {
          this.markAsTouched();
        })
      );
    }

    if (this.ngControlService) {
      this.subscriptions.push(
        this.ngControlService.helpersChange.subscribe((state: Helpers) => {
          this.setAriaDescribedBy(state);
        })
      );
    }
  }

  @Input()
  @HostBinding()
  get id() {
    return this._id;
  }
  set id(value: string) {
    this._id = value;
    if (this.controlIdService) {
      this.controlIdService.id = value;
    }
  }

  ngOnInit() {
    this._containerInjector = new HostWrapper(this.wrapperType, this.vcr, this.index);
    this.controlIdService = this._containerInjector.get(ControlIdService);

    try {
      this.containerIdService = this._containerInjector.get(ContainerIdService);
    } catch (_injectorError) {
      /**
       * We suppress error, not all containers will provide `ContainerIdService` so
       * there could be exception that is not provided.
       */
    }

    if (this._id) {
      this.controlIdService.id = this._id;
    } else {
      this._id = this.controlIdService.id;
    }

    if (this.ngControlService) {
      this.ngControlService.setControl(this.ngControl);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('blur')
  triggerValidation() {
    if (this.ifControlStateService) {
      this.ifControlStateService.triggerStatusChange();
    }
  }

  // @TODO This method has a try/catch due to an unknown issue that came when building the clrToggle feature
  // We need to figure out why this fails for the ClrToggle scenario but works for Date picker...
  // To see the error, remove the try/catch here and run the ClrToggle suite to see issues getting the container
  // injector in time, and this ONLY HAPPENS in tests and not in dev/prod mode.
  protected getProviderFromContainer<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): T {
    try {
      return this._containerInjector.get(token, notFoundValue);
    } catch (e) {
      return notFoundValue;
    }
  }

  private markAsTouched(): void {
    this.ngControl.control.markAsTouched();
    this.ngControl.control.updateValueAndValidity();
  }

  private setAriaDescribedBy(helpers: Helpers) {
    if (helpers.show) {
      const ariaDescribedBy = this.getAriaDescribedById(helpers);
      if (ariaDescribedBy !== null) {
        this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', ariaDescribedBy);
        return;
      }
    }

    this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
  }

  private getAriaDescribedById(helpers: Helpers): string | null {
    let suffix = CONTROL_SUFFIX.HELPER;

    if (helpers.showInvalid) {
      suffix = CONTROL_SUFFIX.ERROR;
    } else if (helpers.showValid) {
      suffix = CONTROL_SUFFIX.SUCCESS;
    }

    if (this.containerIdService) {
      return this.containerIdService.id.concat('-', suffix);
    }

    if (this.controlIdService) {
      return this.controlIdService.id.concat('-', suffix);
    }

    /**
     * If ContainerIdService or ControlIdService are missing don't try to guess
     * Don't set anything.
     */
    return null;
  }
}
