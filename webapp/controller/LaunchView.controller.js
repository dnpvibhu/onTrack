sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/Fragment',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel"
], function (Controller, Fragment, MessageBox, MessageToast, JSONModel) {
	"use strict";
	var GMaps = null;
	jQuery.sap.require("com.wipro.vts.js.Moment");

	var nextAddress = -1;
	/*var addresses = [
		["Oromineke/Ezimgbu, Port Harcourt, Nigeria", "Itohun-Ilogbo-Igbesa Road, Nigeria"],
		["Oromineke/Ezimgbu, Port Harcourt, Nigeria", "Odo-Ode/Aboto, Nigeria"],
		["Oromineke/Ezimgbu, Port Harcourt, Nigeria", "MKO Abiola Way, Ibadan, Nigeria"],
		["Oromineke/Ezimgbu, Port Harcourt, Nigeria", "Uruagu III, Nnewi, Nigeria"],
		["Oromineke/Ezimgbu, Port Harcourt, Nigeria", "Zawan Roundabout, JOS, Plateau State"]
	];*/
	var addresses = [
		["4.816280,7.000530", "6.585620,3.082160"],
		["4.816280,7.000530", "8.158690,4.541490"],
		["4.816280,7.000530", "7.371500,3.859660"],
		["4.816280,7.000530", "6.019860,6.914780"],
		["4.816280,7.000530", "9.750000,8.866667"]
	];
	var directionsDisplay;
	var map;
	var delay = 10;
	var routes = [];
	var comingBack = false;

	return Controller.extend("com.wipro.vts.controller.LaunchView", {
		/*************************************************************************************************************/
		// Handling Formatters
		relativeDate: function (epoch) {
			return window.moment.unix(epoch).format("ddd, hA");
		},
		kelvinToCel: function (kelvin) {
			return (kelvin - 273.15).toFixed(0);
		},
		/*************************************************************************************************************/

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("LaunchView").attachPatternMatched(function (oEvent) {

				var arg = oEvent.getParameter("arguments");
				var sContext = arg.context;
				this.newDestination = sContext;
				addresses.push(["4.816280,7.000530", this.newDestination]);
				

				this.getView().setModel(new JSONModel({
					KPICollapsed: true
				}), "view");
				com.wipro.vts.truckMarkers = [];
				com.wipro.vts.this = this;

				this.getView().getModel().setProperty("/entryDest", {});

			}, this);
		},

		collapseKPIs: function () {
			this.getView().getModel("view").setProperty("/KPICollapsed", !this.getView().getModel("view").getProperty("/KPICollapsed"));
		},

		onNewDilveryPress: function (oEvent) {
			if (!this.pressDialog) {
				this.pressDialog = sap.ui.xmlfragment("com.wipro.vts.fragments.NewOrderDetail", this);
				this.getView().addDependent(this.pressDialog);
			}
			this.pressDialog.open();
		},

		onOrderSelect: function (oEvent) {
			var sContext = oEvent.getSource().getBindingContext().sPath;
			sContext = btoa(sContext);
			sap.ui.core.UIComponent.getRouterFor(this).navTo("TruckAllotment", {
				context: sContext
			});
			comingBack = true;
			this.pressDialog.close();
		},

		onDestinationPress: function (oEvent) {
			if (!this.pressDialog) {
				this.pressDialog = sap.ui.xmlfragment("com.wipro.vts.fragments.DestinationInput", this);
				this.getView().addDependent(this.pressDialog);
			}
			this.pressDialog.open();
		},

		onSearch: function (oEvent) {
			this.newDestination = this.getView().getModel().getProperty("/entryDest");
			addresses.push(["4.816280,7.000530", this.newDestination]);
			this.theNext();

			this.geocoder = new window.google.maps.Geocoder();
			this.geocoder.geocode({
				'address': this.newDestination
			}, function (results, status) {
				if (status == window.google.maps.GeocoderStatus.OK) {
					map.setCenter(results[0].geometry.location);
					var marker = new window.google.maps.Marker({
						map: map,
						position: results[0].geometry.location,
						icon: {
							"url": "img/gas.png"
						}
					});
				} else {
					sap.m.MessageToast.show("Geocode was not successful for the following reason:" + status);
				}
			});
			this.pressDialog.close();

		},

		onAfterRendering: function () {
			// Map Rendering
			jQuery.sap.delayedCall(1000, this, function () {
				var mapContainer = this.byId("map").getDomRef();
				if (!(GMaps = window.google.maps)) {
					MessageToast("Network timed out, Unable to load Map");
					return;
				}
				this.bounds = new GMaps.LatLngBounds();
				this.directionsService = new GMaps.DirectionsService();
				map = new GMaps.Map(mapContainer, {
					center: {
						"lat": 41.850033,
						"lng": -87.6500523
					},
					disableDefaultUI: true,
					zoom: 7
				});
				// Command Centre
				new GMaps.Marker({
					position: new GMaps.LatLng({
						lat: 4.816280,
						lng: 7.000530
					}),
					title: "Command Centre",
					map: map,
					icon: {
						"url": "img/CC.png"
					}
				});
				//Destinations
				var destinations = [{
					lat: 6.585620,
					lng: 3.082160
				}, {
					lat: 8.158690,
					lng: 4.541490
				}, {
					lat: 7.371500,
					lng: 3.859660
				}, {
					lat: 6.019860,
					lng: 6.914780
				}, {
					lat: 9.750000,
					lng: 8.866667
				}];
				for (var i in destinations) {
					new GMaps.Marker({
						position: new GMaps.LatLng(destinations[i]),
						title: "Gas Station",
						map: map,
						icon: {
							"url": "img/gas.png"
						}
					});
				}
				this.theNext();
				
				
				this.geocoder = new window.google.maps.Geocoder();
					this.geocoder.geocode({
						'address': this.newDestination
					}, function (results, status) {
						if (status == window.google.maps.GeocoderStatus.OK) {
							map.setCenter(results[0].geometry.location);
							var marker = new window.google.maps.Marker({
								map: map,
								position: results[0].geometry.location,
								icon: {
									"url": "img/gas.png"
								}
							});
						} else {
							sap.m.MessageToast.show("Geocode was not successful for the following reason:" + status);
						}
					});
				// console.log(routes);
			});
			var that = this;
			$.ajax({
				url: "/weather/forecast?lat=9.210560&lon=7.614788&appid=90bc35b3eadf0c0fa1c8ac8dc5cca369",
				dataType: "json",
				success: function (response) {
					that.getView().getModel().setProperty("/weather", response);
				},
				error: function () {
					///    MessageBox.alert("Unable to load Weather Forecast");
				}
			});
			this.getView().byId("map").setBusy(false);
		},

		calcRoute: function calcRoute(start, end, next) {
			//    console.log("calcRoute('" + start + "','" + end + "',next)");
			var request = {
				origin: start,
				destination: end,
				travelMode: 'DRIVING'
			};
			var that = this;
			this.directionsService.route(request,
				function (result, status) {
					if (status == 'OK') {

						directionsDisplay = new GMaps.DirectionsRenderer();
						directionsDisplay.setOptions({
							map: map,
							suppressMarkers: true
						});
						directionsDisplay.setMap(map);

						directionsDisplay.setDirections(result);
						routes.push(result);

						// combine the bounds of the responses
						that.bounds.union(result.routes[0].bounds);
						// zoom and center the map to show all the routes
						map.fitBounds(that.bounds);
					}
					that.theNext();
				});
		},
		theNext: function theNext() {
			if (nextAddress < addresses.length - 1) {
				//    console.log('call calcRoute("' + addresses[nextAddress][0] + '","' + addresses[nextAddress][1] + ') delay=' + delay);
				nextAddress++;
				setTimeout(this.calcRoute(addresses[nextAddress][0], addresses[nextAddress][1], this.theNext()), delay);
			} else {
				// We're done. Show map bounds
				map.fitBounds(this.bounds);
				for (var i = 1; i <= routes.length; i++) {

					com.wipro.vts.truckMarkers.push(new GMaps.Marker({
						position: new GMaps.LatLng({
							lat: routes[i - 1].routes[0].legs[0].steps[4 * i].end_location.lat(),
							lng: routes[i - 1].routes[0].legs[0].steps[4 * i].end_location.lng()
						}),
						title: "Truck",
						map: map,
						icon: {
							"url": "img/truck.png"
						}
					}));
					// }
				}
				jQuery.sap.delayedCall(2000, this, function () {
					for (var i in com.wipro.vts.truckMarkers) {
						com.wipro.vts.truckMarkers[i].addListener("click", function () {
							// var markerEvent = this;
							var that = com.wipro.vts.this;
							var markerDomRef = $("<i></i>").css("position", "fixed").css("left", event.clientX).css("top", event.clientY)[0];

							$("body").append(markerDomRef);

							if (!that.thingListPopover) {
								that.thingListPopover = sap.ui.xmlfragment("com.wipro.vts.fragments.SensorDetails", that);
								that.getView().addDependent(that.thingListPopover);
							}

							jQuery.sap.delayedCall(0, that, function () {
								that.thingListPopover.openBy(markerDomRef);
							});
						});
					}
				});
			}
		}
	});
});