sap.ui.define([
	"sap/ui/core/mvc/Controller",
	'sap/ui/core/Fragment',
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/wipro/vts/js/Formatter",
	"sap/ui/model/Filter",
	"com/wipro/vts/js/underscore",
	"sap/ui/model/json/JSONModel"
], function (Controller, Fragment, MessageBox, MessageToast, formatter, Filter, _, JSONModel) {
	"use strict";
	var GMaps = null;
	jQuery.sap.require("com.wipro.vts.js.Moment");

	var firstLoad = false;
	//35.2018863,-101.9450251
	var map;
	var allotmentArray;
	var truckItem;
	var driverItem;

	return Controller.extend("com.wipro.vts.controller.TruckAllotment", {
		navBack: function () {
			window.history.back();
		},

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("TruckAllotment").attachPatternMatched(function (oEvent) {

				var arg = oEvent.getParameter("arguments");
				this.sContext = atob(arg.context);
				// this.getView().setBindingContext(this.getView().getModel("odata").createBindingContext(sContext));                
				jQuery.sap.delayedCall(100, this, function () {
					this.getView().getModel().createBindingContext(this.sContext, null, function (context) {
						this.getView().setBindingContext(context);
						this.getView().setBusy(false);
					}.bind(this));
				});

				com.wipro.vts.truckMarkers = [];

				this.getView().byId("truckSelector").setSelectedKey("");
				this.getView().byId("VEH_MAXVOL").setText("");
				this.getView().byId("truckFuel").setText("");
				this.getView().byId("VEH_TYPE").setText("");

				this.getView().byId("FIRST_NAME").setText("");
				this.getView().byId("DRIVERCODE").setText("");
				this.getView().byId("driverNo").setText("");
				this.getView().byId("driverImg").setSrc("");

				this.getView().getModel().setProperty("/VEH_TYPE", {});

			}, this);
		},

		onTruckItemChange: function (oEvent) {

			//binding into the form
			this.selectedTruck = oEvent.getSource().getSelectedItem().getText();
			var path = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
			this.getView().getModel().createBindingContext(path, null, function (context) {
				this.getView().byId("truckDetailForm").setBindingContext(context);
			}.bind(this));
			truckItem = this.getView().getModel().getProperty(path);
		},

		onDriverItemChange: function (oEvent) {

			//binding into the form
			this.selectedDriver = oEvent.getSource().getSelectedItem().getText();
			var path = oEvent.getSource().getSelectedItem().getBindingContext().getPath();
			this.getView().getModel().createBindingContext(path, null, function (context) {
				this.getView().byId("driverDetailForm").setBindingContext(context);
			}.bind(this));
			driverItem = this.getView().getModel().getProperty(path);
		},

		//Rendering Map
		onAfterRendering: function () {
			if (!firstLoad) {
				jQuery.sap.delayedCall(1000, this, function () {
					var mapContainer = this.byId("map2").getDomRef();
					if (!(GMaps = window.google.maps)) {
						MessageToast("Network timed out, Unable to load Map");
						return;
					}
					map = new GMaps.Map(mapContainer, {
						center: {
							"lat": 29.422398,
							"lng": -98.483948
						},
						disableDefaultUI: true,
						zoom: 18.5
					});

					//Creating GeoFence around parking lot
					var triangleCoords = [{
						lat: 29.422885,
						lng: -98.484551
					}, {
						lat: 29.422385,
						lng: -98.484685
					}, {
						lat: 29.422160,
						lng: -98.483691
					}, {
						lat: 29.422620,
						lng: -98.483584
					}, {
						lat: 29.422885,
						lng: -98.484551
					}];
					var bermudaTriangle = new GMaps.Polygon({
						paths: triangleCoords,
						strokeColor: '#FF0000',
						strokeOpacity: 0.7,
						strokeWeight: 2,
						fillColor: '#BAFFFA',
						fillOpacity: 0.35
					}).setMap(map);

					//Creating models for available trucks and drivers only 
					var availableTrucks2 = this.getView().getModel().getProperty("/availableTrucks2");
					//Plotting parked truck markers 
					var parkingLatLng = [{
						lat: 29.422234,
						lng: -98.483740
					}, {
						lat: 29.422301,
						lng: -98.483720
					}, {
						lat: 29.422364,
						lng: -98.484324
					}, {
						lat: 29.422583,
						lng: -98.483647
					}, {
						lat: 29.422527,
						lng: -98.484058
					}, {
						lat: 29.422756,
						lng: -98.484209
					}];
					var marker = null;
					for (var i in parkingLatLng) {
						marker = new GMaps.Marker({
							position: new GMaps.LatLng(parkingLatLng[i]),
							title: "Truck No " + availableTrucks2[i].VEH_ID + ", Capacity: " + availableTrucks2[i].VEH_MAXVOL,
							VEH_ID: availableTrucks2[i].VEH_ID,
							map: map,
							icon: {
								"url": "img/parkingTrucks.png"
							}
						});
						this.attachClickEvent(marker);
						com.wipro.vts.truckMarkers.push(marker);
					}

					//Do everthing above this point
				});
			}
			// Map Rendering
			this.getView().byId("map2").setBusy(false);
		},

		attachClickEvent: function (marker) {
			marker.addListener("click", function () {
				var that = com.wipro.vts.this;
				var markerDomRef = $("<i></i>").css("position", "fixed").css("left", event.clientX).css("top", event.clientY)[0];
				$("body").append(markerDomRef);
				that.getView().getModel().setProperty("/selectedTruck", this.VEH_ID);
				//that.onTruckItemChange();
				var path = that.getView().getModel().getProperty("/selectedTruck").getBindingContext().getPath();
				that.getView().getModel().createBindingContext(path, null, function (context) {
					that.getView().byId("truckDetailForm").setBindingContext(context);
				}.bind(that));

			});
		},

		onAllocation: function (oEvent) {

			if (this.selectedTruck === "" && this.selectedTruck === null && this.selectedDriver === "" && this.selectedDriver === null) {
				MessageToast.show("Please alot driver and truck.");
			} else {
				this.getView().getModel().setProperty("/truckAllot", this.sContext);
				var data = this.getView().getModel().getProperty("/truckAllot");
				var nextDest = this.getView().getModel().getProperty(data);
				var allotmentdetails = {
					"destinationAddress": nextDest,
					"truckDetails": truckItem,
					"driverDetails": driverItem
				};
				var loadingTruckDetail = [];
				loadingTruckDetail.push(allotmentdetails);
				this.getView().getModel().setProperty("/allotmentDetails", loadingTruckDetail);

				this.getView().setBusy(true);
				jQuery.sap.delayedCall(2000, this, function () {
					this.getView().setBusy(false);
					if (!this.signOffDialog) {
						this.signOffDialog = sap.ui.xmlfragment("com.wipro.vts.fragments.NewOrderDetail", this);
						this.getView().addDependent(this.signOffDialog);
					}
					this.signOffDialog.open();
				});
			}

		},

		onAllotPopUp: function (oEvent) {

			sap.ui.core.UIComponent.getRouterFor(this).navTo("MainPage");

		},

		onNavDetails: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Detail");
			//sap.ui.core.UIComponent.getRouterFor(this).navTo("Helpline");
		}
	});

});