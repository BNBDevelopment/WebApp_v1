import { Component } from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'routing-app';
  last_search = "home"
  pageType = "search"

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    //window.localStorage.clear()

    if(window.localStorage.getItem("watchlist_storage") == null || typeof(window.localStorage.getItem("watchlist_storage")) == "undefined"){
      window.localStorage.setItem("watchlist_storage", JSON.stringify({}));
    }
    if(window.localStorage.getItem("money") == null || typeof(window.localStorage.getItem("money")) == "undefined"){
      window.localStorage.setItem("money", JSON.stringify(25000));
    }

    if(window.localStorage.getItem("owned") == null || typeof(window.localStorage.getItem("owned")) == "undefined"){
      window.localStorage.setItem("owned", JSON.stringify({}));
    }

    if(window.localStorage.getItem("last_search") == null || typeof(window.localStorage.getItem("last_search")) == "undefined"){
      window.localStorage.setItem("last_search", JSON.stringify(""));
    } else {
      // @ts-ignore
      this.last_search = JSON.parse(window.localStorage.getItem("last_search"));
    }

    // @ts-ignore
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (String((<NavigationEnd>event).url).includes("/portfolio")){
          this.pageType = "portfolio"
        } else if (String((<NavigationEnd>event).url).includes("/watchlist")){
          this.pageType = "watch"
        } else {
          this.pageType = "search"
        }
      }
    });
  }

}
