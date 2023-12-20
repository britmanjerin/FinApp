sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/library"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast, mobileLibrary) {
	"use strict";
	FabFinV3.URLHelper = mobileLibrary.URLHelper;
	return BaseController.extend("FabFinV3.c.View2", {

		formatter: formatter,

		onInit: function() {

			window.custsha;
			this.rCount = 0;
			this.getView().setModel(new JSONModel({}), "refreshModel")
			this.getOwnerComponent().getRouter().getRoute("customer").attachPatternMatched(this._onObjectMatched, this);

			this.byId("idInstTab").addEventDelegate({
				onAfterRendering: function() {
					this.highlightRow();
				}
			}, this);

			//this.getMonthRange()
		},
		_onObjectMatched: function(evt) {

			if (window.testRun) {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust.json";
				this.imgurl = "https://api.github.com/repos/britmanjerin/tst/contents/Images/";
				this.byId("idStopTR").setVisible(true);
			} else {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust_p.json";
				this.imgurl = "https://api.github.com/repos/britmanjerin/tst/contents/Images_p/";
				this.byId("idStopTR").setVisible(false);
			}

			this.byId("idInstTab").addStyleClass("classColumnHide");

			if (!this.headers) {
				var aKey = this.validateCookie("aKey");

				if (!aKey) {
					this.onNavLP();
					return;
				}
				this.headers = {
					"Authorization": 'Bearer ' + aKey,
					"Accept": "application/vnd.github.v3+json",
					"Content-Type": "application/json"
				};
			}

			this.uModel = new JSONModel();
			this.getView().setModel(this.uModel, "uModel");
			this.setUModel();

			this.custId = evt.getParameter("arguments").custId;
			this.loadCustData(this.custId);
			window.imgsha = false;
			this.loadImgData(this.custId);
			this.oModel = new JSONModel();
			this.getView().setModel(this.oModel, "oModel");
			this.cModel = new JSONModel();
			this.getView().setModel(this.cModel, "cModel");
			this.getView().getModel("refreshModel").getData().r = false;

			this.iModel = new JSONModel({});
			this.getView().setModel(this.iModel, "iModel");

		},

		clickPhone: function(oEvent) {
			var status = this.byId("idObjStatus");
			var state = status.getState();
			var phNo = oEvent.getSource().getText();
			var that = this;

			var isSMS = (this.uModel.getData().adm || this.getView().getModel("config").getData().sms) ? true : false;

			if ((state == "Error" || state == "Warning") && isSMS) {
				var p = new sap.m.Popover({
					showHeader: false,
					placement: "Bottom",
					content: [
						new sap.m.CustomListItem({
							type: "Active",
							content: [new sap.m.Button({
								type: "Accept",
								icon: "sap-icon://call",
								text: "Call",
								press: triggerCall
							}).addStyleClass("sapUiTinyMarginTopBottom").addStyleClass("sapUiSmallMarginBeginEnd")]

						}),
						new sap.m.CustomListItem({
							type: "Active",
							content: [new sap.m.Button({
								type: "Ghost",
								icon: "sap-icon://message-popup",
								text: "SMS",
								press: triggerSMS
							}).addStyleClass("sapUiTinyMarginTopBottom").addStyleClass("sapUiSmallMarginBeginEnd")]

						})
					]
				});
				p.openBy(oEvent.getSource());
			} else {
				triggerCall();
			}

			function triggerCall() {
				FabFinV3.URLHelper.triggerTel(phNo);
			}

			function triggerSMS() {
				var dueDate = that.byId("idObjInstDate").getText().split(": ")[1];
				var due = that.byId("idAmtDue").getText().split(": ")[1];

				var bSp = sap.ui.Device.os.name == "iOS" ? "&" : "?";

				if (dueDate && due) {
					var aflg = that.getView().getModel("config").getData().iaSMS;
					due = aflg ? " of Rs." + due : "";
					var messageBody = "Dear " + that.cModel.getData().name + ",\n\n";
					if (state == "Error") {
						messageBody += "Your minimum due payment" + due +
							" was not received on " + dueDate +
							". As previously stated, starting from the following month, the interest rate will increase for each subsequent month.\n\nThanks,\nJJB Finance";
					} else {
						messageBody += 'You have a minimum payment' + due + " due on " + dueDate +
							". Please ensure that you make the payment before the due date to avoid incurring additional charges.\n\nThanks,\nJJB Finance";
					}
					//	console.log(messageBody)
					var smsUrl = 'sms:' + phNo + bSp + 'body=' + encodeURIComponent(messageBody);

					window.location.href = smsUrl;
				}

			}

		},

		clickEmail: function(oEvent) {
			FabFinV3.URLHelper.triggerEmail(oEvent.getSource().getText(), "Info Request", false, false, false, true);
		},

		clickIDNo: function(oEvent) {

			if (this.iModel.getData().id || this.iModel.getData().idf || this.iModel.getData().idb) {
				var p = new sap.m.Popover({
					showHeader: true,
					placement: "Bottom",
					content: [new sap.m.Image({
							src: this.iModel.getData().id,
							width: "100%",
							height: "100%"
						}),
						new sap.m.Image({
							src: this.iModel.getData().idf,
							width: "100%",
							height: "100%"
						}), new sap.m.Image({
							src: this.iModel.getData().idb,
							width: "100%",
							height: "100%"
						})
					],
					endButton: new sap.m.Button({
						type: "Transparent",
						icon: "sap-icon://decline",
						press: function() {
							p.close();
						}
					})
				});
				p.openBy(oEvent.getSource());
			}

		},

		setUModel: function() {
			var adm = this.validateCookie("user").substr(0, 1) === "A" ? true : false;
			this.uModel.setData({
				"adm": adm
			});
		},

		handleRefresh: function() {
			this.byId("idInstTab").addStyleClass("classColumnHide");
			setTimeout(function() {
				this.byId("pullToRefresh").hide();
				this.loadCustData(this.custId);
			}.bind(this), 10);
		},
		highlightRow: function() {
			if (FabFinV3.currRow) {

				var items = this.byId("idInstTab").getItems();
				items.forEach(function(e) {
					e.removeStyleClass("classHighlightGreen");
					e.removeStyleClass("classOpacity");
					e.removeStyleClass("classHideRow");
					if (FabFinV3.currRow == e.getId()) {
						e.addStyleClass("classHighlightGreen");
						try {
							//	$("#" + e.getId() + "-sub").css("background", "#ebffeb");
							$("#" + e.getId() + "-sub").attr('style', 'background: rgb(171 226 171 / 40%)!important');
						} catch (err) {}
					}

					if (FabFinV3.nxtRow.length > 0) {
						FabFinV3.nxtRow.forEach(function(el) {

							if (el == e.getId()) {
								e.addStyleClass("classOpacity");
								try {
									$("#" + e.getId() + "-sub").css("opacity", "0.3");
								} catch (err) {}
							}

						});
					}

					if (FabFinV3.hideRow.length > 0) {
						FabFinV3.hideRow.forEach(function(el) {

							if (el == e.getId()) {
								e.addStyleClass("classHideRow");
								try {
									$("#" + e.getId() + "-sub").css("display", "none");
								} catch (err) {}
							}

						});
					}

				});

			}
		},
		loadCustData: function(custId) {
			var config = {};
			if (!this.uModel.getData().adm) {
				if (!sap.ui.getCore().getModel("config")) {
					this.onNavBack();
					return;
				} else {
					config = sap.ui.getCore().getModel("config").getData();
				}
			} else {
				if (sap.ui.getCore().getModel("config")) {
					config = sap.ui.getCore().getModel("config").getData();
				}
			}

			this.getView().setModel(new JSONModel(config), "config");
			var rCount = 0;
			var that = this;
			sap.ui.core.BusyIndicator.show(0);
			$.ajax({
				type: 'GET',
				headers: this.headers,
				url: this.custurl,
				cache: false,
				success: function(odata) {
					if (!window.custsha) {
						window.custsha = odata.sha;
					} else {
						if (window.custsha != odata.sha) {

							if (that.rCount > 2) {
								window.location.reload();
							} else {
								that.rCount++;
								$.sap.delayedCall(3000, this, function() {
									that.loadCustData(custId);
								});

							}

							return;
						}

						that.rCount = 0;
					}

					var data = atob(odata.content);
					data = data.trim() ? JSON.parse(data) : [];

					that.oModel.setData(data);
					that.oModel.refresh();

					var eflag = true,
						lflag = true,
						cfAmt,
						AmtPaid;
					for (var i in data) {
						if (data[i].key === custId) {

							that.byId("idNotBtn").setVisible(false);
							if ((data[i].lnCls || data[i].lnRen) && (that.uModel.getData().adm || that.getView().getModel("config").getData().ls)) {
								that.calcSummary(data[i]);
							}

							that.cModel.setData(data[i]);
							that.calPayData();
							if ((that.uModel.getData().adm || that.getView().getModel("config").getData().not)) {
								var visNotBtn;

								try {
									if (data[i].notDet.length > 0) {
										visNotBtn = true;
									}
								} catch (err) {}

								visNotBtn = !visNotBtn ? that.formatter.setStatus_f(data[i], data[i].instDet).notVis : visNotBtn;

								if (visNotBtn) {
									if (!data[i].notDet) {
										data[i].notDet = [];
									}
									that.byId("idNotBtn").setVisible(true);
								}

							}

							that.cModel.refresh();
							break;
						}
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},

		calcSummary: function(data) {
			var totAmt = 0,
				intAmt = 0,
				defAmt = data.defAmt;
			data.payDet.forEach(function(e) {
				totAmt += Number(e.amt);
			});

			totAmt += Number(data.advAmt || 0);

			var lnAmt = Number(data.lnAmt);

			if (data.lnRen) {
				lnAmt = lnAmt - Number(data.trPra || data.lnAmt);
			}

			intAmt = totAmt - Number(lnAmt);

			intAmt = intAmt > 0 ? intAmt : 0;

			this.byId("idTotPaid").setText("Total Amount Paid: " + totAmt);
			this.byId("idIntEarn").setText("Profit: " + intAmt);
			this.byId("idDefAmt").setText("Waived off: " + defAmt);
		},

		calPayData: function() {

			var cModel = this.cModel.getData();

			/*	
				var roiArr = cModel.roiDet;
				var pwArr = cModel.pwDet;
				var data = cModel.payDet;
				data.sort((a, b) => {
					return new Date(a.payDate) - new Date(b.payDate);
				});

				var currRoi = Number(cModel.roi);
				var curDtObj = {};*/

			FabFinV3.currInst = 0;
			FabFinV3.currRow = "";
			FabFinV3.nxtRow = [];
			FabFinV3.hideRow = [];
			var that = this;

			var lnData = this.formatter.generateLoanData(cModel, true, this);

			cModel.instDet = lnData.arr;
			var currRoi = lnData.currRoi;
			var curDtObj = lnData.curDtObj;

			try {
				$.sap.delayedCall(100, this, function() {
					that.byId("idInstTab").rerender();
					that.byId("idInstTab").removeStyleClass("classColumnHide");
				});

				curDtObj.intTD = Math.round(curDtObj.prA * this.getNoOfDays(new Date(cModel.lnDt), new Date(new Date().toDateString())) *
					currRoi / 100 * 1 / 365);

				cModel.intTD = curDtObj;

			} catch (err) {}

		},

		onSelLC: function(oEvent, act) {
			var cData = this.cModel.getData();
			var payDate = sap.ui.getCore().byId("idPayDate").getValue() || new Date().toDateString();
			var lstPayDate;
			for (var i = cData.instDet.length - 1; i >= 0; i--) {
				if (cData.instDet[i].payDate) {
					lstPayDate = cData.instDet[i].payDate;
					break;
				}
			}

			if (lstPayDate > new Date(payDate)) {
				MessageBox.error("There is already a future date payment made on " + lstPayDate + ".");
				oEvent.getSource().setSelected(false);
				return;
			}

			act === "R" ? sap.ui.getCore().byId("idCB").setSelected(false) : sap.ui.getCore().byId("idCBR").setSelected(false);

			sap.ui.getCore().byId("idGAHB").setVisible(sap.ui.getCore().byId("idCB").getSelected());
			sap.ui.getCore().byId("idOthrAmtVB").setVisible(oEvent.getSource().getSelected());
			sap.ui.getCore().byId("idCBAP").setSelected(false);
			sap.ui.getCore().byId("idAPTxt").setText();
			sap.ui.getCore().byId("idAPBR").setSelected(false);
			sap.ui.getCore().byId("idAPBR").setVisible(false);
			sap.ui.getCore().byId("idAPVB").setVisible(!oEvent.getSource().getSelected());

			this.calAmtTD();

		},

		onSelAP: function(oEvent) {
			var cData = this.cModel.getData();
			var amt = Number(sap.ui.getCore().byId("idPayAmt").getValue());
			var payDate = sap.ui.getCore().byId("idPayDate").getValue() || new Date().toDateString();
			sap.ui.getCore().byId("idAPTxt").setText();
			sap.ui.getCore().byId("idAPBR").setSelected(false);
			sap.ui.getCore().byId("idAPBR").setVisible(false);
			if (amt > 0 && oEvent.getSource().getSelected()) {
				var curDtObj;
				for (var i = cData.instDet.length - 1; i >= 0; i--) {
					if (new Date(payDate) <= new Date(cData.instDet[i].fnPayDt) && new Date(payDate) >= new Date(cData.instDet[i].instStDt)) {
						curDtObj = cData.instDet[i];
						break;
					}
				}

				if (this.mobEvt) {
					sap.ui.getCore().byId("idAPTxt").setText("Rs. " + String(amt));
					sap.ui.getCore().byId("idAPBR").setVisible(true);
				} else {
					var intAmt = 0;
					var curIntdays = Math.ceil(Math.abs(new Date(payDate) - new Date(curDtObj.intFrm)) / (1000 * 60 * 60 * 24)) + 1;
					if (curIntdays > 15) {
						intAmt = curDtObj.int;
					} else {
						intAmt = ((curDtObj.int - curDtObj.cfInt) / 2);
						intAmt = intAmt + curDtObj.cfInt;
					}

					intAmt = Math.round(intAmt);

					if ((amt + curDtObj.amtPaid) > (intAmt)) {
						sap.ui.getCore().byId("idAPTxt").setText("Rs. " + String((amt + curDtObj.amtPaid) - intAmt));
						sap.ui.getCore().byId("idAPBR").setVisible(true);
					} else {
						oEvent.getSource().setSelected(false);
						sap.ui.getCore().byId("idAPBR").setVisible(false);
					}
				}

				/*if ((amt + curDtObj.amtPaid) > (curDtObj.int)) {
					sap.ui.getCore().byId("idAPTxt").setText("Rs. " + String((amt + curDtObj.amtPaid) - curDtObj.int));
				} else {
					oEvent.getSource().setSelected(false);
				}*/

			}
		},

		selPFA: function(oEvent) {
			sap.ui.getCore().byId("idPayAmt").setEditable(!oEvent.getSource().getSelected());
			sap.ui.getCore().byId("idLGrid").setVisible(!oEvent.getSource().getSelected());
			sap.ui.getCore().byId("idCB").setSelected(false);
			sap.ui.getCore().byId("idCBR").setSelected(false);
			sap.ui.getCore().byId("idCBAP").setSelected(false);
			sap.ui.getCore().byId("idAPVB").setVisible(false);
			sap.ui.getCore().byId("idOthrAmtVB").setVisible(false);

			sap.ui.getCore().byId("idPayAmt").setValue();
			if (oEvent.getSource().getSelected()) {

				var cData = this.cModel.getData();
				var payDate = sap.ui.getCore().byId("idPayDate").getValue() || new Date().toDateString();

				var curDtObj;
				for (var i = cData.instDet.length - 1; i >= 0; i--) {
					if (new Date(payDate) <= new Date(cData.instDet[i].fnPayDt) && new Date(payDate) >= new Date(cData.instDet[i].instStDt)) {
						curDtObj = cData.instDet[i];
						break;
					}
				}
				var txt = "";
				if (curDtObj.int > 0) {
					sap.ui.getCore().byId("idPayAmt").setValue(curDtObj.int < Number(sap.ui.getCore().byId("idAPamt").getText()) ? curDtObj.int :
						Number(sap.ui.getCore().byId("idAPamt").getText()));
				}
			}
		},

		calAmtTD: function(flg) {
			if (flg === '1') {
				sap.ui.getCore().byId("idOthrAmtVB").setVisible(false);
				sap.ui.getCore().byId("idCB").setSelected(false);
				sap.ui.getCore().byId("idCBR").setSelected(false);
			}

			if (sap.ui.getCore().byId("idNtve").getSelected()) {
				sap.ui.getCore().byId("idCB").setSelected(false);
				sap.ui.getCore().byId("idCBR").setSelected(false);
				sap.ui.getCore().byId("idOthrAmtVB").setVisible(false);
			}

			var cData = this.cModel.getData();
			var othrAmt = sap.ui.getCore().byId("idOthrAmt").getValue();
			var payDate = sap.ui.getCore().byId("idPayDate").getValue() || new Date().toDateString();
			var amtToPay;
			var curDtObj;
			for (var i = cData.instDet.length - 1; i >= 0; i--) {
				if (new Date(payDate) <= new Date(cData.instDet[i].fnPayDt) && new Date(payDate) >= new Date(cData.instDet[i].instStDt)) {
					curDtObj = cData.instDet[i];
					break;
				}
			}
			if (sap.ui.getCore().byId("idCB").getSelected()) {

				cData.intTD = curDtObj;
				//	var intCurMnth = curDtObj.int - curDtObj.cfInt;

				var curIntdays = Math.ceil(Math.abs(new Date(payDate) - curDtObj.intFrm) / (1000 * 60 * 60 * 24)) + 1;
				var intTD = 0;
				if (curIntdays > 15) {
					intTD = curDtObj.int;
				} else {
					/*intTD = Math.round(curDtObj.prA * this.getNoOfDays(new Date(curDtObj.intFrm), new Date(payDate)) *
						curDtObj.roi / 100 * 1 / 365);*/

					/*intTD = Math.round(curDtObj.prA * 15 * curDtObj.roi / 100 * 1 / 365);*/

					intTD = ((curDtObj.int - curDtObj.cfInt) / 2);

					intTD = intTD + curDtObj.cfInt;
				}

				amtToPay = ((curDtObj.prA - Number(sap.ui.getCore().byId("idAPamt").getText())) + Number(othrAmt) + intTD - curDtObj.amtPaid);
			} else if (sap.ui.getCore().byId("idCBR").getSelected()) {
				//	var lnEndDate = this.formatter.getLnEdDt(new Date(cData.lnDt),Number(cData.lnDur));
				if (!cData.instDet[Number(cData.lnDur) - 1] || Number(sap.ui.getCore().byId("idAPamt").getText()) > 0) {
					MessageBox.error("Loan renewal not possible");
					sap.ui.getCore().byId("idCBR").setSelected();
					sap.ui.getCore().byId("idOthrAmtVB").setVisible(false);

					return;
				}

				amtToPay = cData.instDet[Number(cData.lnDur) - 1].int - cData.instDet[Number(cData.lnDur) - 1].amtPaid;
				amtToPay = amtToPay < 0 ? 0 : amtToPay;
				amtToPay = amtToPay + Number(othrAmt);
			}

			sap.ui.getCore().byId("idTot").setText(Math.round(amtToPay));

			this.calcIntDet(curDtObj);

			if (sap.ui.getCore().byId("idCBAP").getSelected()) {
				sap.ui.getCore().byId("idCBAP").fireSelect();
			}

		},

		calcIntDet: function(obj) {
			sap.ui.getCore().byId("idIntDetVB").setVisible(false);
			sap.ui.getCore().byId("idRB").setSelectedIndex(0);
			if (!sap.ui.getCore().byId("idCBR").getSelected() && !sap.ui.getCore().byId("idCB").getSelected() && !sap.ui.getCore().byId(
					"idNtve").getSelected()) {
				var pAmt = sap.ui.getCore().byId("idPayAmt").getValue();
				//	var balAmt = (Number(obj.amtPaid) + Number(pAmt)) - Number(obj.int);
				var balAmt = 0;
				var int = obj.int < 0 ? 0 : obj.int;
				if (Number(pAmt) > 0) {
					if (Number(obj.amtPaid) > Number(int)) {
						balAmt = Number(pAmt);
					} else {
						balAmt = (Number(obj.amtPaid) + Number(pAmt)) - Number(int);
					}

					if (balAmt > 0) {
						sap.ui.getCore().byId("idIntDetVB").setVisible(true);
						sap.ui.getCore().byId("idIntDetTxt").setText("Total interest to be collected for period from " + this.formatter.dateFormat(obj.intFrm) +
							" to " + this.formatter.dateFormat(obj.intTo) + " is " + int +
							".\n\nKindly choose from below option to handle the balance amount " + balAmt + ".");
					}
				}
			}
		},

		onAddInst: function(oEvent) {
			if (this._iDialog) {
				this._iDialog.destroy();
			}
			this._iDialog = sap.ui.xmlfragment("FabFinV3.f.AddInst", this);
			this.getView().addDependent(this._iDialog);

			var cModel = this.cModel.getData();

			var apAmt = 0;
			var brflg;
			cModel.payDet.forEach(function(e) {
				apAmt += Number(e.apAmt || 0);
				if (e.brFlg && !e.rflg) {
					brflg = true;
				}
			});

			if (apAmt > 0) {
				sap.ui.getCore().byId("idAPamtHB").setVisible(true);
			}
			if (!brflg) {
				sap.ui.getCore().byId("idPFA").setVisible(true);
			}
			sap.ui.getCore().byId("idAPamt").setText(apAmt);

			var lnexp = this.formatter.setLnExpTxt(cModel.lnDt, cModel.lnDur, this);

			if (!lnexp) {
				sap.ui.getCore().byId("idLRVB").setVisible(false);
			}

			sap.ui.getCore().byId("idPayDate").setMinDate(new Date(cModel.lnDt));

			sap.ui.getCore().byId("idPayDate").setMaxDate(new Date());

			this._iDialog.open();

			if (window.testRun && this.uModel.getData().adm) {
				var c1, c2, that = this;
				var apid = document.getElementById("idAPLbl");
				apid.addEventListener("touchstart", handleTouchStart);
				apid.addEventListener("touchend", handleTouchEnd);

				function handleTouchStart(x) {
					x.preventDefault();
					c1 = Date.now();
				}

				function handleTouchEnd(y) {
					y.preventDefault();
					c2 = Date.now();
					if (c2 - c1 > 2000) {
						alert(c2 - c1);
						var payAmt = Number(sap.ui.getCore().byId("idPayAmt").getValue());
						if (payAmt > 0) {
							alert(payAmt);
							sap.ui.getCore().byId("idCBAP").setSelected(true);
							that.mobEvt = true;
							sap.ui.getCore().byId("idCBAP").fireSelect();
								alert("done");
							that.mobEvt = false;
						}
					}
				}
			}

		},

		onSubmit: function(oEvent) {

			var payDate = sap.ui.getCore().byId("idPayDate").getValue() || new Date().toDateString();
			var payAmt = sap.ui.getCore().byId("idPayAmt").getValue();
			var lnClsr = sap.ui.getCore().byId("idCB").getSelected();
			var lnRen = sap.ui.getCore().byId("idCBR").getSelected();
			var pfa = sap.ui.getCore().byId("idPFA").getSelected();
			var othrAmt = Number(sap.ui.getCore().byId("idOthrAmt").getValue());

			var isNeg = sap.ui.getCore().byId("idNtve").getSelected();

			if (Number(payAmt) < 0) {
				MessageBox.error("Amount cannot be negative");
				return;
			}

			payAmt = isNeg ? -Number(payAmt) : payAmt;

			var cData = this.cModel.getData();

			var lnexp = this.formatter.setLnExpTxt(cData.lnDt, cData.lnDur, this, payDate);

			if (lnexp && lnexp.indexOf("expired") >= 0) {
				if (!lnClsr && !lnRen) {
					MessageBox.error("Loan duration expired. Kindly choose Loan closure or Loan renewal to proceed.");
					return;
				}
			}

			if (sap.ui.getCore().byId("idIntDetVB").getVisible() && !sap.ui.getCore().byId("idAIP").getSelected() && !sap.ui.getCore().byId(
					"idPR").getSelected()) {

				MessageBox.error("Kindly choose from above option to handle the balance amount.");
				return;
			}

			if (lnClsr || lnRen) {

				var amtToPay = Number(sap.ui.getCore().byId("idTot").getText());

				if (Math.abs(amtToPay - Number(payAmt)) > 100) {
					MessageBox.error("Pending Amount to be collected is " + (amtToPay));
					return;
				}

				cData.defAmt = (amtToPay - Number(payAmt)) > 0 ? (amtToPay - Number(payAmt)) : 0;
				cData.clsDt = Date.now().toString();
				cData.lnCls = lnClsr ? "X" : "";
				cData.lnRen = lnRen ? "X" : "";
				cData.othrAmt = othrAmt;
				cData.goldAuctn = sap.ui.getCore().byId("idGA").getSelected() ? "X" : "";
				cData.notice = 0;
				cData.notDat = "";

				if (othrAmt < 0) {
					cData.defAmt += (-othrAmt);
				}

				if (Number(sap.ui.getCore().byId("idAPamt").getText()) > 0) {
					cData.advAmt = Number(sap.ui.getCore().byId("idAPamt").getText());
				}

			}

			var currInstObj, currInstCt;

			for (var i = 0; i < cData.instDet.length; i++) {
				if (new Date(payDate) <= new Date(cData.instDet[i].fnPayDt) && new Date(payDate) >= new Date(cData.instDet[i].instStDt)) {
					currInstObj = cData.instDet[i];
					currInstCt = i;
					break;
				}
			}

			if (!lnClsr) {

				if (Number(payAmt) < 0) {
					if ((-Number(payAmt)) > currInstObj.amtPaid) {
						MessageBox.error("Reversal amount greater than paid amount " + cData.instDet[i].amtPaid + ".");
						return;
					}
				}

			}
			if (sap.ui.getCore().byId("idCBAP").getSelected()) {

				if ((Number(sap.ui.getCore().byId("idAPamt").getText()) + Number(sap.ui.getCore().byId("idAPTxt").getText().split("Rs. ")[1])) >=
					Number(cData.lnAmt)) {

					MessageBox.error("You cannot pay amount more than " + cData.lnAmt + " as Advance payment.");
					return;

				}

			} else {
				if (sap.ui.getCore().byId("idIntDetVB").getVisible() && sap.ui.getCore().byId("idAIP").getSelected()) {

					var fInstAmt = 0;

					for (var k = cData.instDet.length - 1; k >= 0; k--) {
						if (cData.instDet[k].no == cData.lnDur) {
							fInstAmt = cData.instDet[k].int;
							break;
						}
					}

					if ((Number(payAmt)) > fInstAmt) {
						MessageBox.error("You cannot pay amount more than " + fInstAmt + " as interest payment.");
						return;
					}

				}
			}

			if (lnRen) {
				var copyData = $.extend(true, {}, cData);
				delete copyData.instDet;
				delete copyData.intTD;

				copyData.lnRen = copyData.clsDt = "";
				cData.renKey = copyData.crtDt = copyData.key = copyData.modDt = Date.now().toString();
				copyData.preKey = cData.key;
				copyData.payDet = [];
				copyData.roiDet = [copyData.roiDet[copyData.roiDet.length - 1]];
				copyData.roiDet[0].month = 1;
				copyData.roiDet[0].modDt = Date.now().toString();
				copyData.lnDt = this.formatter.dateFormat(this.formatter.getLnEdDt(new Date(cData.lnDt), Number(cData.lnDur), 0));
				copyData.othrAmt = copyData.defAmt = 0;
				copyData.lnAmt = cData.trPra = cData.instDet[cData.instDet.length - 1].prA;
				copyData.goldRt = copyData.lnAmt / Number(copyData.goldGms);

			}

			if (payDate && payAmt) {
				var apAmt = sap.ui.getCore().byId("idCBAP").getSelected() ? Number(sap.ui.getCore().byId("idAPTxt").getText().split("Rs. ")[1]) :
					0;
				cData.payDet.push({
					payDate: payDate,
					amt: pfa ? payAmt : payAmt - apAmt,
					othrAmt: othrAmt,
					lnClsr: lnClsr ? "X" : "",
					lnRen: lnRen ? "X" : "",
					crtDt: Date.now().toString(),
					xAmtOp: !sap.ui.getCore().byId("idIntDetVB").getVisible() ? "" : sap.ui.getCore().byId("idAIP").getSelected() ? "1" : "2",
					apAmt: pfa ? -payAmt : apAmt,
					brFlg: sap.ui.getCore().byId("idAPBR").getSelected() ? "X" : ""
				});

				cData.modDt = Date.now().toString();
				delete cData.instDet;
				delete cData.intTD
				var oData = this.oModel.getData();

				for (var j in oData) {
					if (oData[j].key === cData.key) {
						oData.splice(j, 1, cData);
						break;
					}
				}

				if (lnRen) {
					oData.push(copyData);
				}

				this.updateFile(oData);
				this.onCl();

			}
		},

		showAPInfo: function(oEvent, val) {

			new sap.m.Popover({
				showHeader: false,
				placement: "Bottom",
				content: [
					new sap.m.Text({
						text: val
					}).addStyleClass("sapUiSmallMargin")
				]
			}).openBy(oEvent.getSource());

		},

		onRevPay: function(key) {
			var that = this;
			sap.m.MessageBox.confirm(
				"Are you sure want to reverse payment?", {
					actions: ["Cancel", "Confirm"],
					onClose: function(sAction) {
						if (sAction === "Confirm") {
							rev();
						}
					}
				}
			);

			function rev() {
				var cData = that.cModel.getData(),
					rObj;
				for (var i in cData.payDet) {
					if (cData.payDet[i].crtDt == key) {
						cData.payDet[i].rflg = "X";
						rObj = $.extend(true, {}, cData.payDet[i]);
						break;
					}
				}
				cData.modDt = rObj.crtDt = Date.now().toString();
				rObj.amt = -rObj.amt;
				rObj.apAmt = -rObj.apAmt;
				rObj.rflg = "X";
				cData.payDet.push(rObj);
				delete cData.instDet;
				delete cData.intTD
				var oData = that.oModel.getData();
				for (var j in oData) {
					if (oData[j].key === cData.key) {
						oData.splice(j, 1, cData);
						break;
					}
				}
				that.updateFile(oData);
				that.onCl();
			}

		},

		onUpdateInt: function() {
			if (this._itDialog) {
				this._itDialog.destroy();
			}
			this._itDialog = sap.ui.xmlfragment("FabFinV3.f.intRate", this);
			this.getView().addDependent(this._itDialog);
			this._itDialog.setModel(new JSONModel($.extend(true, [], this.cModel.getData().roiDet)), "iDialogModel");
			this._itDialog.open();
		},

		onAddROI: function() {
			var month = Math.round(sap.ui.getCore().byId("idMnInp").getValue());
			var roi = sap.ui.getCore().byId("idRoiInp").getValue();

			if (month && roi) {
				var model = this._itDialog.getModel("iDialogModel").getData();
				var nwObj = {
					month: month,
					roi: roi,
					modDt: Date.now().toString()
				};
				for (var i = 0; i < model.length; i++) {
					if (model[i].month == month) {
						model.splice(i, 1, nwObj);
						break;
					}
				}
				if (i == model.length) {
					model.push(nwObj);
				}

				model.sort((a, b) => {
					return a.month - b.month;
				});

				this._itDialog.getModel("iDialogModel").refresh();
			}

		},

		cUpdateInt: function() {

			var cData = this.cModel.getData();

			cData.roiDet = this._itDialog.getModel("iDialogModel").getData();
			cData.modDt = Date.now().toString();
			delete cData.instDet;
			delete cData.intTD
			var oData = this.oModel.getData();

			for (var j in oData) {
				if (oData[j].key === cData.key) {
					oData.splice(j, 1, cData);
					break;
				}
			}

			this.updateFile(oData);

			this.onClose();

		},

		onDelIntMonth: function(oEvent) {

			this._itDialog.getModel("iDialogModel").getData().splice(oEvent.getSource().getBindingContext("iDialogModel").getPath().split(
					"/")[
					1],
				1);
			this._itDialog.getModel("iDialogModel").refresh();
		},

		onShowHistory: function(oEvent) {

			if (this._hDialog) {
				this._hDialog.destroy();
			}
			this._hDialog = sap.ui.xmlfragment("FabFinV3.f.payHistory", this);
			this.getView().addDependent(this._hDialog);
			this._hDialog.bindElement("cModel>" + oEvent.getSource().getBindingContext("cModel").getPath());

			this._hDialog.open();
		},

		onUpdateNot: function(oEvent) {

			if (this._nDialog) {
				this._nDialog.destroy();
			}
			this._nDialog = sap.ui.xmlfragment("FabFinV3.f.Notice", this);
			this.getView().addDependent(this._nDialog);

			var dat = [],
				obj;

			var cModel = this.cModel.getData();

			var model = $.extend(true, [], cModel.notDet);

			if (!cModel.notice) {
				sap.ui.getCore().byId("idRecalBtn").setVisible(false);
			}

			if (!this.formatter.setStatus_f(cModel, cModel.instDet).notVis) {
				sap.ui.getCore().byId("idsendNotBtn").setVisible(false);
			}

			if (!sap.ui.getCore().byId("idsendNotBtn").getVisible() && !sap.ui.getCore().byId("idRecalBtn").getVisible()) {
				sap.ui.getCore().byId("idNotDate").setVisible(false);
			}

			for (var i in model) {
				obj = {};
				model[i].no = model[i].recall ? "X" : model[i].no;
				switch (String(model[i].no)) {
					case "1":
						obj.tit = "1st Notice Sent";
						obj.stat = "Low";
						obj.dat = model[i].date;
						break;
					case "2":
						obj.tit = "2nd Notice Sent";
						obj.stat = "Low";
						obj.dat = model[i].date;
						break;
					case "3":
						obj.tit = "3rd Notice Sent";
						obj.stat = "Low";
						obj.dat = model[i].date;
						break;
					case "X":
						obj.tit = "Recalled";
						obj.stat = "High";
						obj.dat = model[i].date;
						break;
					default:
						obj.tit = model[i].no + "th Notice Sent";
						obj.stat = "Low";
						obj.dat = model[i].date;
				}

				dat.push(obj);
			}

			this._nDialog.setModel(new JSONModel(dat), "nDialogModel");

			this._nDialog.open();
		},
		cUpdateNot: function(flag) {

			var notDate = sap.ui.getCore().byId("idNotDate").getValue() || new Date().toDateString();

			if (notDate) {
				var cData = this.cModel.getData();

				cData.notDet.push({
					no: cData.notice ? Number(cData.notice) + 1 : 1,
					date: notDate,
					recall: flag == "R" ? "X" : "",
					modDt: Date.now().toString()
				});

				cData.notice = cData.notice ? Number(cData.notice) + 1 : 1;
				cData.notDat = notDate;
				cData.notice = flag == "R" ? 0 : cData.notice;
				cData.notDat = flag == "R" ? "" : cData.notDat;

				cData.modDt = Date.now().toString();
				delete cData.instDet;
				delete cData.intTD
				var oData = this.oModel.getData();

				for (var j in oData) {
					if (oData[j].key === cData.key) {
						oData.splice(j, 1, cData);
						break;
					}
				}

				this.updateFile(oData);
				this.onCl();

			}
		},

		onCl: function() {
			if (this._iDialog) {
				this._iDialog.destroy();
			}
			if (this._hDialog) {
				this._hDialog.destroy();
			}
			if (this._nDialog) {
				this._nDialog.destroy();
			}
		},
		onClose: function() {
			if (this._itDialog) {
				this._itDialog.destroy();
			}
			if (this._oDialog) {
				this._oDialog.destroy();
			}

		},

		getNoOfDays: function(sDate, eDate) {
			return Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
		},

		getMonthRange: function(date) {
			date = new Date("Dec 31,2023");
			var day = date.getDate();
			var year = date.getFullYear();
			var month = date.getMonth() + 1;
			//	var nxtMonth = month+1;
			var obj, arr = [];
			for (var i = 0; i < 24; i++) {
				month = month % 12;
				year = !(month) ? year + 1 : year;
				obj = {
					sDt: date,
					eDt: new Date(year, month, day)
				};

				if (month != obj.eDt.getMonth()) {
					obj.eDt = new Date(year, obj.eDt.getMonth(), 0);
				}
				date = obj.eDt;
				obj.eDt = new Date(obj.eDt.getTime() - (1 * 24 * 60 * 60 * 1000));

				arr.push(obj);

				date = new Date(obj.eDt.getTime() + (1 * 24 * 60 * 60 * 1000));
				month += 1;

			}
			return arr;
		},

		onEditCust: function() {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
			this._oDialog = sap.ui.xmlfragment("idcf", "FabFinV3.f.AddCust", this);
			this.getView().addDependent(this._oDialog);
			this._oDialog.setModel(new JSONModel($.extend(true, {}, this.cModel.getData())), "oDialogModel");
			sap.ui.getCore().byId("idcf--idLnDt").setMaxDate(new Date());
			sap.ui.getCore().byId("idcf--idAddBtn").setText("Update");
			sap.ui.getCore().byId("idcf--idInstDet").setVisible(false);
			sap.ui.getCore().byId("idcf--idelVB").setVisible(true);

			this._oDialog.open();
		},

		onAddGoldItems: function(oEvent) {

			var gArr = this.formatter.fillGArr();
			var cArr = this._oDialog.getModel("oDialogModel").getData().gDet;
			try {

				for (var i in gArr) {
					for (var j in cArr) {
						if (gArr[i].name == cArr[j].name) {
							gArr[i].value = cArr[j].value;
							gArr[i].flg = cArr[j].flg ? true : false;
							break;
						}
					}
				}

			} catch (err) {}

			this._oDialog.getModel("oDialogModel").getData().gDet = gArr;

			if (this._gDialog) {
				this._gDialog.destroy();
			}
			this._gDialog = sap.ui.xmlfragment("FabFinV3.f.GoldDetail", this);
			this._oDialog.addDependent(this._gDialog);
			this._gDialog.openBy(oEvent.getSource());
		},

		showGoldDetails: function(oEvent) {
			if (this._gDialog) {
				this._gDialog.destroy();
			}
			this._gDialog = sap.ui.xmlfragment("FabFinV3.f.GoldDetail", this);

			var data = $.extend(true, {}, this.cModel.getData());
			data.gDet.forEach(function(e) {
				e.edit = true;
				e.flg = e.flg ? true : false;
			});

			this._gDialog.setModel(new JSONModel(data), "oDialogModel");
			this._gDialog.openBy(oEvent.getSource());
		},

		cAddCust: function() {

			var nwData = this._oDialog.getModel("oDialogModel").getData();

			if (!nwData.name.trim() || !nwData.id.trim() || !nwData.mob.trim() || Number(nwData.goldGms) <= 0 || Number(nwData.lnAmt) <= 0) {
				MessageBox.error("Please fill all the required fields");
				return;
			}

			for (var i = nwData.gDet.length - 1; i >= 0; i--) {
				nwData.gDet[i].flg = nwData.gDet[i].flg ? "X" : "";
				if (Number(nwData.gDet[i].value) == 0) {
					nwData.gDet.splice(i, 1);
				}
			}

			nwData.goldRt = Number(nwData.goldRt).toFixed(3);

			var cData = nwData;

			cData.modDt = Date.now().toString();

			delete cData.instDet;
			delete cData.intTD;

			var oData = this.oModel.getData();

			for (var j in oData) {
				if (oData[j].key === cData.key) {
					oData.splice(j, 1, cData);
					break;
				}
			}

			this.updateFile(oData, null, 1);

			this.onClose();

		},
		resizeImage: function(img, q) {

			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');

			// Set the maximum width and height for the compressed image
			var maxWidth = 800;
			var maxHeight = 600;

			// Calculate the new dimensions to maintain the aspect ratio
			var width = img.width;
			var height = img.height;

			if (width > maxWidth) {
				height *= maxWidth / width;
				width = maxWidth;
			}

			if (height > maxHeight) {
				width *= maxHeight / height;
				height = maxHeight;
			}

			canvas.width = width;
			canvas.height = height;

			// Draw the image on the canvas with the new dimensions
			ctx.drawImage(img, 0, 0, width, height);

			// Convert the canvas content back to a data URL
			return canvas.toDataURL('image/jpeg', q); // Adjust the quality (0.7 = 70%)

		},

		handleUpload: function(oEvent, key, read) {

			var files = oEvent.getParameter("files")
			var that = this;
			if (files) {
				for (var i = 0, f; f = files[i]; i++) {
					var r = new FileReader();
					r.onload = (
						$.proxy(
							function(f) {
								return $.proxy(
									function(e) {
										var img = new Image();
										img.src = e.target.result;
										img.onload = function() {
											if (!read) {
												that.iModel.getData()[key] = that.formatter.resizeImage(img, 0.7);
											} else {
												that.openCImgFrag(that.formatter.resizeImage(img, 1), ("idcf--" + key));
											}
										}

									}, this);
							}, this)
					)(f);
					r.readAsDataURL(f);
				}
			}

			/*
						var files = oEvent.getParameter("files")
						var that = this;
						if (files) {
							for (var i = 0, f; f = files[i]; i++) {
								var r = new FileReader();
								r.onload = (
									$.proxy(
										function(f) {
											return $.proxy(
												function(e) {

													var contents = e.target.result;

													var img = new Image();
													img.src = contents;
													img.onload = function() {

														if (!read) {

															var compressedDataURL = that.resizeImage(img, 0.7);
															var compressedDataURL = canvas.toDataURL('image/jpeg', 0.7);

															that.iModel.getData()[key] = compressedDataURL;
														} else {
															sap.ui.core.BusyIndicator.show(0);
															sap.ui.getCore().byId("idcf--" + key).setValue();
															var compressedDataURL = that.resizeImage(img, 1);
															(async() => {
																try {
																	var worker = await Tesseract.createWorker({
																		logger: m => console.log(m)
																	});
																	await worker.loadLanguage('eng');
																	await worker.initialize('eng');
																
																	await worker.setParameters({
																		tessedit_unrej_any_wd: true
																	});

																	var {
																		data: {
																			text
																		}
																	} = await worker.recognize(compressedDataURL);
																	sap.ui.getCore().byId("idcf--" + key).setValue(text);
																	sap.ui.core.BusyIndicator.hide();
																	await worker.terminate();
																} catch (err) {
																	sap.ui.core.BusyIndicator.hide();
																	MessageBox.error("Read failed");
																}

															})();
														}

													}

												}, this);
										}, this)
								)(f);
								r.readAsDataURL(f);
							}
						}*/

		},

		openCImgFrag: function(src, key) {

			if (this._cImgDialog) {
				this._cImgDialog.destroy();
			}

			this._cImgDialog = sap.ui.xmlfragment("idic", "FabFinV3.f.cropImg", this);
			this.getView().addDependent(this._cImgDialog);
			this._cImgDialog.imgSrc = src;
			this._cImgDialog.inpKey = key;
			this._cImgDialog.open();

		},

		afCrpImg: function() {

			var imageToCrop = document.getElementById('idic--imageToCrop');
			imageToCrop.src = this._cImgDialog.imgSrc;
			this._cImgDialog.cropper = new Cropper(imageToCrop, {
				viewMode: 2,
				crop(event) {}
			});
		},
		onReadTxt: function(oEvent) {
			this.formatter.readText(this._cImgDialog.cropper.getCroppedCanvas().toDataURL(), this._cImgDialog.inpKey);
			this.onCloseIC();

		},
		onCloseIC: function() {
			if (this._cImgDialog) {
				this._cImgDialog.destroy();
			}
		},

		loadImgData: function(key) {
			var that = this;
			var url = this.imgurl + key + ".json";

			$.ajax({
				type: 'GET',
				headers: this.headers,
				url: url,
				cache: false,
				success: function(odata) {
					window.imgsha = odata.sha;
					that.iModel.setData(JSON.parse(atob(odata.content)));
					that.iModel.refresh();
				},
				error: function(odata) {}
			});

		},

		handleImage: function(key) {
			var iModel = this.iModel.getData();
			var that = this;
			if (iModel.dp || iModel.id || iModel.idf || iModel.idb) {

				var url = this.imgurl + key + ".json"
				var body = {
					message: "Creating file",
					content: btoa(JSON.stringify(iModel))
				};

				if (window.imgsha) {
					body.sha = window.imgsha;
					body.message = "Updating file";
				}

				$.ajax({
					type: 'PUT',
					url: url,
					headers: this.headers,
					data: JSON.stringify(body),
					dataType: 'text',
					success: function(odata) {
						window.imgsha = JSON.parse(odata).content.sha;
						that.iModel.refresh();
					},
					error: function(odata) {
						MessageBox.error("Image upload failed");
					}
				});
			}

		},

		calculateEMI: function(e) {
			var data = this._oDialog.getModel("oDialogModel").getData();
			if (e === "G") {
				if (Number(data.goldRt) > 0 && Number(data.goldGms) > 0) {
					data.lnAmt = Number(data.goldRt) * Number(data.goldGms);
				}
			} else if (e === "A") {
				if (Number(data.lnAmt) > 0 && Number(data.goldGms) > 0) {
					data.goldRt = Number(data.lnAmt) / Number(data.goldGms);
				}
			}

			this._oDialog.getModel("oDialogModel").refresh();

		},

		onPressCustDel: function() {
			sap.m.MessageBox.confirm(
				"Are you sure want to delete?", {
					actions: ["Cancel", "Confirm"],
					onClose: function(sAction) {
						if (sAction === "Confirm") {
							delCust();
						}
					}
				}
			);
			var that = this;

			function delCust() {

				var cData = that.cModel.getData();

				var oData = that.oModel.getData();

				for (var j in oData) {
					if (oData[j].key === cData.key) {
						oData.splice(j, 1);
						break;
					}
				}

				that.updateFile(oData, 1);
				that.onClose();

			}
		},

		updateFile: function(oData, del, img) {
			var key = this.cModel.getData().key;
			var that = this;
			var data = JSON.stringify(oData);

			var body = {
				message: "Updating file",
				content: btoa(data),
				sha: window.custsha
			};
			var url = this.custurl;
			sap.ui.core.BusyIndicator.show(0);
			this.byId("idInstTab").addStyleClass("classColumnHide");
			$.ajax({
				type: 'PUT',
				url: url,
				headers: that.headers,
				data: JSON.stringify(body),
				dataType: 'text',
				success: function(odata) {
					window.custsha = JSON.parse(odata).content.sha;
					sap.ui.core.BusyIndicator.hide();
					if (del) {
						MessageToast.show("Deleted Successfully.")
						that.onNavBack();
					} else {
						if (img) {
							that.handleImage(key);
						}
						that.loadCustData(key);
						MessageBox.success("Updated Successfully.")
					}

				},
				error: function(odata) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Failed.")
				}
			});
		},

		onTestRun: function(evt) {
			window.testRun = false;
			window.mainsha = null;
			window.custsha = null;
			window.expsha = null;
			this.onNavBack();
		},

		/*	onNavBack: function() {
				this.getOwnerComponent().getRouter().navTo("home");
			},*/
		onNavLP: function(obj) {
			this.getOwnerComponent().getRouter().navTo("login");
		}

	});
});
