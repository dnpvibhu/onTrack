sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/wipro/vts/js/Formatter",
	"sap/ui/model/Filter",
	"com/wipro/vts/js/underscore",
	"sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, MessageToast, formatter, Filter, _, JSONModel) {
	"use strict";
	var GMaps = null;
	jQuery.sap.require("com.wipro.vts.js.Moment");

	var firstLoad = false;
	//35.2018863,-101.9450251
	var newMarker2;
	var map;
	var address;
	var directionsDisplay;
	var truckPosition, stepIndex;
	var routes = [];
	var revertBack = false;
	var driverSelectionMain;
	var messageArray = [{
		"Name": "Command Center",
		"Photo": "./img/CC.png",
		"Message": "Hello There, \n what is the expected time of your arrival?",
		"MessageTime": "20/03/2020 at 1:30 pm"
	}, {
		"Name": "THOMAS T",
		"Photo": "./img/black.jpeg",
		"Message": "Hello, \n I'm expected to be there by Sunday morning ",
		"MessageTime": "20/03/2020 at 1:31 pm"
	}];

	return Controller.extend("com.wipro.vts.controller.DriverPage", {

		onInit: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			oRouter.getRoute("DriverPage").attachPatternMatched(function (oEvent) {
				var no = oEvent.getParameter("arguments").context;
				var chatDriver = this.getView().getModel().getProperty("/AlloatedOrders/" + no + "/markerDet/driverDet/FIRST_NAME") + " I";
				driverSelectionMain = no;
				this.onDataLoading(2);
				this.onChatLoading(chatDriver);

				com.wipro.vts.this = this;

			}, this);

		},

		onDataLoading: function (selectedDriver) {

			var selectedDriver2 = this.getView().getModel().getProperty("/AlloatedOrders/" + selectedDriver);
			this.newRouteResult = this.getView().getModel().getProperty("/AlloatedOrders/" + selectedDriver + "/routeResult");

			this.getView().byId("driverSelector").setSelectedKey("");
			this.getView().getModel().setProperty("/driverAcknowledgement", "");
			this.getView().getModel().setProperty("/driverConvoMessage", "");
			this.driverDet = this.getView().getModel().getProperty("/AlloatedOrders/" + selectedDriver);
			this.getView().getModel().setProperty("/driverDets", this.driverDet);
			this.getView().getModel().setProperty("/FIRST_NAMETile", this.driverDet);

			//Add Detail for map 
			address = this.driverDet.get("addressRoute");
			truckPosition = this.driverDet.get("position");
			this.stepArrayPrevious = this.driverDet.get("stepsArray").length - 1;

			var that;
			setInterval(function () {
				that = com.wipro.vts.this;
				// truckPosition = that.driverDet.get("position");
				truckPosition = that.getView().getModel().getProperty("/AlloatedOrders/" + driverSelectionMain + "/position");
				stepIndex = that.getView().getModel().getProperty("/AlloatedOrders/" + driverSelectionMain + "/stepIndex");
			}.bind(this), 7000);

			//Notifications
			var today = new Date();
			var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
			var time = today.getHours() + ":" + today.getMinutes();
			var dateTime = date + ' ' + time;
			var alertNotification;
			if (this.driverDet.get("raiseAlert") === true) {
				alertNotification = ["Pressure sensor - Level Breached (1.20 Bar)", "Action: Contact command center ASAP", "At: " + dateTime,
					"img/senAlert.png"
				];
			}
			this.getView().getModel().setProperty("/Notifications", alertNotification);

			//	if (firstLoad === true) {
			this.onMapLoading(selectedDriver2, this.newRouteResult, selectedDriver);
			//			}

		},

		//Rendering Map
		onAfterRendering: function () {
			//this.onMapLoading();
			// Map Rendering
			this.getView().byId("map3").setBusy(false);
		},

		onMapLoading: function (marker, routeResult, selectedDriver) {
			if (address) {
				jQuery.sap.delayedCall(1000, this, function () {
					var mapContainer = this.byId("map3").getDomRef();
					if (!(GMaps = window.google.maps)) {
						MessageToast("Network timed out, Unable to load Map");
						return;
					}
					this.directionsService = new GMaps.DirectionsService();
					map = new GMaps.Map(mapContainer, {
						center: {
							"lat": 29.422398,
							"lng": -98.483948
						},
						disableDefaultUI: true,
						zoom: 18.5
					});

					//Plotting markers for cc and dest
					var newadd;
					var img = ["img/CC.png", "img/gas2.png"];
					for (var i in address) {
						newadd = address[i].split(",");
						//newLat = newadd[0];
						new GMaps.Marker({
							position: new GMaps.LatLng({
								lat: parseFloat(newadd[0]),
								lng: parseFloat(newadd[1])
							}),
							title: "Gas Station",
							map: map,
							icon: {
								"url": img[i]
							}
						});
					}

					//Plotting Route
					var that = com.wipro.vts.this;

					directionsDisplay = new GMaps.DirectionsRenderer({
						polylineOptions: {
							strokeColor: "#6960EC"
						}
					});
					directionsDisplay.setOptions({
						map: map,
						suppressMarkers: true
					});
					directionsDisplay.setMap(map);
					directionsDisplay.setDirections(routeResult);
					marker.set("map", map);

					setInterval(function () {
						that = com.wipro.vts.this;
						if (this.get("stepsArray").length - 1 === this.get("stepIndex")) {
							this.setIcon("img/shipped.png");
							that.getView().byId("signOffButton").setVisible(true);
							if (that.getView().getModel().getProperty("/AlloatedOrders/" + driverSelectionMain + "/signedOff") === false) {
								return;
							} else {
								// this.set("signedOff", true);
								// this.set("signedOff", false);
								that.getView().byId("signOffButton").setVisible(false);
								// this.set("stepIndex", 0);
								that.getView().getModel().setProperty("/AlloatedOrders/" + selectedDriver + "/signedOff", false);
								that.getView().getModel().setProperty("/AlloatedOrders/" + selectedDriver + "/stepIndex", 0);
								that.getView().getModel().setProperty("/AlloatedOrders/" + selectedDriver + "/stepsArray", this.get(
									"stepsArray").reverse());
								//this.set("stepsArray", (this.get("stepsArray").reverse()));
							}
						}

						// if (this.get("stepsArray").length >= this.get("stepIndex")) {
						// 	this.set("stepIndex", this.get("stepIndex") + 1);
						// }
						// this.setPosition(this.get("stepsArray")[this.get("stepIndex")]);

					}.bind(marker), 8000);
					//Do everthing above this point
				});
			}
			firstLoad = true;
		},

		onsignOffButtonPress: function () {
			//newMarker.set("signedOff", true);
			this.getView().getModel().setProperty("/AlloatedOrders/" + driverSelectionMain + "/signedOff", true);
			this.getView().byId("signOffButton").setVisible(false);
			revertBack = true;
		},

		onDriverSelect: function (oEvent) {
			this.selectedDriver = oEvent.getSource().getSelectedIndex();
			this.selectedDriver2 = oEvent.getSource().getSelectedItem().getText();
			this.onDataLoading(this.selectedDriver);
			this.onChatLoading(this.selectedDriver2);
			driverSelectionMain = this.selectedDriver;
		},

		onOkPress: function (oEvent) {
			var driverAcknowledgement = this.getView().getModel().getProperty("/driverAcknowledgement");
			var FIRST_NAME = this.driverDet.markerDet.driverDet.FIRST_NAME;
			var VEH_ID = this.driverDet.markerDet.truckDet.VEH_ID;
			var today = new Date();
			var time = today.getHours() + ":" + today.getMinutes();
			var notifItem = {
				FIRST_NAME: "Acknowedment from " + FIRST_NAME,
				message: "Message: " + driverAcknowledgement,
				messageTime: "At: " + time,
				VEH_ID: "Truck No:" + VEH_ID
			};
			this.getView().getModel().setProperty("/notifItem", notifItem);
			this.getView().getModel().setProperty("/notifItemLength", "1");

			this.driverNotification.close();
		},

		onChatLoading: function (selectedDriver) {
			var driverChatModel;
			this.getView().getModel().setProperty("/driverConvoMessage", "");
			if (selectedDriver === "THOMAS T") {
				driverChatModel = this.getView().getModel().getProperty("/conversationWilliamBlack");
				if (!driverChatModel) {
					driverChatModel = messageArray;
					this.getView().getModel().setProperty("/conversationWilliamBlack", driverChatModel);
				}
			} else {
				driverChatModel = this.getView().getModel().getProperty("/" + selectedDriver);
			}
			this.getView().getModel().setProperty("/driverChatModel", driverChatModel);
		},

		onMessageSend: function (oEvent) {
			var driverChatModel = this.getView().getModel().getProperty("/conversationWilliamBlack");
			var driverConvoMessage = this.getView().getModel().getProperty("/driverConvoMessage");
			var FIRST_NAME = this.driverDet.markerDet.driverDet.FIRST_NAME;
			var today = new Date();
			var date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
			var time = today.getHours() + ":" + today.getMinutes();
			var dateTime = date + ' at ' + time;
			var convoMessage = {
				"Name": FIRST_NAME,
				"Message": driverConvoMessage,
				"MessageTime": dateTime,
				"Photo": "./img/black.jpeg"
			};
			driverChatModel.push(convoMessage);
			this.getView().getModel().setProperty("/conversationWilliamBlack", driverChatModel);
			if (firstLoad === true) {
				this.onChatLoading("THOMAS T");
			} else {
				this.onChatLoading(this.selectedDriver2);
			}
		},

		onNotificationItemPress: function (oEvent) {
			this.getView().setBusy(true);
			var that = com.wipro.vts.this;
			jQuery.sap.delayedCall(2000, this, function () {
				this.getView().setBusy(false);
				if (!this.driverNotification) {
					this.driverNotification = sap.ui.xmlfragment("com.wipro.vts.fragments.DriverNotification", this);
					this.getView().addDependent(this.driverNotification);
				}

				//this.truckDetailDialog.bindElement(this.contextPath);
				this.driverNotification.open();
			});
		},

		onOpenChatWIndow: function (oEvent) {
			this.getView().setBusy(true);
			var that = com.wipro.vts.this;
			jQuery.sap.delayedCall(2000, this, function () {
				this.getView().setBusy(false);
				if (!this.driverConvo) {
					this.driverConvo = sap.ui.xmlfragment("com.wipro.vts.fragments.ChatWindow", this);
					this.getView().addDependent(this.driverConvo);
				}

				//this.truckDetailDialog.bindElement(this.contextPath);
				this.driverConvo.open();
			});
		},

		onDeliveryClose: function () {
			this.driverDets.set("signedOff", true);
			//	this.myFalseIconChange.set("popUpStatus", 1);
		},

		navBack: function () {
			window.history.back();
		}
	});

});

//simulating truck
// setInterval(function () {
// 	that = com.wipro.vts.this;
// if (newMarker.get("stepsArray").length - 1 === newMarker.get("stepIndex")) {
// 	newMarker.setIcon("img/shipped.png");
// 	that.getView().byId("signOffButton").setVisible(true);
// 	if (newMarker.get("signedOff") === false) {
// 		return;
// 	} else {
// 		this.getView().getModel().setProperty("/AlloatedOrders/" + driverSelectionMain + "/signedOff", true);
// 		newMarker.set("signedOff", false);
// 		newMarker.set("stepIndex", 0);
// 		newMarker.set("stepsArray", (newMarker.get("stepsArray").reverse()));
// 	}
// }

// 	if (newMarker.get("stepsArray").length >= newMarker.get("stepIndex")) {
// 		newMarker.set("stepIndex", newMarker.get("stepIndex") + 1);
// 	}
// 	newMarker.setPosition(newMarker.get("stepsArray")[newMarker.get("stepIndex")]);
// }.bind(newMarker), 8000);