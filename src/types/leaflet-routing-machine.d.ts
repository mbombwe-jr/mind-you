import * as L from "leaflet";

declare module "leaflet" {
  namespace Routing {
    function control(options?: any): any;
    var osrmv1: any;
    // Add other members from leaflet-routing-machine if needed
  }
  interface Map {
    addControl(control: any): this;
    removeControl(control: any): this;
  }
}
