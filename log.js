/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2011 beingmeta, inc.
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

var fdjtLog=(function(){
    var backlog=[];

    function fdjtLog(string){
	var output=false;
	if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
	    output=fdjtString.apply(null,arguments);
	if (fdjtLog.console_fn) {
	    if (output) fdjtLog.console_fn.call(fdjtLog.console,output);
	    else fdjtLog.console_fn.apply(fdjtLog.console,arguments);}
	if (fdjtLog.console) {
	    var domconsole=fdjtLog.console;
	    var timespan=fdjtDOM("span.time",fdjtET());
	    var entry=fdjtDOM("div.fdjtlog");
	    if (output) entry.innerHTML=output;
	    else entry.innerHTML=fdjtString.apply(null,arguments);
	    fdjtDOM.prepend(entry,timespan);
	    if (typeof domconsole === 'string') {
		var found=document.getElementById(domconsole);
		if (found) {
		    domconsole=fdjtLog.console=found;
		    var i=0; var lim=backlog.length;
		    while (i<lim) fdjtDOM(domconsole,backlog[i++]);
		    backlog=[];}
		else domconsole=false;}
	    else if (!(domconsole.nodeType)) domconsole=false;
	    if (domconsole)
		fdjtDOM.append(domconsole,entry);
	    else backlog.push(entry);}
	if ((fdjtLog.useconsole)||
	    ((!(fdjtLog.console))&&(!(fdjtLog.console_fn))))
	    if ((window.console) && (window.console.log) &&
		(window.console.count)) {
		if (output)
		    window.console.log.call(
			window.console,"["+fdjtET()+"s] "+output);
		else {
		    var newargs=new Array(arguments.length+1);
		    newargs[0]="[%fs] "+string;
		    newargs[1]=fdjtET();
		    var i=1; var lim=arguments.length;
		    while (i<lim) {newargs[i+1]=arguments[i]; i++;}
		    window.console.log.apply(window.console,newargs);}}}
    fdjtLog.console=null;
    fdjtLog.id="$Id$";
    fdjtLog.version=parseInt("$Revision$".slice(10,-1));

    fdjtLog.warn=function(string){
	if ((!(fdjtLog.console_fn))&&
	    (!(window.console)&&(window.console.log)&&(window.console.log.count))) {
	    var output=fdjtString.apply(null,arguments);
	    alert(output);}
	else fdjtLog.apply(null,arguments);};

    fdjtLog.uhoh=function(string){
	if (fdjtLog.debugging) fdjtLog.warn.call(this,arguments);}

    fdjtLog.bkpt=function(string){
	var output=false;
	if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
	    output=fdjtString.apply(null,arguments);
	if (fdjtLog.console_fn)
	    if (output) fdjtLog.console_fn(fdjtLog.console,output);
	else fdjtLog.console_fn.apply(fdjtLog.console,arguments);
	else if ((window.console) && (window.console.log) &&
		 (window.console.count))
	    if (output)
		window.console.log.call(window.console,output);
	else window.console.log.apply(window.console,arguments);
    };

    fdjtLog.useconsole=true;

    return fdjtLog;})();

// This is for temporary trace statements; we use a different name
//  so that they're easy to find.
var fdjtTrace=fdjtLog;

/**
 * HumaneJS
 * Humanized Messages for Notifications
 * @author Marc Harter (@wavded)
 * @contributers
 *   Alexander (@bga_)
 *   Jose (@joseanpg)
 * @example
 *  humane('hello world');
 */
