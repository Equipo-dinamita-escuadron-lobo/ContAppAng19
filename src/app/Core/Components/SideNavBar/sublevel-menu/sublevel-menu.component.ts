import { Component, Input, OnInit } from '@angular/core';
import { INavbarData, fadeInOut } from '../helper';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-sublevel-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sublevel-menu.component.html',
  styleUrl: '../side-nav-bar.component.css',
  animations: [
    fadeInOut,
    trigger('submenu', [
      state(
        'hidden',
        style({
          height: '0',
          overflow: 'hidden',
        })
      ),
      state(
        'visible',
        style({
          height: '*',
        })
      ),
      transition('visible <=> hidden', [
        style({ overflow: 'hidden' }),
        animate('{{transitionParams}}'),
      ]),
      transition('void => *', animate(0)),
    ]),
  ],
})
export class SublevelMenuComponent implements OnInit {
  @Input() data: INavbarData = {
    routeLink: '',
    icon: '',
    label: '',
    items: [],
  };

  @Input() collapsed = false;
  @Input() animating: boolean | undefined;
  @Input() expanded: boolean | undefined;
  @Input() multiple: boolean = false;

  constructor(public router: Router) {}

  ngOnInit(): void {}

  handleClick(item: any): void {
    if (!this.multiple) {
      if (this.data.items && this.data.items.length > 0) {
        for (let modelItem of this.data.items) {
          if (item !== modelItem && modelItem.expanded) {
            modelItem.expanded = false;
          }
        }
      }
    }
    item.expanded = !item.expanded;
    this.goRoute(item);
  }

  goRoute(data: INavbarData) {
    return this.router.navigateByUrl(data.routeLink);
  }
}
