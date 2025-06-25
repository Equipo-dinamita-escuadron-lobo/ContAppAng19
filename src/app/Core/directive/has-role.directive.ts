import { Directive, inject, TemplateRef, ViewContainerRef, input, effect } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';


@Directive({
  selector: '[appHasRole]'
})
export class HasRoleDirective {


  private viewContainerRef = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  private user = toSignal(inject(AuthService).currentUser$);

  roles = input.required<string[]>({
    alias: 'hasRole'
  });

  constructor() {
    effect(() => {
      const user = this.user();
      const roles = this.roles();

      this.viewContainerRef.clear();

      if (user && roles && this._hasRole(user, roles)) {
        this.viewContainerRef.createEmbeddedView(this.templateRef);
      }
    });
  }

  private _hasRole(user: any, roles: string[]) {
    return user.roles.some((role: string) => roles.includes(role));
  }

}
