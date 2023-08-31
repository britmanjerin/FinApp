sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("FabFinV3.c.Login", {
		formatter: formatter,
		onInit: function() {
			this.getOwnerComponent().getRouter().getRoute("login").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(evt) {

			if (this.validateCookie("aKey")) {
				this.onNav();
			}
		},

		onLogin: function() {
			var userid = this.byId("idInpUsr").getValue().trim().toUpperCase();
			var aflg = false;
			try {
				aflg = userid.substr(0, 1).charCodeAt() === Number(atob("NjU=")) ? true : false;
			} catch (err) {}
			var pswd = this.byId("idInpPswd").getValue().trim();
			var ekey = "";
			var dk = {
				0: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 6) : String.fromCharCode(e.charCodeAt() + 16)
				},
				1: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 22) : String.fromCharCode(e.charCodeAt() + 37)
				},
				2: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() - 20) : String.fromCharCode(e.charCodeAt() + 16)
				},
				3: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 41) : String.fromCharCode(e.charCodeAt() + 32)
				},
				4: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 10) : String.fromCharCode(e.charCodeAt() + 1)
				},
				5: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() - 5) : String.fromCharCode(e.charCodeAt() - 40)
				},
				6: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 8) : String.fromCharCode(e.charCodeAt() - 18)
				},
				7: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() - 32) : String.fromCharCode(e.charCodeAt() - 22)
				},
				8: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 45) : String.fromCharCode(e.charCodeAt() - 17)
				},
				9: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 17) : String.fromCharCode(e.charCodeAt() + 5)
				},
				10: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() - 31) : String.fromCharCode(e.charCodeAt() + 29)
				},
				11: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() - 6) : String.fromCharCode(e.charCodeAt() + 68)
				},
				12: (e) => {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + 26) : String.fromCharCode(e.charCodeAt() + 2)
				}
			};
			(userid + pswd).split("").forEach(function(e, key) {
				try {
					dk[key](e);
				} catch (err) {}

			});

			var aKey = aflg ? ["3SAUVq", "UYg57T", "zqsHb", "2EzJXsg", ekey, "ghp@#$"] : ["bUwG8", "a6enRw4", "GejXcV", "NILpfi", ekey,
				"ghp@#$"
			];

			aKey = aKey.reverse().join("").replace("@#$", "_");

			this.validateUser(userid, aKey, aflg);

		},

		validateUser: function(user, key, aflg) {
			sap.ui.core.BusyIndicator.show(0);
			var that = this;
			$.ajax({
				type: 'GET',
				url: 'https://api.github.com/repos/britmanjerin/tst/contents/main.json',
				headers: {
					"Authorization": 'Bearer ' + key,
					"Accept": "application/vnd.github.v3+json",
					"Content-Type": "application/json"
				},
				cache: false,
				success: function(odata) {
					sap.ui.core.BusyIndicator.hide();

					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : {};

					if (!aflg) {
						if (data.uc) {

							var frmSes = data.uc.frmSes ? new Date(Number(data.uc.frmSes)) : null;
							var toSes = data.uc.toSes ? new Date(Number(data.uc.toSes)) : null;

							if (frmSes && toSes) {
								var cd = new Date();
								var ctm = Number(String(cd.getHours()) +
									(String(cd.getMinutes()).length < 2 ? "0" + String(cd.getMinutes()) : String(cd.getMinutes())) +
									(String(cd.getSeconds()).length < 2 ? "0" + String(cd.getSeconds()) : String(cd.getSeconds())));
								var frmSes = Number(String(frmSes.getHours()) +
									(String(frmSes.getMinutes()).length < 2 ? "0" + String(frmSes.getMinutes()) : String(frmSes.getMinutes())) +
									(String(frmSes.getSeconds()).length < 2 ? "0" + String(frmSes.getSeconds()) : String(frmSes.getSeconds()))
								);
								var toSes = Number(String(toSes.getHours()) +
									(String(toSes.getMinutes()).length < 2 ? "0" + String(toSes.getMinutes()) : String(toSes.getMinutes())) +
									(String(toSes.getSeconds()).length < 2 ? "0" + String(toSes.getSeconds()) : String(toSes.getSeconds()))
								);

								if (ctm < frmSes || ctm > toSes) {
									MessageBox.error("Session not available.");
									return;
								}
							}
						}
					}

					MessageToast.show("Logged in Successfully.");
					that.setCookie(user, key);
					if(window.mainsha){
						window.mainsha="";
					}
					if(window.custsha){
						window.custsha="";
					}
					
					that.onNav();
				},
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Invalid Username / Password.");
				}
			});
		},

		setCookie: function(user, key) {

			setCookie("aKey", key, 0.3);
			setCookie("user", user, 0.3);

			function setCookie(cname, cvalue, exdays) {
				const d = new Date();
				d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
				let expires = "expires=" + d.toUTCString();
				document.cookie = cname + "=" + cvalue + ";" + expires + ";";
			}

		},

		onNav: function(obj) {
			this.getOwnerComponent().getRouter().navTo("home");
		}

	});
});