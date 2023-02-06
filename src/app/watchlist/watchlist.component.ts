import { Component, OnInit } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {

  constructor(private http: HttpClient) { }
  wl_container = []
  display_error = false
  temp_index = 0
  pageType = "watch"

  ngOnInit(): void {
    this.wl_container = []

    if (window.localStorage.getItem("watchlist_storage") == "{}") {
      this.display_error = true;
    } else {
      this.display_error = false;
      // @ts-ignore
      var watchlist = JSON.parse(window.localStorage.getItem("watchlist_storage"));

      if (Object.keys(watchlist).length >= 1) {
        var batched_search = Object.keys(watchlist)[0]
        for (var i = 1; i < Object.keys(watchlist).length; i++) {
          batched_search = batched_search + "+" + Object.keys(watchlist)[i]
        }
        this.http.get("server/wlprice/" +  batched_search).subscribe((res) => {
          var data = res
          console.log(data)

          for (var j = 0; j < Object.keys(watchlist).length; j++) {
            var wl_item = {}
            // @ts-ignore
            wl_item["ticker"] = Object.keys(watchlist)[j].toUpperCase()
            // @ts-ignore
            wl_item["compName"] = Object.values(watchlist)[j]
            // @ts-ignore
            wl_item["close"] = data[wl_item["ticker"].toUpperCase()]["c"]
            // @ts-ignore
            wl_item["change"] = rdToTwo(data[wl_item["ticker"].toUpperCase()]["d"]) + " (" + rdToTwo(data[wl_item["ticker"].toUpperCase()]["dp"]) + "%)"

            // @ts-ignore
            if(data[wl_item["ticker"].toUpperCase()]["d"] < 0){
              // @ts-ignore
              wl_item["color"] = "red"
            } else {
              // @ts-ignore
              wl_item["color"] = "green"
            }

            // @ts-ignore
            this.wl_container.push(wl_item)
          }
        });
      }

    }


  }

  removeWatchItem(event?: MouseEvent, ticker?: string) {
    // @ts-ignore
    var watchlist = JSON.parse(window.localStorage.getItem("watchlist_storage"));

    for (var i = 0; i < this.wl_container.length; i++) {
      // @ts-ignore
      if(ticker.toUpperCase() == this.wl_container[i]["ticker"].toUpperCase()){
        this.wl_container.splice(i, 1);

        // @ts-ignore
        delete watchlist[ticker.toUpperCase()];
      }
    }
    window.localStorage.setItem("watchlist_storage", JSON.stringify(watchlist));

    if(Object.keys(watchlist).length == 0){
      this.display_error = true;
    }
  }


}


function rdToTwo(given: number){
  return (Math.round(given * 100) / 100)
}

function fmtDate(given: number){
  var dateForm = new Date(given * 1000);
  return dateForm.getFullYear() + "-" + String(dateForm.getMonth() + 1 ).padStart(2, '0') + "-" + String(dateForm.getDate()).padStart(2, '0') + " " + String(dateForm.getHours()).padStart(2, '0') + ":" + String(dateForm.getMinutes()).padStart(2, '0') + ":" + String(dateForm.getSeconds()).padStart(2, '0');
}
