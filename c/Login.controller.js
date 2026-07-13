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
				adflg = userid.substr(0, 1).charCodeAt() === Number(atob("NjU=")) ? true : false;
				aflg = true;
			} catch (err) {}
			var pswd = this.byId("idInpPswd").getValue().trim();
			var ekey = "",
				kArr = [
					[6, 22, -20, 41, 10, -5, 8, -32, 45, 17, -31, -6, 26],
					[16, 37, 16, 32, 1, -40, -18, -22, -17, 5, 29, 68, 2]
				];

			(userid + pswd).split("").forEach(function(e, key) {
				try {
					ekey += aflg ? String.fromCharCode(e.charCodeAt() + kArr[0][key]) : String.fromCharCode(e.charCodeAt() + kArr[1][key])

				} catch (err) {}

			});

			var aKey = aflg ? ["3SAUVq", "UYg57T", "zqsHb", "2EzJXsg", ekey, "ghp@#$"] : ["bUwG8", "a6enRw4", "GejXcV", "NILpfi", ekey,
				"ghp@#$"
			];

			aKey = aKey.reverse().join("").replace("@#$", "_");

			this.validateUser(userid, aKey, adflg);

		},

		validateUser: function(user, key, aflg) {
			sap.ui.core.BusyIndicator.show(0);
			var url = 'https://api.github.com/repos/britmanjerin/tst/contents/main_p.json';
			if (window.testRun) {
				url = 'https://api.github.com/repos/britmanjerin/tst/contents/main.json';
			}

			var that = this;
			$.ajax({
				type: 'GET',
				url: url,
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
					if (window.mainsha) {
						window.mainsha = "";
					}
					if (window.custsha) {
						window.custsha = "";
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
