/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/init.js ###################### */

/* Copyright (C) 2009-2013 beingmeta, inc.
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
    var inits=[];
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
        if (inits_run) fcn();
        else inits.push(fcn);
        if (name) init_names[name]=fcn;}
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
        while (i<lim) inits[i++]();
        inits_run=true;};

    var device_info=(fdjt.device)||(fdjt.device={});
    (function(){
        /* global window: false, navigator: false */
        if ((typeof window !=="undefined")&&(window.navigator)&&
            (window.navigator.appVersion)) {
            var navigator=window.navigator;
            device_info.isAndroid = (/android/gi).test(navigator.appVersion);
            device_info.isIDevice = (/iphone|ipad/gi).test(navigator.appVersion);
            device_info.isTouchPad = (/hp-tablet/gi).test(navigator.appVersion);
            device_info.hasTouch = ('ontouchstart' in window) &&
                (!(device_info.isTouchPad));}})();
})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
