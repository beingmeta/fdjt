/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/init.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
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
        if (!(checkInit(fcn,name))) return;
        var replace=((name)&&(init_names[name]));
        var i=0, lim=inits.length;
        while (i<lim) {
            if (((replace)&&(inits[i]===replace))||(inits[i]===fcn)) {
                if (inits_run) {
                    fdjtLog.warn(
                        "Replacing init %s which has already run",name);
                    if (runagain) {
                        fdjtLog.warn("Running the new version");
                        inits[i]=fcn; 
                        if (name) init_names[name]=fcn;
                        fcn();
                        return;}
                    else return;}
                else {
                    inits[i]=fcn; 
                    if (name) init_names[name]=fcn;
                    return;}}
            else i++;}
        if (name) init_names[name]=fcn;
        inits.push(fcn);
        if (inits_run) {
            fcn(); run.push(true);}
        else run.push(false);}
    fdjt.addInit=addInit;
    
    function checkInit(fcn,name){
        if ((!(fcn))||(!(fcn.call))) {
            fdjtLog.warn("Bad argument to addInit(): %s",
                        name||"anonymous",fcn);
            return false;}
        else return true;}
    
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
        while (i<lim) {
            if (run[i]) i++; 
            else {
                run[i]=true; 
                inits[i]();
                i++;}}
        inits_run=true;};

    function getMatch(string,rx,i){
        var match=rx.exec(string);
        if (typeof i === "undefined") i=0;
        if ((match)&&(match.length>i)) return match[i];
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
    
    var vnum_pat=/^(\d+(\.\d+)).*/;
    function getVersionNum(s){
        if (typeof s === "number") return s;
        else if (typeof s === "string") {
            if (s.indexOf('_')) s=s.replace(/_/g,'.');
            if (/^\d+\.?$/.exec(s)) {}
            else if (vnum_pat.exec(s))
                s=vnum_pat.exec(s)[1];
            else return s;
            try { return parseFloat(s)||s; }
            catch (ex) { return s;}}
        else return s;}

    var device=(fdjt.device)||(fdjt.device={});
        /* Setting up media info */
    function identifyDevice(){
        if ((fdjt.device)&&(fdjt.device.started)) return;
        var navigator=window.navigator;
        var ua=navigator.userAgent;
        
        var isAndroid = getMatch(ua,/\bAndroid +(\d+\.\d+)\b/g,1);
        var isWebKit = getMatch(ua,/\bAppleWebKit\/(\d+\.\d+)\b/g,1);
        var isGecko = getMatch(ua,/\bGecko\/(\d+)\b/gi,1,true);
        var isChrome = getMatch(ua,/\bChrome\/(\d+\.\d+(.\d+)*)\b/g,1);
        var isFirefox = getMatch(ua,/\bFirefox\/(\d+\.\d+(.\d+)*)\b/gi,1);
        var isSafari = getMatch(ua,/\bSafari\/(\d+\.\d+(.\d+)*)\b/gi,1);
        var isOSX = getMatch(ua,/\bMac OS X \/(\d+\_\d+)\b/gi,1,true);
        var isMobileSafari = (isSafari)&&(getMatch(ua,/\bMobile\/(\w+)\b/gi,1,true));
        var isMobileWebKit = (isWebKit)&&(getMatch(ua,/\bMobile\/(\w+)\b/gi,1,true));
        var isMobile = (getMatch(ua,/\bMobile\/(\w+)\b/gi,1,true));
        var hasVersion = getMatch(ua,/\bVersion\/(\d+\.\d+)\b/gi,1);
        var os_version = getMatch(ua,/\bOS (\d+_\d+(_\d)*)\b/gi,1);
        
        var isUbuntu = (/ubuntu/gi).test(ua);
        var isRedHat = (/redhat/gi).test(ua);
        var isLinux = (/linux/gi).test(ua);
        var isMacintosh = (/Macintosh/gi).test(ua);
        
        var isTouchPad = (/Touchpad/gi).test(ua);
        var iPhone = (/iphone/gi).test(ua);
        var iPad = (/ipad/gi).test(ua);
        var isTouch = iPhone || iPad || isAndroid || isTouchPad;
        var isIOS=((iPhone)||(iPad))&&
            ((getMatch(ua,/\bVersion\/(\d+\.\d+)\b/gi,1))||(true));
        
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
        if (navigator.cookieEnabled) device.cookies=navigator.cookieEnabled;
        if (navigator.doNotTrack) device.notrack=navigator.doNotTrack;
        if (navigator.standalone) device.standalone=navigator.standalone;
        device.string=opt_string;
        if (isAndroid) {
            device.android=getVersionNum(isAndroid);
            device.android_version=isAndroid;}
        if (isIOS) {
            device.ios=getVersionNum(os_version)||isIOS;
            device.ios_version=isIOS;
            if (iPhone) device.iphone=isIOS;
            if (iPad) device.ipad=isIOS;}
        if (isChrome) {
            device.chrome_version=isChrome;
            device.chrome=getVersionNum(isChrome);}
        if (iPad) device.iPad=true;
        if (iPhone) device.iPhone=true;
        if (isOSX) {
            device.osx=getVersionNum(isOSX);
            device.osx_version=isOSX;}
        if (isWebKit) {
            device.webkit=getVersionNum(isWebKit);
            device.webkit_version=isWebKit;}
        if (isSafari) {
            device.safari=getVersionNum(isSafari);
            device.safari_version=isSafari;}
        if (isMobileSafari) {
            device.mobilesafari_version=isMobileSafari;
            device.mobilesafari=getVersionNum(isMobileSafari);}
        if (isMobileWebKit) {
            device.mobilewebkit_version=isMobileWebKit;
            device.mobilewebkit=getVersionNum(isMobileWebKit);}
        if (isMobile) device.mobile=isMobile;
        if (hasVersion) device.version=hasVersion;
        if (isMacintosh) device.isMacintosh=true;
        if (isUbuntu) device.ubuntu=true;
        if (isRedHat) device.redhat=true;
        if (isLinux) device.linux=true;
        if (isTouch) device.touch=true;
        else device.mouse=true;
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
