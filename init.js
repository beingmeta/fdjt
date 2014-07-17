/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/init.js ###################### */

/* Copyright (C) 2009-2014 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
   of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

//var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

(function(){
    "use strict";
    var fdjtLog=fdjt.Log;
    var inits_run=false;
    var inits=[], run=[];
    var init_names={};

    function addInit(fcn,name,runagain){
        var replace=((name)&&(init_names[name]));
        var i=0, lim=inits.length;
        while (i<lim) {
            if ((replace)&&(inits[i]===replace)) {
                if (inits_run) {
                    fdjtLog.warn(
                        "Replacing init %s which has already run",name);
                    if (runagain) {
                        fdjtLog.warn("Running the new version");
                        inits[i]=fcn; init_names[name]=fcn; fcn();
                        return;}}
                else {
                    inits[i]=fcn; init_names[name]=fcn;
                    return;}}
            else if (inits[i]===fcn) return;
            else i++;}
        if (name) init_names[name]=fcn;
        inits.push(fcn);
        if (inits_run) {
            fcn(); run.push(true);}
        else run.push(false);}
    fdjt.addInit=addInit;
    
    fdjt.Init=function fdjtInit(){
        var names=[];
        if (inits_run) return false;
        for (var name in init_names)
            if (init_names.hasOwnProperty(name)) names.push(name);
        if (names.length===0)
            fdjtLog("Running %d DOM inits",inits.length);
        else if (names.length===inits.length)
            fdjtLog("Running %d DOM inits (%s)",
                    inits.length,names.join());
        else fdjtLog("Running %d DOM inits (including %s)",
                     inits.length,names.join());
        var i=0; var lim=inits.length;
        while (i<lim)
            if (run[i]) i++; else inits[i++]();
        inits_run=true;};

    var numpat=/^\d+(\.\d+)$/;
    function getMatch(string,rx,i,literal){
        var match=rx.exec(string);
        if (typeof i === "undefined") i=0;
        if ((match)&&(match.length>i)) {
            if (literal) return match[i];
            else if (numpat.test(match[i]))
                return parseFloat(match[i]);
            else return match[i];}
        else return false;}
    
    var spacechars="\n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff";

    function stdspace(string){
        string=string.replace(/\s+/g," ");
        var start=0; var len=string.length; 
        if (len<=0) return string;
        while ((start<len)&&
               (spacechars.indexOf(string.charAt(start))>-1))
            start++;
        if (start===len) return "";
        var end=len-1;
        while ((end>start)&&(spacechars.indexOf(string.charAt(end))>-1))
            end--;
        if ((start>0)||(end<len)) return string.slice(start,end+1);
        else return string;}
    
    var device=(fdjt.device)||(fdjt.device={});
        /* Setting up media info */
    function identifyDevice(){
        if ((fdjt.device)&&(fdjt.device.started)) return;
        var navigator=window.navigator;
        var appversion=navigator.userAgent;
        
        var isAndroid = getMatch(appversion,/\bAndroid +(\d+\.\d+)\b/g,1);
        var isWebKit = getMatch(appversion,/\bAppleWebKit\/(\d+\.\d+)\b/g,1);
        var isGecko = getMatch(appversion,/\bGecko\/(\d+)\b/gi,1,true);
        var isChrome = getMatch(appversion,/\bChrome\/(\d+\.\d+)\b/g,1);
        var isFirefox = getMatch(appversion,/\bFirefox\/(\d+\.\d+)\b/gi,1);
        var isSafari = getMatch(appversion,/\bSafari\/(\d+\.\d+)\b/gi,1);
        var isOSX = getMatch(appversion,/\bMac OS X \/(\d+\_\d+)\b/gi,1,true);
        var isMobileSafari = (isSafari)&&(getMatch(appversion,/\bMobile\/(\w+)\b/gi,1,true));
        var isMobileWebKit = (isWebKit)&&(getMatch(appversion,/\bMobile\/(\w+)\b/gi,1,true));
        var isMobile = (getMatch(appversion,/\bMobile\/(\w+)\b/gi,1,true));
        var hasVersion = getMatch(appversion,/\bVersion\/(\d+\.\d+)\b/gi,1);
        
        var isUbuntu = (/ubuntu/gi).test(appversion);
        var isRedHat = (/redhat/gi).test(appversion);
        var isLinux = (/linux/gi).test(appversion);
        var isMacintosh = (/Macintosh/gi).test(appversion);
        
        var isTouchPad = (/Touchpad/gi).test(appversion);
        var iPhone = (/iphone/gi).test(appversion);
        var iPad = (/ipad/gi).test(appversion);
        var isTouch = iPhone || iPad || isAndroid || isTouchPad;
        var isIOS=((iPhone)||(iPad))&&
            ((getMatch(appversion,/\bVersion\/(\d+\.\d+)\b/gi,1))||(true));
        
        var opt_string=stdspace(
            ((isAndroid)?(" Android/"+isAndroid):(""))+
                ((isWebKit)?(" WebKit/"+isWebKit):(""))+
                ((isGecko)?(" Gecko/"+isGecko):(""))+
                ((isChrome)?(" Chrome/"+isChrome):(""))+
                ((isFirefox)?(" Firefox/"+isFirefox):(""))+
                ((isSafari)?(" Safari/"+isSafari):(""))+
                ((isMobileSafari)?(" MobileSafari/"+isMobileSafari):(""))+
                ((isMobileWebKit)?(" MobileWebKit/"+isMobileWebKit):(""))+
                ((isIOS)?(" IOS/"+isIOS):(""))+
                ((isOSX)?(" OSX/"+isOSX):(""))+
                ((navigator.platform)?(" "+navigator.platform):(""))+
                ((iPhone)?(" iPhone"):(""))+
                ((iPad)?(" iPad"):(""))+
                ((isTouchPad)?(" TouchPad"):(""))+
                ((isTouch)?(" touch"):(" mouse")));
        if (navigator.vendor) device.vendor=navigator.vendor;
        if (navigator.platform) device.platform=navigator.platform;
        if (navigator.oscpu) device.oscpu=navigator.oscpu;
        if (navigator.cookieEnabled) device.cookies=navigator.cookies;
        if (navigator.doNotTrack) device.notrack=navigator.doNotTrack;
        if (navigator.standalone) device.standalone=navigator.standalone;
        device.string=opt_string;
        if (isAndroid) device.android=isAndroid;
        if (isIOS) {
            device.ios=isIOS;
            if (iPhone) device.iphone=isIOS;
            if (iPad) device.ipad=isIOS;}
        if (isChrome) device.chrome=isChrome;
        if (iPad) device.iPad=true;
        if (iPhone) device.iPhone=true;
        if (isIOS) device.ios=true;
        if (isOSX) device.osx=true;
        if (isWebKit) device.webkit=isWebKit;
        if (isSafari) device.safari=isSafari;
        if (isMobileSafari) device.mobilesafari=isMobileSafari;
        if (isMobileWebKit) device.mobilewebkit=isMobileWebKit;
        if (isMobile) device.mobile=isMobile;
        if (hasVersion) device.version=hasVersion;
        if (isMacintosh) device.isMacintosh=true;
        if (isUbuntu) device.ubuntu=true;
        if (isRedHat) device.redhat=true;
        if (isLinux) device.linux=true;
        if (isTouch) device.touch=true;
        fdjtLog("Device: %j",device);}
    
    (function(){
        /* global window: false */
        if ((typeof window !=="undefined")&&(window.navigator)&&
            (window.navigator.appVersion))
            identifyDevice();})();
})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
