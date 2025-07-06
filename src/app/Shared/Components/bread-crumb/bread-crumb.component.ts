import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-bread-crumb',
  imports: [BreadcrumbModule],
  templateUrl: './bread-crumb.component.html',
  styleUrl: './bread-crumb.component.css',
})
export class BreadCrumbComponent implements OnInit {
  static readonly ROUTE_DATA_BREADCRUMB = 'breadcrumb';
  readonly home = { icon: 'pi pi-home', url: 'home' };
  menuItems: MenuItem[] = [];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(
        () =>
          (this.menuItems = this.createBreadcrumbs(this.activatedRoute.root))
      );
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: MenuItem[] = []
  ): any {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label =
        child.snapshot.data[BreadCrumbComponent.ROUTE_DATA_BREADCRUMB];
      if (!this.isNullOrUndefined(label)) {
        breadcrumbs.push({ label, url });
      }

      return this.createBreadcrumbs(child, url, breadcrumbs);
    }
  }

  private isNullOrUndefined(value: any) {
    return value === null || value === undefined;
  }
}