;(function(win,doc){
    var eventOn, eventOff;
    if (win.addEventListener) {
       eventOn = function(obj,type,fn){obj.addEventListener(type,fn,false)};
       eventOff = function(obj,type,fn){obj.removeEventListener(type,fn,false)};
    } else {
       eventOn = function(obj,type,fn){obj.attachEvent('on'+type,fn)};
       eventOff = function(obj,type,fn){obj.detachEvent('on'+type,fn)};
    }

    var eventing = false,
        animationInProgress = false,
        humaneEl = null,
        timeout = null,
        useFilter = /msie [678]/i.test(navigator.userAgent), // ua sniff for filter support
        isSetup = false,
        queue = [];

    eventOn(win,'load',function(){
        var transitionSupported = (function(style){
            var prefixes = ['MozT','WebkitT','OT','msT','KhtmlT','t'];
            for(var i = 0, prefix; prefix = prefixes[i]; i++){
                if(prefix+'ransition' in style) return true;
            }
            return false;
        }(doc.body.style));

        if(!transitionSupported) animate = jsAnimateOpacity; // override animate
        setup();
        run();
    });

    function setup() {
        humaneEl = doc.createElement('div');
        humaneEl.id = 'humane';
        humaneEl.className = 'humane';
        doc.body.appendChild(humaneEl);
        if(useFilter) humaneEl.filters.item('DXImageTransform.Microsoft.Alpha').Opacity = 0; // reset value so hover states work
        isSetup = true;
    }

    function remove() {
        eventOff(doc.body,'mousemove',remove);
        eventOff(doc.body,'click',remove);
        eventOff(doc.body,'keypress',remove);
        eventOff(doc.body,'touchstart',remove);
        eventing = false;
        if(animationInProgress) animate(0);
    }

    function run() {
        if(animationInProgress && !fdjtLog.notify.forceNew) return;
        if(!queue.length){
            remove();
            return;
        }

        animationInProgress = true;

        if(timeout){
            clearTimeout(timeout);
            timeout = null;
        }

        timeout = setTimeout(function(){ // allow notification to stay alive for timeout
            if(!eventing){
                eventOn(doc.body,'mousemove',remove);
                eventOn(doc.body,'click',remove);
                eventOn(doc.body,'keypress',remove);
                eventOn(doc.body,'touchstart',remove);
                eventing = true;
                if(!fdjtLog.notify.waitForMove) remove();
            }
        }, fdjtLog.notify.timeout);

        humaneEl.innerHTML = queue.shift();
        animate(1);
    }

    function animate(level){
        if(level === 1){
            humaneEl.className = "humane humane-show";
        } else {
            humaneEl.className = "humane";
            end();
        }
    }

    function end(){
        animationInProgress = false;
        setTimeout(run,500);
    }

    // if CSS Transitions not supported, fallback to JS Animation
    var setOpacity = (function(){
        if(useFilter){
            return function(opacity){
                humaneEl.filters.item('DXImageTransform.Microsoft.Alpha').Opacity = opacity*100;
            }
        } else {
            return function(opacity){
                humaneEl.style.opacity = String(opacity);
            }
        }
    }());
    function jsAnimateOpacity(level,callback){
        var interval;
        var opacity;

        if (level === 1) {
            opacity = 0;
            if(fdjtLog.notify.forceNew){
                opacity = useFilter ? humaneEl.filters.item('DXImageTransform.Microsoft.Alpha').Opacity/100|0 : humaneEl.style.opacity|0;
            }
            humaneEl.style.visibility = "visible";
            interval = setInterval(function(){
                if(opacity < 1) {
                    opacity +=0.1;
                    if (opacity>1) opacity = 1;
                    setOpacity(opacity);
                }
                else {
                    clearInterval(interval);
                }
            }, 500 / 20);
        } else {
            opacity = 1;
            interval = setInterval(function(){
                if(opacity > 0) {
                    opacity -=0.1;
                    if (opacity<0) opacity = 0;
                    setOpacity(opacity);
                }
                else {
                    clearInterval(interval);
                    humaneEl.style.visibility = "hidden";
                    end();
                }
            }, 500 / 20);
        }
    }

    function notify(message){
	fdjtLog.apply(null,arguments);
	if (arguments.length>1)
	    message=fdjtString.apply(null,arguments);
        queue.push(message);
        if(isSetup) run();
    }

    fdjtLog.notify = notify;
    fdjtLog.notify.timeout = 2000;
    fdjtLog.notify.waitForMove = true;
    fdjtLog.notify.forceNew = false;

}(window,document));


var fdjtNotify=fdjtLog.notify;

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
