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

	var nextAddress = -1;
	var firstLoad = false;
	//35.2018863,-101.9450251
	var addresses = [
		["29.422398, -98.483948", "35.2018863,-101.9450251"],
		["29.422181, -98.484291", "38.9255344,-94.4579544"],
		["29.422344, -98.484910", "35.129105,-90.1112142"],
		["29.422246, -98.484760", "30.2119763,-92.1087807"],
		["29.422127, -98.484047", "31.8765907,-102.4137652"]
	];
	var directionsDisplay;
	var map;
	var delay = 10;
	var routes = [];
	var comingBack = false;
	var newDestination

	return Controller.extend("com.wipro.vts.controller.Home", {
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
			oRouter.getRoute("Home").attachPatternMatched(function (oEvent) {

				if (com.wipro.vts.truckMarkers && com.wipro.vts.truckMarkers.length > 0) {
					for (var i in com.wipro.vts.truckMarkers) {
						com.wipro.vts.truckMarkers[i].set("map", map);
					}
				}

				this.getView().setBusy(true);
				jQuery.sap.delayedCall(2000, this, function () {
					this.getView().setBusy(false);
				});

				var arg = oEvent.getParameter("arguments");
				var sContext = arg.context;
				if (sContext) {
					var model = this.getView().getModel().getProperty(atob(sContext));
					newDestination = model.destinationAddress.CITY1;
					addresses.push(["29.422398, -98.483948", newDestination]);
					this.mapRendering();

				}

				this.oView = this.getView();

				this.getView().setModel(new JSONModel({
					KPICollapsed: true
				}), "view");

				com.wipro.vts.this = this;
				this.getView().getModel().setProperty("/PredictionData", {});
			}, this);
		},

		collapseKPIs: function () {
			this.getView().getModel("view").setProperty("/KPICollapsed", !this.getView().getModel("view").getProperty("/KPICollapsed"));
		},

		//Rendering Map
		onAfterRendering: function () {
			if (!firstLoad) {
				com.wipro.vts.truckMarkers = [];
				this.mapRendering();
			}
			// Map Rendering
			this.getView().byId("map").setBusy(false);
		},

		mapRendering: function () {

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
						"lat": 29.422398,
						"lng": -98.483948
					},
					disableDefaultUI: false,
					zoom: 7
				});

				// Plotting Command Centre and its Geo Fence area  
				new GMaps.Marker({
					position: new GMaps.LatLng({
						lat: 29.422398,
						lng: -98.483948
					}),
					title: "Command Centre",
					map: map,
					icon: {
						"url": "img/CC.png"
					}
				});
				new GMaps.Circle({
					strokeColor: '#FF0000',
					strokeOpacity: 0.8,
					strokeWeight: 2,
					fillColor: '#FF0000',
					fillOpacity: 0.35,
					map: map,
					center: {
						"lat": 29.422398,
						"lng": -98.483948
					},
					radius: Math.sqrt(4) * 50
				});

				//Plotting Destination marks and its geo fence area
				var destinations = [{
					lat: 35.2018863,
					lng: -101.9450251
				}, {
					lat: 38.9255344,
					lng: -94.4579544
				}, {
					lat: 35.129105,
					lng: -90.1112142
				}, {
					lat: 30.2119763,
					lng: -92.1087807
				}, {
					lat: 31.8765907,
					lng: -102.4137652
				}, {
					lat: 27.7618398,
					lng: -97.5070947
				}];

				for (var i in destinations) {
					new GMaps.Marker({
						position: new GMaps.LatLng(destinations[i]),
						title: "Gas Station",
						map: map,
						icon: {
							"url": "img/gas2.png"
						}
					});

					new GMaps.Circle({
						strokeColor: '#FF0000',
						strokeOpacity: 0.8,
						strokeWeight: 2,
						fillColor: '#FF0000',
						fillOpacity: 0.35,
						map: map,
						center: destinations[i],
						radius: Math.sqrt(250) * 100
					});
				}

				this.geocoder = new window.google.maps.Geocoder();
				this.geocoder.geocode({
					'address': newDestination
				}, function (results, status) {
					if (status == window.google.maps.GeocoderStatus.OK) {
						map.setCenter(results[0].geometry.location);
						var marker = new window.google.maps.Marker({
							map: map,
							position: results[0].geometry.location,
							icon: {
								"url": "img/gas2.png"
							}
						});
					}
				});

				//Lat and Lng of Parking Lot
				var that = this;
				var j = 0;
				var AlloatedOrders = [];
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
				}];

				//Requesting route from Google Maps API
				Promise.all(addresses.map(addr => {
					return new Promise(function (resolve, reject) {
						var src = addr[0],
							dest = addr[1];
						var request = {
							origin: src,
							destination: dest,
							travelMode: 'DRIVING'
						};
						that.directionsService.route(request, function (result, status) {
							if (status == 'OK') {
								resolve(result);
							} else {
								reject(status);
							}
						});
					});
				})).then(function (results) {
					that.getView().getModel().setProperty("/routes", results);
					that.VEH_ID = 0;
					var endAddress = results[3].routes[0].legs[0].end_address;
					var alertAdd = results[2].routes[0].legs[0].end_address

					results.forEach((result, index) => {

						directionsDisplay = new GMaps.DirectionsRenderer();
						directionsDisplay.setOptions({
							map: map,
							suppressMarkers: true
						});
						directionsDisplay.setMap(map);
						directionsDisplay.setDirections(result);
						// combine the bounds of the responses
						that.bounds.union(result.routes[0].bounds);
						// zoom and center the map to show all the routes
						map.fitBounds(that.bounds);

						//Pushing Parking LatLng into routes array
						var parkingLtlg = new GMaps.LatLng(parkingLatLng[index]);
						result.routes[0].overview_path.unshift(parkingLtlg);

						if (newDestination === null || newDestination === undefined) {
							//Combining all Trucks, Orders and Drivers model
							that.getView().getModel().setProperty("/Trucks/" + index + "/AllocationStatus", "Unavailable");
							that.getView().getModel().setProperty("/Trucks/" + index + "/truckStatus", "In-Transit");
							that.getView().getModel().setProperty("/Orders/" + index + "/orderAlloted", "Yes");
							that.getView().getModel().setProperty("/Drivers/" + index + "/allocationStatus", "Unavailable");

						} else {
							that.getView().getModel().setProperty("/Trucks/" + index + "/AllocationStatus", "Unavailable");
							that.getView().getModel().setProperty("/Trucks/" + index + "/truckStatus", "In-Transit");
							that.getView().getModel().setProperty("/Orders/" + index + "/orderAlloted", "Yes");
							that.getView().getModel().setProperty("/Drivers/" + index + "/allocationStatus", "Unavailable");
							if (index === results.length - 1) {
								that.getView().getModel().setProperty("/Trucks/" + index + "/truckStatus", "Under Processing");
							} else {
								that.getView().getModel().setProperty("/Trucks/" + index + "/truckStatus", "In-Transit");
							}
						}
						var orders = that.getView().getModel().getProperty("/Orders/" + index);
						orders.truckDet = that.getView().getModel().getProperty("/Trucks/" + index);
						orders.driverDet = that.getView().getModel().getProperty("/Drivers/" + index);

						AlloatedOrders.push(orders);

						// Plot markers
						var i = Math.round(Math.random() * 10);
						var marker = null;

						//Plotting normal truck markers
						if (result.routes[0].legs[0].end_address !== endAddress) {

							if (result.routes[0].legs[0].end_address === alertAdd) {
								marker = new GMaps.Marker({
										position: new GMaps.LatLng({
											lat: result.routes[0].overview_path[20 * i].lat(),
											lng: result.routes[0].overview_path[20 * i].lng()
										}),
										addressRoute: addresses[index],
										popUpStatus: 0,
										routeResult: results[index],
										stepIndex: 20 * i,
										stepsArray: result.routes[0].overview_path,
										finalPostion: {
											mylat: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lat(),
											mylng: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lng()
										},
										parking: parkingLatLng[index],
										signedOff: false,
										markerDet: orders,
										title: "Truck",
										signOffButton: false,
										raiseAlert: true,
										map: map,
										contextPath: "/Markers/" + index,
										icon: {
											"url": "img/senAlert.gif"
										}
									})
									// that.getView().getModel().setProperty("DriverPage", marker);
							} else {
								if (index === results.length - 1) {
									marker = new GMaps.Marker({
										position: new GMaps.LatLng({
											lat: result.routes[0].overview_path[1].lat(),
											lng: result.routes[0].overview_path[1].lng()
										}),
										addressRoute: addresses[index],
										popUpStatus: 0,
										routeResult: results[index],
										stepIndex: 20 * i,
										stepsArray: result.routes[0].overview_path,
										finalPostion: {
											mylat: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lat(),
											mylng: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lng()
										},
										parking: parkingLatLng[index],
										signedOff: false,
										signOffButton: false,
										markerDet: orders,
										title: "Truck",
										raiseAlert: false,
										map: map,
										contextPath: "/Markers/" + index,
										icon: {
											"url": "img/onwayTrucks.png"
										}
									})
								} else {
									marker = new GMaps.Marker({
										position: new GMaps.LatLng({
											lat: result.routes[0].overview_path[20 * i].lat(),
											lng: result.routes[0].overview_path[20 * i].lng()
										}),
										addressRoute: addresses[index],
										popUpStatus: 0,
										routeResult: results[index],
										stepIndex: 20 * i,
										stepsArray: result.routes[0].overview_path,
										finalPostion: {
											mylat: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lat(),
											mylng: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lng()
										},
										parking: parkingLatLng[index],
										signedOff: false,
										signOffButton: false,
										markerDet: orders,
										title: "Truck",
										raiseAlert: false,
										map: map,
										contextPath: "/Markers/" + index,
										icon: {
											"url": "img/onwayTrucks.png"
										}
									})
								}

							}

							that.attachClickEvent(marker);

							//Speed details in infoWindow 
							var min = Math.ceil(50);
							var max = Math.floor(60);
							var speed = (Math.floor(Math.random() * (max - min + 1)) + min) + "MPH";

							// InfoWindow content
							var content = '<div id="iw-container">' +
								'<div class="iw-content">' +
								speed +
								'</div>' +
								'</div>';

							var infowindow = new google.maps.InfoWindow({
								content: content,
								disableAutoPan: true,
								maxWidth: 200,
								boxStyle: {
									padding: "0px 0px 0px 0px",
									width: "200px",
									height: "20px"
								}
							});
							infowindow.open(map, marker);

							// Moving the marker after X interval
							setInterval(function () {
								if (this.get("stepsArray").length - 1 === this.get("stepIndex")) {
									infowindow.setContent("0 MPH"); //setting speed to O MPH 
									this.setIcon("img/shipped.png");
									if (this.get("signedOff") === false) {
										return;
									} else {
										//this.set("signedOff", false);
										this.set("stepIndex", 0);
										this.set("stepsArray", (this.get("stepsArray").reverse()));
									}
								} else {
									speed = (Math.floor(Math.random() * (Math.floor(60) - Math.ceil(50) + 1)) + Math.ceil(50)) + ' MPH';
									infowindow.setContent(speed, marker);
								}

								if (this.get("stepsArray").length >= this.get("stepIndex")) {
									this.set("stepIndex", this.get("stepIndex") + 1);
								}
								this.setPosition(this.get("stepsArray")[this.get("stepIndex")]);
							}.bind(marker), 8000)
						} else {
							//Plotting deviated Truck Marker
							marker = new GMaps.Marker({
								position: new GMaps.LatLng({
									lat: result.routes[0].overview_path[80].lat() + 0.2558,
									lng: result.routes[0].overview_path[80].lng()
								}),
								stepIndex: 80,
								stepsArray: result.routes[0].overview_path,
								finalPostion: {
									mylat: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lat(),
									mylng: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lng()
								},
								markerDet: orders,
								title: "Truck",
								raiseAlert: false,
								map: map,
								contextPath: "/Markers/" + index,
								icon: {
									"url": "img/devroute2.gif"
								}
							})

							// Attach click Event
							that.attachClickEvent(marker);

							//Plotting Deviated ROute in red color
							var request = {
								origin: "29.422398, -98.483948",
								destination: marker.position.lat() + "," + marker.position.lng(),
								travelMode: 'DRIVING'
							};
							that.directionsService.route(request, function (result, status) {
								if (status == 'OK') {
									console.log("Printing");
									directionsDisplay = new GMaps.DirectionsRenderer({
										polylineOptions: {
											strokeColor: "#8b0013"
										}
									});
									directionsDisplay.setOptions({
										map: map,
										suppressMarkers: true
									});
									directionsDisplay.setMap(map);
									directionsDisplay.setDirections(result);
								} else {
									console.log("Not Printing");
									reject(status);
								}
							});
						}
						com.wipro.vts.truckMarkers.push(marker);
					});
					that.getView().getModel().setProperty("/AlloatedOrders", com.wipro.vts.truckMarkers);
					that.getView().getModel().setProperty("/Markers", AlloatedOrders);

					//Setting up the Tiles data

					//Available trucks and lengths
					var truckLength = _.filter(that.getView().getModel().getProperty("/Trucks"), function (obj) {
						return obj.AllocationStatus === "Available";
					});
					that.getView().getModel().setProperty("/availableTrucks", truckLength.length);
					that.getView().getModel().setProperty("/availableTrucks2", truckLength);

					//Unavailable trucks and lengths
					var allotedTrucks = _.filter(that.getView().getModel().getProperty("/Trucks"), function (obj) {
						return obj.AllocationStatus === "Unavailable";
					});
					that.getView().getModel().setProperty("/allotedTrucks", allotedTrucks.length);
					that.getView().getModel().setProperty("/allotedTrucks2", allotedTrucks);

					//In-transit trucks and length
					var inTransitTrucks = _.filter(that.getView().getModel().getProperty("/Trucks"), function (obj) {
						return obj.truckStatus === "In-Transit";
					});
					that.getView().getModel().setProperty("/inTransitTrucks", inTransitTrucks);
					that.getView().getModel().setProperty("/inTransitTrucksLength", inTransitTrucks.length);

					//Loading trucks and length
					var loadingTrucks = _.filter(that.getView().getModel().getProperty("/Trucks"), function (obj) {
						return obj.truckStatus === "Under Processing";
					});
					that.getView().getModel().setProperty("/loadingTrucks", loadingTrucks);
					that.getView().getModel().setProperty("/loadingTrucksLength", loadingTrucks.length);

					//Unalloted deliveries and its length
					var newDelivery = _.filter(that.getView().getModel().getProperty("/Orders"), function (obj) {
						return obj.orderAlloted === "No";
					});
					that.getView().getModel().setProperty("/newDelivery", newDelivery.length);
					that.getView().getModel().setProperty("/newDelivery2", newDelivery);

					//Unalloted drivers and its length
					var driverLength = _.filter(that.getView().getModel().getProperty("/Drivers"), function (obj) {
						return obj.allocationStatus === "Available";
					});
					that.getView().getModel().setProperty("/availableDrivers2", driverLength);
					var unAvailableDrivers = _.filter(that.getView().getModel().getProperty("/Drivers"), function (obj) {
						return obj.allocationStatus === "Unavailable";
					});
					that.getView().getModel().setProperty("/unAvailableDrivers", unAvailableDrivers);

					//On-going Shipment's length
					that.getView().getModel().setProperty("/trucksShippment", AlloatedOrders.length);

				}).catch(function (err) {
					console.log(err)
				});

				//Plotting returning truck route and marker
				var request = {
					origin: "27.7618398,-97.5070947",
					destination: "29.422398, -98.483948",
					travelMode: 'DRIVING'
				};
				that.directionsService.route(request, function (result, status) {
					if (status == 'OK') {
						console.log("Printing");
						directionsDisplay = new GMaps.DirectionsRenderer();
						directionsDisplay.setOptions({
							map: map,
							suppressMarkers: true
						});
						directionsDisplay.setMap(map);
						directionsDisplay.setDirections(result);

						var marker = new GMaps.Marker({
							position: new GMaps.LatLng({
								lat: result.routes[0].overview_path[1].lat(),
								lng: result.routes[0].overview_path[1].lng()
							}),
							stepIndex: 1,
							stepsArray: result.routes[0].overview_path,
							finalPostion: {
								mylat: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lat(),
								mylng: result.routes[0].overview_path[result.routes[0].overview_path.length - 1].lng()
							},
							signedOff: false,
							title: "Truck",
							map: map,
							icon: {
								"url": "img/shipped.png"
							}
						})

						setInterval(function () {
							if (this.get("stepsArray").length - 1 === this.get("stepIndex")) {
								return;
							}
							if (this.get("stepsArray").length >= this.get("stepIndex")) {
								this.set("stepIndex", this.get("stepIndex") + 1);
							}
							this.setPosition(this.get("stepsArray")[this.get("stepIndex")]);
						}.bind(marker), 8000)
					} else {
						console.log("Not Printing");
						reject(status);
					}
				});

			});

			//Weather API to display weather data
			var that = this;
			$.ajax({
				url: "/weather/forecast?lat=9.210560&lon=7.614788&appid=90bc35b3eadf0c0fa1c8ac8dc5cca369",
				dataType: "json",
				success: function (response) {
					that.getView().getModel().setProperty("/weather", response);
				},
				error: function () {}
			});
			firstLoad = true;

		},

		attachClickEvent: function (marker) {
			var date = new Date();
			var data = [{
				"TIME_STAMP": new Date(date.getTime() - 20000),
				"Temperature": 23,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 18000),
				"Temperature": 22,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 16000),
				"Temperature": 21,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 14000),
				"Temperature": 28,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 12000),
				"Temperature": 27,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 10000),
				"Temperature": 25,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 8000),
				"Temperature": 25,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 6000),
				"Temperature": 28,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 4000),
				"Temperature": 25,
				"Pressure": 1
			}, {
				"TIME_STAMP": new Date(date.getTime() - 2000),
				"Temperature": 25,
				"Pressure": 1
			}];

			jQuery.sap.intervalCall(8000, this, function () {
				var v1 = 30 + Math.round(Math.random() * 1);
				var v2 = (Math.random() * 0.3 + 1.0).toFixed(1);
				if (!marker.get("raiseAlert")) {
					v1 = 20 + Math.round(Math.random() * 1);
					v2 = 1;
				}
				data.splice(0, 1);
				var date1 = new Date();
				data.push({
					"TIME_STAMP": new Date(date1.getTime()),
					"Temperature": v1,
					"Pressure": v2,
				});
				this.getView().getModel().setProperty(marker.contextPath + "/SensorDetails", {
					currTemp: v1,
					currPressure: v2
				});
				this.getView().getModel().setProperty(marker.contextPath + "/PredictionData", data);
			});

			marker.addListener("click", function () {
				console.log(marker.get("popUpStatus"));
				var that = com.wipro.vts.this;
				var markerDomRef = $("<i></i>").css("position", "fixed").css("left", event.clientX).css("top", event.clientY)[0];
				$("body").append(markerDomRef);
				if (!that.thingListPopover) {
					that.thingListPopover = sap.ui.xmlfragment("com.wipro.vts.fragments.SensorDetails", that);
					that.getView().addDependent(that.thingListPopover);
				}
				that.thingListPopover.bindElement(this.contextPath);
				that.getView().getModel().setProperty("/thing", this.markerDet);
				that.getView().getModel().setProperty("/TruckData", this.markerDet);
				jQuery.sap.delayedCall(0, that, function () {
					that.thingListPopover.openBy(markerDomRef);
				});

				that.myFalseIconChange = marker;
			});

		},

		onConversationPress: function (oEvent) {
			var oSource = oEvent.getSource();
			var VEH_ID = oSource.getParent().getParent().getProperty("title");
			VEH_ID = VEH_ID.substr(VEH_ID.indexOf(" ") + 1);
			console.log(VEH_ID);
			jQuery.sap.delayedCall(1, this, function () {
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Conversations", {
					context: VEH_ID
				});
			});
		},

		onDeliveryClose: function (oEvent) {
			var newStepArray = this.myFalseIconChange.stepsArray;
			newStepArray = newStepArray.reverse();
			this.myFalseIconChange.set("signedOff", true);
			this.myFalseIconChange.set("popUpStatus", 1);

			this.signOffDialog.close();
		},

		handleSearch: function (oEvent) {
			// var aFilters = [];
			var sValue = oEvent.getSource().getValue();
			var oFilter = "";
			if (sValue && sValue.length > 0) {
				oFilter = new Filter([
					new Filter("markerDet/driverDet/FIRST_NAME", sap.ui.model.FilterOperator.Contains, sValue),
					new Filter("markerDet/NAME1", sap.ui.model.FilterOperator.Contains, sValue),
					new Filter("markerDet/SHNUMBER", sap.ui.model.FilterOperator.Contains, sValue),
					new Filter("markerDet/truckDet/VEH_ID", sap.ui.model.FilterOperator.Contains, sValue)
				], false);
			}

			// update list binding
			var list = this.byId("ListID");
			var binding = list.getBinding("items");
			binding.filter([oFilter], "Application");
		},

		onListItemPress: function (oEvent) {
			var eventObject = oEvent.getSource().getBindingContext().getObject();
			map.panTo({
				"lat": eventObject.position.lat(),
				"lng": eventObject.position.lng()
			});
			map.setZoom(8);
		},

		onSignOffClose: function (data) {
			this.signOffDialog.close();
		},

		onBackPress: function (oEvent) {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("MainPage");
		}
	});
});