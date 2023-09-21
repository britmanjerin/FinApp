sap.ui.define([],function(){"use strict";return{getExpInstDate:function(t){return new Date(new Date(t).getTime()).toDateString()},dateFormat:function(t){return(t=t.toDateString().split(" "))[1]+" "+t[2]+","+t[3]},fillGArr:function(){var e=[];return["Anklet","Bangle","Bracelet","Chain","Ear Ring","Necklace","Ring","Other"].forEach(function(t){e.push({name:t,value:""})}),e},setStatus_h:function(t){if(t){var e=t,n=sap.ui.getCore().byId(this._sOwnerId+"---home").getController().formatter;t=n.generateLoanData(t,!1,this).arr;t=n.setStatus_f(e,t);return this.getParent().getSecondStatus().setState(t.status),this.getParent().getAttributes()[1].setText(t.instDateText),t.statusText}},setStatus_f:function(t,e){var n={},a=new Date((new Date).toDateString());if(t.lnCls||t.lnRen)n.status=t.lnRen?"Information":"Success",n.statusText=t.lnRen?"Loan Renewed":"Loan Closed";else if(e){for(var r,i,s,D=0,o=0,u=0,d=e.length-1;0<=d;d--)if(new Date(a)<=new Date(e[d].fnPayDt)&&new Date(a)>=new Date(e[d].instStDt)&&(i=e[o=d]),u+=e[d].amtPaid,e[d].int-u<=0){for(var g=0,l=d+1;l<e.length;l++)g+=e[l].amtPaid;for(l=d+1;l<e.length;l++)if(g<e[l].int){D=l;break}break}r=e[D];var h="Total Amount Due: 0",m=0;i&&(i.no>t.lnDur?(h="Total Amount Due: "+(m=e[Number(t.lnDur)-1].bPrA)+"+",s=!0):h="Total Amount Due: "+(m=0<i.int-i.amtPaid?i.int-i.amtPaid:0)),n.amtDue=h,0<m&&new Date(i.instDt)<=a&&(n.instDateState="Error");var w,f,c=r;a>=r.instDt&&(1<=(w=o-D)?(h=Math.ceil(Math.abs(new Date(r.instDt)-a)/864e5),n.status="Error",new Date(r.instDt)<=a&&(n.instDateState="Error"),f="",f=!s||r.instDt<a?"Due on: "+this.dateFormat(r.instDt):"Due on: "+this.dateFormat(e[Number(t.lnDur)-1].instDt),n.instDateText=f,1==w&&0<r.amtPaid&&r.int-r.amtPaid<r.int-r.cfInt&&(n.statusText="Partially Overdue by "+h+" days"),1<w&&(n.notVis=!0),n.statusText=n.statusText||"Overdue by "+h+" days"):c=e[w]),0<m&&(new Date(c.instDt)<=a&&(n.instDateState="Error"),f="",!s||c.instDt<a?f="Due on: "+this.dateFormat(c.instDt):(f="Due on: "+this.dateFormat(e[Number(t.lnDur)-1].instDt),n.instDateState="Error"),n.instDateText=f,new Date(new Date(c.instDt).getTime()-432e6)<=a&&a<=new Date(c.instDt)&&(c=Math.ceil(Math.abs(new Date(c.instDt)-a)/864e5),n.status="Warning",n.statusText=0==c?"Payment pending today":"Payment pending in "+c+" days"))}return n},setStatus_c:function(t,e){var n=this;if(["idObjInstDate","idObjStatus","idAmtDue"].forEach(function(t){n.byId(t).setState("None"),n.byId(t).setText("")}),e){e=this.formatter.setStatus_f(t,e);return this.byId("idObjStatus").setState(e.status),this.byId("idAmtDue").setText(e.amtDue),this.byId("idObjInstDate").setState(e.instDateState),this.byId("idObjInstDate").setText(e.instDateText),e.statusText}},setStatus:function(t,e,n,a,r,i,s,D,o,u){var d=new Date((new Date).toDateString());if(t&&!u)return this.setState("Success"),"Loan Closed";if(n&&a&&r){if(d>new Date(r))return!!u||(this.setState("Error"),"Overdue by 3+ months");if(d>new Date(a))return!!u||(this.setState("Error"),"Overdue by 2+ months");if(d>new Date(n)&&!u)return this.setState("Error"),o?"Partially Overdue by 1+ months":"Overdue by 1+ months"}return new Date(new Date(e).getTime()-432e6)<=d&&d<=new Date(e)&&!u?(this.setState("Warning"),"Payment pending"):void 0},setNotStatus:function(t,e){if(t&&e)switch(String(t)){case"1":return"1st Notice Sent on "+e;case"2":return"2nd Notice Sent on "+e;case"3":return"3rd Notice Sent on "+e;default:return String(t)+"th Notice Sent on "+e}},highlightRow:function(t,e,n){if(t)return FabFinV3.currInst&&(FabFinV3.currInst==t?FabFinV3.currRow=this.getParent().getId():t>FabFinV3.currInst&&FabFinV3.nxtRow.push(this.getParent().getId()),e<t&&FabFinV3.hideRow.push(this.getParent().getId())),t},setNxtInstDate:function(t){return t&&(this.setState("None"),new Date(t)<=new Date((new Date).toDateString())&&this.setState("Error")),"Due on: "+t},setAmtDue:function(t,e){var n;if(t&&e){new Date(e)<=new Date((new Date).toDateString())&&(n=1);try{for(var a in t)if(n){if(t[a].instDt>=new Date((new Date).toDateString())&&0<t[a].int-t[a].amtPaid)return"Total Amount Due: "+(t[a].int-t[a].amtPaid)}else if(new Date(e).toDateString()==t[a].instDt.toDateString()&&0<t[a].int-t[a].amtPaid)return"Total Amount Due: "+(t[a].int-t[a].amtPaid)}catch(t){}}},generateLoanData:function(t,e,n){var a=t.roiDet,r=t.pwDet,i=t.payDet,s=t.lnDt;i.sort((t,e)=>new Date(t.payDate)-new Date(e.payDate));var D,o,u,d,g,l=Number(t.roi),h={},m=[],w=(new Date).toDateString(),f=1e3,c=Number(t.lnAmt),b=c,S=0,y=new Date(s),P=new Date(s),p=y.getDate(),F=y.getFullYear(),v=y.getMonth()+1;new Date(w)<new Date(s)&&(f=t.lnDur);var I,T=(y.getMonth()+1)%12,M=(y.getMonth()+1)%12?y.getFullYear():y.getFullYear()+1,x=new Date(s).getDate(),A=1;for(N in r)if(y.getDate()>=r[N].frm&&y.getDate()<=r[N].to){T=(y.getMonth()+r[N].mc)%12,x=r[N].dt,A=r[N].mc;break}I=new Date(M,T,x),(y.getMonth()+A)%12!=I.getMonth()&&(I=new Date((y.getMonth()+A)%12?y.getFullYear():y.getFullYear()+1,I.getMonth(),0));for(var N=1;N<=f;N++){for(var E in a)if(a[E].month==N){o=Number(a[E].roi)/12/100,u=Number(a[E].roi);break}(D={no:N,prA:c=b,int:Math.round(Number(c)*o+S),lPay:0,payDate:"",amtPaid:0,hist:[],roi:u}).cfInt=S,F=(v%=12)?F:F+1,v!=(C={sDt:y,eDt:new Date(F,v,p)}).eDt.getMonth()&&(C.eDt=new Date(F,C.eDt.getMonth(),0)),C.eDt=new Date(C.eDt.getTime()-864e5),y=new Date(C.eDt.getTime()+864e5),v+=1,D.intFrm=C.sDt.toDateString(),D.intTo=C.eDt.toDateString(),D.fnPayDt=C.eDt.toDateString(),D.instDt=I,D.fnPayDt=(I>=C.eDt?I:C.eDt).toDateString(),I=new Date((I.getMonth()+1)%12?I.getFullYear():I.getFullYear()+1,(I.getMonth()+1)%12,x),(D.instDt.getMonth()+1)%12!=I.getMonth()&&(I=new Date((D.instDt.getMonth()+1)%12?D.instDt.getFullYear():D.instDt.getFullYear()+1,I.getMonth(),0)),D.instStDt=P.toDateString();var O,C,L=0,R=0,V=!1,Y=0;for(O in i)new Date(i[O].payDate)<=new Date(D.fnPayDt)&&new Date(i[O].payDate)>=new Date(D.instStDt)&&(D.amtPaid+=Number(i[O].amt),D.payDate=(0<Number(i[O].amt)?i[O]:D).payDate,D.hist.push(i[O]),d=!(!i[O].lnClsr&&!i[O].lnRen),g=!!i[O].lnRen,D.amtPaid>D.int?(Y=V?Number(i[O].amt):(V=!0,D.amtPaid-(D.int<0?0:D.int)),"2"==i[O].xAmtOp?L+=Y:R+=Y):(L=R=0,V=!1));if(P=new Date(new Date(D.fnPayDt).getTime()+864e5),b-=L,S=0,D.amtPaid<D.int?S=D.int-D.amtPaid:0<R&&(S=-R),D.int<0&&(S+=D.int),D.bPrA=b,new Date(w)<=new Date(D.intTo)&&new Date(w)>=new Date(D.intFrm)&&(f=N+12,l=u,h=D,e&&(FabFinV3.currInst=D.no)),D.intFrm=new Date(D.intFrm),D.intTo=new Date(D.intTo),D.payDate=D.payDate?new Date(D.payDate):"",D.fnPayDt=new Date(D.fnPayDt),D.instStDt=new Date(D.instStDt),d&&(C=Number(t.lnAmt),g&&(C-=Number(t.trPra||t.lnAmt)),D.int=Number(D.amtPaid)-Number(C),D.int=0<D.int?D.int:0,D.bPrA=0,D.cfInt=0,e&&(FabFinV3.currInst=0)),e&&(n.getView().getModel("refreshModel").getData().r=D.no,n.getView().getModel("refreshModel").refresh()),m.push(D),d)break}return{arr:m,currRoi:l,curDtObj:h}},setLnExpTxt:function(t,e,n,a){if(n||(this.removeStyleClass("classLnExpAttr"),this.removeStyleClass("classLnExpPdAttr")),t&&e){var r=(n||(sap.ui.getCore().byId(this._sOwnerId+"---home")?sap.ui.getCore().byId(this._sOwnerId+"---home"):sap.ui.getCore().byId(this._sOwnerId+"---cust")).getController()).formatter,t=r.getLnEdDt(new Date(t),Number(e),1),e=a?new Date(a):new Date((new Date).toDateString()),a=Math.ceil(Math.abs(e-t)/864e5);return t<e?(n||this.addStyleClass("classLnExpAttr"),"Loan duration expired on "+r.dateFormat(t)):a<=30?(n||this.addStyleClass("classLnExpPdAttr"),0===a?"Loan duration expires today":"Loan duration expires in "+a+" days"):void 0}},getLnEdDt:function(t,e,n){e=e||12;var a=new Date(t.valueOf());return a.setMonth(a.getMonth()+e),a.getDate()!=t.getDate()&&(a=new Date(a.getFullYear(),a.getMonth(),0)),a.setDate(a.getDate()-n),a},downloadFile:function(t,e){var n=document.createElement("a");n.setAttribute("href",t),n.setAttribute("download",e+".json"),document.body.appendChild(n),n.click(),n.remove()}}});
