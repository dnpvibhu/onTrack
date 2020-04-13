sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("com.wipro.vts.controller.Detail", {
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Detail").attachPatternMatched(function (oEvent) {
				// var sContext = oEvent.getParameter("arguments").context;
				// this.getView().setBindingContext(this.getView().getModel().createBindingContext(atob(sContext)));
				sap.ui.core.UIComponent.getRouterFor(this).navTo("Home");
			}, this);
		},

		navBack: function () {
			window.history.back();
		}
	});

});

/*
Truck Allocation

1.       The real estate on the screen is not there yet..I don’t think any change has been done.

a.       Truck details should give number and capacity in the drop down

b.       Change email addresses to realistic ones please.

c.       Where is back button in case I decide to abort the allocation ?

d.       New Available Delivery needs to be changed Unallocated delivery orders

e.       Why is there so much space from the customer and destination ?

f.        No back button in new delivery screen.

2.       Available Trucks

a.       23445 – check masters most of it is blank

b.       On main screen you say 7 trucks are there and inside there are only 4 ??

3.       Monitor Trucks

a.       Upon clicking the alert icon, I get a popup which disappears almost immediately. Why is that ?

b.       Why there is no zoom of the truck when you click the truck summary bar in the top.

c.       Keep the zoom in and out option in maps

d.       There is no action once I click the truck which is at the delivery site .

e.       Change the icon to flashing red for re-routed – don’t want amber anywhere.

4.       Driver Page

a.       What do you mean “ Complete the shipping” ? we are not able to do anything with the screen

b.       No back icon.

c.       The driver page need not be put into these tiles and can be shown separately like how we show for Fashion retail etc.

 */