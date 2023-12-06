sap.ui.define([
	"FabFinV3/c/BaseController",
	"sap/ui/model/json/JSONModel",
	"FabFinV3/u/formatter",
	"sap/m/MessageBox",
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
], function(BaseController, JSONModel, formatter, MessageBox, ChartFormatter, Format) {
	"use strict";

	return BaseController.extend("FabFinV3.c.db", {
		formatter: formatter,
		onInit: function() {
			this.rCount1 = 0;
			this.rCount2 = 0;
			this.dModel = new JSONModel();
			this.lModel = new JSONModel();
			this.getView().setModel(this.dModel, "dModel");
			this.getView().setModel(this.lModel, "lModel");
			this.getOwnerComponent().getRouter().getRoute("db").attachPatternMatched(this._onObjectMatched, this);

		},
		_onObjectMatched: function(evt) {
			if (window.testRun) {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust.json";
				this.expurl = "https://api.github.com/repos/britmanjerin/tst/contents/exp.json";
				this.byId("idStopTR").setVisible(true);
			} else {
				this.custurl = "https://api.github.com/repos/britmanjerin/tst/contents/cust_p.json";
				this.expurl = "https://api.github.com/repos/britmanjerin/tst/contents/exp_p.json";
				this.byId("idStopTR").setVisible(false);
			}
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
			this.dbd = {};
			this.loadData();
		},
		loadData: function() {

			var that = this;
			var i = $.Deferred();
			var j = $.Deferred();
			sap.ui.core.BusyIndicator.show(0);
			var cData = [],
				eData = [];
			$.ajax({
				type: 'GET',
				url: this.custurl,
				headers: this.headers,
				cache: false,
				success: function(odata) {

					if (!window.custsha) {
						window.custsha = odata.sha;
					} else {

						if (window.custsha != odata.sha) {

							if (that.rCount1 > 2) {
								window.location.reload();
							} else {
								that.rCount1++;
								$.sap.delayedCall(3000, this, function() {
									that.loadCustData();
								});
							}

							return;
						}
						that.rCount1 = 0;

					}
					cData = atob(odata.content);
					cData = cData.trim() ? JSON.parse(cData) : [];
					i.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					i.resolve();
				}
			});
			$.ajax({
				type: 'GET',
				url: this.expurl,
				headers: this.headers,
				cache: false,
				success: function(odata) {

					if (!window.expsha) {
						window.expsha = odata.sha;
					} else {
						if (window.expsha != odata.sha) {

							if (that.rCount2 > 2) {
								window.location.reload();
							} else {
								that.rCount2++
									$.sap.delayedCall(3000, this, function() {
										that.loadCustData();
									});
							}

							return;
						}

						that.rCount2 = 0;
					}

					eData = atob(odata.content);
					eData = eData.trim() ? JSON.parse(eData) : [];
					j.resolve();
				},
				error: function(oError) {
					MessageBox.error(oError.responseJSON.message);
					j.resolve();
				}
			});

			$.when(i, j).done(function() {
				sap.ui.core.BusyIndicator.hide();
				that.dbData(cData, eData);
				var a = [];
				Object.keys(that.dbd).forEach(function(e) {
					a.push({
						key: e,
						text: e.toUpperCase()
					});
				});
				that.lModel.setData(a);
				that.setdbModel("ytd");
			});

		},

		onChangeDB: function(oEvent) {
			this.setdbModel(oEvent.getSource().getSelectedKey());
		},

		setdbModel: function(key) {
			key = this.dbd[key];
			var obj = {};
			obj.rev = ((key.amtp + key.adAmtf) - key.clam);
			obj.exp = key.exp;
			obj.mgn = obj.rev ? ((obj.rev - obj.exp) / obj.rev) * 100 : 0;
			obj.def = key.amtd
			obj.mgnVal = Math.abs(obj.mgn);
			obj.color = obj.mgn > 0 ? "Good" : "Error";
			obj.expDB = [], obj.lnAmtDB = [], obj.accDB = [], obj.sumDB = [];

			fil(obj.accDB, "Active", key.acc - (key.cls + key.ren));
			key.cls ? key.ga ? fil(obj.accDB, "Closed", (key.cls - key.ga)) : fil(obj.accDB, "Closed", key.cls) : null;
			key.ga ? fil(obj.accDB, "Auctioned", (key.ga)) : null;
			key.ren ? fil(obj.accDB, "Renewed", (key.ren)) : null;

			//	fil(obj.lnAmtDB, "Pending", (key.lamt - key.clam - key.ram));
			//	fil(obj.lnAmtDB, "Repayment", (key.clam));
			//	(key.amtp - key.clam) > 0 ? fil(obj.lnAmtDB, "Interest", (key.amtp - key.clam)) : null;

			//new 

			fil(obj.lnAmtDB, "Pending", (key.lamt - key.clam - key.ram - key.adAmt));
			fil(obj.lnAmtDB, "Repayment", (key.clam + key.adAmt));

			//new

			var tObj = {};
			(key.expa || []).forEach(function(e) {
				tObj[e.typ] ? tObj[e.typ] += Number(e.amt) : tObj[e.typ] = Number(e.amt);
			});
			Object.keys(tObj).forEach(function(e) {
				for (var i in FabFinV3.ExpType) {
					if (FabFinV3.ExpType[i].key == e) {
						fil(obj.expDB, FabFinV3.ExpType[i].text, (tObj[e]));
						break;
					}
				}
			});
			key.m.forEach(function(e) {
				tObj = {};
				tObj.dim = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "MMM yyyy"
				}).format(e.id);
				tObj.rev = ((e.amtp + e.adAmtf) - e.clam);
				tObj.exp = e.exp;
				tObj.mgn = tObj.rev ? ((tObj.rev - tObj.exp) / tObj.rev) * 100 : 0;
				tObj.mgn = Math.round(tObj.mgn > 100 ? 100 : tObj.mgn < -100 ? -100 : tObj.mgn);
				obj.sumDB.push(tObj);
			});

			obj.accTit = key.acc;
			obj.lamtTit = key.lamt;
			obj.expTit = key.exp;

			this.dModel.setData(obj);
			this.setVizProp(this.byId("idAccVF"), ["#6bbd6b", "#e36968", "#ffa556", "#629fcb"], true);
			this.setVizProp(this.byId("idAmtVF"), ["#00a64c", "#d4c44e"]);
			this.setVizProp(this.byId("idExpVF"), ["#95dd91", "#ba90dc", "#ffc186", "#ddd990", "#d95e01", "#6bbd6b", "#e36968", "#ffa556",
				"#629fcb", "#b8a1e7"
			]);
			this.setSumVizProp(this.byId("idSumVF"), "Summary");

			function fil(arr, d, m) {
				arr.push({
					"mes": m,
					"dim": d
				})
			}
		},

		setSumVizProp: function(vf, tit) {
			Format.numericFormatter(ChartFormatter.getInstance());
			var formatPattern = ChartFormatter.DefaultPattern;
			vf.setVizProperties({
				plotArea: {
					dataLabel: {
						type: "value",
						visible: true,
						formatString: formatPattern.SHORTFLOAT_MFD2,
						renderer: function(val) {
							val.text = val['info'].key === "Margin" ? val.text + "%" : "Rs." + val.text;
						}
					},
					dataShape: {
						primaryAxis: ["bar", "bar", "line"]
					},
					drawingEffect: "glossy",
					primaryValuesColorPalette: ["#008f91", "#e57872"],
					secondaryValuesColorPalette: ["#1e90ff"]
				},
				title: {
					text: tit,
					visible: false
				},
				valueAxis: {
					title: {
						visible: false
					},
					label: {
						visible: false
					}
				},
				valueAxis2: {
					title: {
						visible: false
					},
					label: {
						visible: false
					}
				},
				categoryAxis: {
					title: {
						visible: false
					},
					label: {
						rotation: "fixed",
						angle: "0"
					},
					labelRenderer: function(val) {}
				},
				legend: {
					visible: true
				},
				legendGroup: {
					layout: {
						alignment: "center",
						position: "bottom"
					}
				}
			});

			var oPopOver = this.getView().byId("idPopOver");
			oPopOver.connect(vf.getVizUid());
			oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);
		},

		setVizProp: function(vf, clr, nf) {
			Format.numericFormatter(ChartFormatter.getInstance());
			var formatPattern = ChartFormatter.DefaultPattern;
			vf.setVizProperties({
				plotArea: {
					dataLabel: {
						type: "value",
						visible: true,
						formatString: formatPattern.SHORTFLOAT_MFD2,
						renderer: function(val) {
							val.text = nf ? val.text : "Rs. " + val.text;
						}
					},
					drawingEffect: "glossy",
					colorPalette: clr
				},
				title: {
					visible: false
				},
				valueAxis: {
					title: {
						visible: true
					},
					label: {
						visible: true
					}
				},
				categoryAxis: {
					title: {
						visible: true
					},
					labelRenderer: function(val) {}
				},
				legend: {
					visible: true
				},
				legendGroup: {
					layout: {
						alignment: "center",
						position: "right",
						width: "100px"
					}
				}
			});

			var oPopOver = this.getView().byId("idPopOver");
			oPopOver.connect(vf.getVizUid());
			oPopOver.setFormatString(ChartFormatter.DefaultPattern.STANDARDFLOAT);

		},

		dbData: function(cd, ed) {

			ed.sort((a, b) => {
				return new Date(a.dat) - new Date(b.dat);
			});
			cd.sort((a, b) => {
				return new Date(a.lnDt) - new Date(b.lnDt);
			});

			var fy = FabFinV3.fy;

			var iy, ey;

			if (new Date().getMonth() < fy) {
				iy = ey = new Date().getFullYear() - 1;
			} else {
				iy = ey = new Date().getFullYear();
			}
			var ctr1;
			try {
				ctr1 = new Date(ed[0].dat).getMonth() < fy ? 1 : 0;
				iy = (new Date(ed[0].dat).getFullYear() - ctr1) < iy ? (new Date(ed[0].dat).getFullYear() - ctr1) : iy;
				ctr1 = new Date(ed[ed.length - 1].dat).getMonth() < fy ? 1 : 0;
				ey = new Date(ed[ed.length - 1].dat).getFullYear() - ctr1 > ey ? new Date(ed[ed.length - 1].dat).getFullYear() - ctr1 : ey;
			} catch (err) {}
			try {
				ctr1 = new Date(cd[0].lnDt).getMonth() < fy ? 1 : 0;
				iy = (new Date(cd[0].lnDt).getFullYear() - ctr1) < iy ? (new Date(cd[0].lnDt).getFullYear() - ctr1) : iy;
				cd.sort((a, b) => {
					return new Date(b.modDt) - new Date(a.modDt);
				});
				ctr1 = new Date(cd[cd.length - 1].modDt).getMonth() < fy ? 1 : 0;
				ey = new Date(cd[cd.length - 1].modDt).getFullYear() - ctr1 > ey ? new Date(cd[cd.length - 1].modDt).getFullYear() - ctr1 : ey;
			} catch (err) {}
			var ytd = {};
			af(ytd);
			ytd["acc"] = cd.length;
			ytd["expa"] = ed
			var oy = {},
				io, vArr, ky, lac;
			for (var i = iy; i <= ey; i++) {
				io = fy > 0 ? (String(i) + "-" + String(i + 1)) : i, lac = {};
				oy[io] = {
					y: io,
					m: sm(i)
				}
				af(oy[io]);
				oy[io]["m"].forEach(function(e, z) {
					af(e);
					ed.forEach(function(el) {
						if (new Date(el.dat) >= e.id && new Date(el.dat) <= e.ed) {
							ky = "exp", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.amt, el, e, oy[io], null, ky);
						}
					});
					cd.forEach(function(el) {
						if ((oy[io]["m"][oy[io]["m"].length - 1].ed >= new Date(el.lnDt) && oy[io]["m"][0].id <= new Date(el.clsDt ? new Date(Number(
								el.clsDt)).toDateString() : "12 31 9999"))) {
							lac[el.key] = Number(el.lnAmt);
						}
						if (new Date(el.lnDt) >= e.id && new Date(el.lnDt) <= e.ed) {
							ky = "nwa", [oy[io][ky], e[ky]] = fv([oy[io][ky], e[ky]], 1, el, e, oy[io], null, ky);
							ky = "lamt", [ytd[ky]] = fv([ytd[ky]], el.lnAmt);
						}
						if (el.clsDt && (new Date(new Date(Number(el.clsDt)).toDateString()) >= e.id && new Date(new Date(Number(el.clsDt)).toDateString()) <=
								e.ed)) {
							ky = el.lnCls ? "cls" : "ren", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], 1, el, e, oy[io], ytd, ky);
							ky = el.lnCls ? "clam" : "ram", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.lnAmt);
							ky = el.goldAuctn ? "ga" : "", ky ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], 1, el, e, oy[io], ytd,
									ky) :
								null;
							ky = "amtd", Number(el.defAmt) > 0 ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], el.defAmt, el, e, oy[
								io], null, ky) : null;
							ky = "adAmtf", Number(el.advAmt) > 0 ? [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], (el.advAmt || 0), el,
								e, oy[
									io], null, ky) : null;
						}
						el.payDet.forEach(function(ele) {
							if (new Date(ele.payDate) >= e.id && new Date(ele.payDate) <= e.ed) {
								ky = "amtp", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], ele.amt);
								//new
								if (Number(ele.apAmt || 0) > 0 && !ele.rflg && !el.lnCls) {
									ky = "adAmt", [ytd[ky], oy[io][ky], e[ky]] = fv([ytd[ky], oy[io][ky], e[ky]], (ele.apAmt || 0));
								}
								//new
							}
						});
					});
					if (new Date(new Date().toDateString()) >= e.id && new Date(new Date().toDateString()) <= e.ed) {
						ky = "m";
						for (z; z >= 0; z--) {
							ytd[ky] ? ytd[ky].push(oy[io][ky][z]) : ytd[ky] = [oy[io][ky][z]];
						}
						try {
							z = 11;
							while (ytd[ky].length < 12 && oy[Object.keys(oy)[Object.keys(oy).indexOf(String(io)) - 1]]) {
								ytd[ky].push(oy[Object.keys(oy)[Object.keys(oy).indexOf(String(io)) - 1]][ky][z]), z--;
							}
						} catch (err) {}
					}

				});
				oy[io]["m"].reverse();

				Object.keys(lac).forEach(function(e) {
					oy[io]["acc"]++, oy[io]["lamt"] += lac[e];
				});

			}

			oy["ytd"] = ytd;
			this.dbd = oy;

			function sm(yr) {
				var a = [],
					o,
					f = fy;
				for (var j = 0; j < 12; j++) {
					o = {
						m: new Date(yr, f).getMonth(),
						id: new Date(yr, f, 1),
						ed: new Date(yr, f + 1, 0)
					}
					a.push(o);
					f = (f + 1) % 12, yr = !f ? yr + 1 : yr;
				}
				return a;
			}

			function af(x) {
				return [x.exp, x.acc, x.lamt, x.amtp, x.nwa, x.ga, x.cls, x.ren, x.clam, x.ram, x.amtd, x.adAmt, x.adAmtf] = Array(15).fill(0);
			}

			function fv(a, m, so, mo, yo, ytd, k) {
				vArr = [];
				a.forEach(function(ele) {
					vArr.push(ele += Number(m));
				});
				k && mo ? mo[k + "a"] ? mo[k + "a"].push(so) : mo[k + "a"] = [so] : null;
				k && yo ? yo[k + "a"] ? yo[k + "a"].push(so) : yo[k + "a"] = [so] : null;
				k && ytd ? ytd[k + "a"] ? ytd[k + "a"].push(so) : ytd[k + "a"] = [so] : null;
				return vArr;
			}

		},

		onSelectVF: function(oEvent) {
			var status = oEvent.getParameter('data')[0].data.Status;
		},

		onNavLP: function(obj) {
			this.getOwnerComponent().getRouter().navTo("login");
		},
		onTestRun: function(evt) {
			window.testRun = false;
			window.expsha = null;
			window.mainsha = null;
			window.custsha = null;
			this.onNavBack();
		}

	});
});
