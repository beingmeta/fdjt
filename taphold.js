/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.

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

var fdjtUI=((typeof fdjtUI === 'undefined')?{}:(fdjtUI));
fdjtUI.TapHold=(function(){
    var trace_taps=false;
    var debug_taps=false;
    var window_setup=false;
    
    var touched=false;
    var pressed=false;
    var th_target=false;
    var th_timer=false;
    var mouse_down=false;
    var shift_down=false;
    var start_x=false;
    var start_y=false;
    var touch_x=false;
    var touch_y=false;
    
    var getGeometry=fdjtDOM.getGeometry;
    var addClass=fdjtDOM.addClass;
    var hasClass=fdjtDOM.hasClass;
    var hasParent=fdjtDOM.hasParent;
    var reticle=fdjtUI.Reticle;

    function getTarget(evt){
	if ((evt.changedTouches)&&((evt.changedTouches.length)))
	    return evt.changedTouches[evt.changedTouches.length-1].target;
	else return fdjtUI.T(evt);}

    function getClientX(evt){
	if (typeof evt.offsetX === "number") return evt.clientX;
	else if ((evt.touches)&&(evt.touches.length)) {
	    var touch=evt.touches[0];
	    return touch.clientX;}
	else if (typeof evt.clientX === "number") return evt.clientX;
	else return false;}
    function getClientY(evt){
	if (typeof evt.offsetY === "number") return evt.clientY;
	else if ((evt.touches)&&(evt.touches.length)) {
	    var touch=evt.touches[0];
	    return touch.clientY;}
	else if (typeof evt.clientY === "number") return evt.clientY;
	else return false;}
    
    function fakeEvent(target,etype,orig){
	var evt = document.createEvent("UIEvent");
	if (trace_taps)
	    fdjtLog("Synthesizing %s on %o @%d,%d",etype,target,
		    touch_x,touch_y);
	var event_arg=
	    (((orig)&&(orig.touches)&&(orig.touches.length))||
	     ((orig)&&(orig.button))||
	     1);
	evt.initUIEvent(etype, true, true,window,event_arg);
	evt.clientX=touch_x; evt.clientY=touch_y;
	// If the target no longer has a parent, it's been removed
	//  from the DOM, so we use the originating event target (if
	//  there is one)
	if ((orig)&&(!(target.parentNode))) target=fdjtUI.T(orig);
	if (orig) fdjtUI.cancel(orig);
	target.dispatchEvent(evt);}

    function tap_handler(evt){
	var target=fdjtUI.T(evt);
	var msgelt=fdjtID("TAPHOLDMESSAGE");
	if (msgelt) msgelt.innerHTML=fdjtString("Tapped %o",target);
	fdjtLog("Tapped %o",target);}
    function hold_handler(evt){
	var target=fdjtUI.T(evt);
	var msgelt=fdjtID("TAPHOLDMESSAGE");
	if (msgelt) msgelt.innerHTML=fdjtString("Held %o",target);
	fdjtLog("Held %o",target);}
    function release_handler(evt){
	var target=fdjtUI.T(evt);
	var msgelt=fdjtID("TAPHOLDMESSAGE");
	if (msgelt) msgelt.innerHTML=fdjtString("Released %o",target);
	fdjtLog("Released %o",target);}

    function tapped(target,evt){return fakeEvent(target,"tap",evt);}
    function held(target,evt){return fakeEvent(target,"hold",evt);}
    function released(target,evt){return fakeEvent(target,"release",evt);}
    function slipped(target,evt){return fakeEvent(target,"slip",evt);}

    function startpress(evt){
	if (touched) return;
	if (pressed) return;
	if (th_timer) return;
	if (!(th_target)) return;
	touched=th_target; pressed=false
	if (trace_taps) fdjtLog("startpress %o",evt);
	if (reticle.live) reticle.highlight(true);
	fdjtUI.cancel(evt);
	th_timer=setTimeout((function(evt){
	    if (trace_taps) fdjtLog("startpress/timeout %o",evt);
	    pressed=th_target;
	    held(th_target,evt);
	    th_timer=false;
	    touched=false;}),TapHold.interval||300);}
    function endpress(evt){
	if ((!(pressed))&&(!(touched))&&(!(th_timer))) return;
	if (th_timer) {
	    if (trace_taps)
		fdjtLog("endpress %o t=%o p=%o",evt,th_target,pressed);
	    clearTimeout(th_timer); th_timer=false;
	    if (reticle.live) 
		setTimeout(function(){reticle.highlight(false);},1500);
	    if (th_target===touched) tapped(th_target,evt);}
	else if (pressed) {released(pressed,evt);}
	if (reticle.live) reticle.highlight(false);
	fdjtUI.cancel(evt);
	start_x=false; start_y=false;
	touched=false; pressed=false;}
    function abortpress(evt){
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;}
	else if (pressed) {released(pressed,evt);}
	if (reticle.live) reticle.highlight(false);
	touched=false; pressed=false;}

    function outer_mousemove(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	if (!(hasParent(target,".fdjtaphold"))) {
	    if (pressed) released(pressed);
	    pressed=th_target=false;
	    return;}}

    function mousemove(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	// if (target!==th_target) fdjtLog("New target %o",target);
	th_target=target;
	touch_x=evt.clientX||getClientX(evt);
	touch_y=evt.clientY||getClientY(evt);
	if ((start_x)&&(start_y)&&(th_timer)&&
	    (((Math.abs(touch_x-start_x))+(Math.abs(touch_y-start_y)))>12)) {
	    clearTimeout(th_timer);
	    th_timer=pressed=th_target=false;}
	if (evt.touches) th_target=document.elementFromPoint(touch_x,touch_y);
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	else {
	    if (reticle.live) reticle.onmousemove(evt);
	    fdjtUI.cancel(evt);}
	if ((pressed)&&
	    (th_target!==pressed)) {
	    if (trace_taps)
		fdjtLog("move %o %o %d,%d",
			th_target,th_target.name,touch_x,touch_y);
	    slipped(pressed);
	    pressed=th_target;
	    held(pressed);}}
    
    function keydown(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=true;
	    if ((evt.ctrlKey)||(evt.altKey)) return;
	    var target=fdjtUI.T(evt);
	    if ((target)&&(target.tagName)&&
		((target.tagName==='INPUT')||
		 (target.tagName==='TEXTAREA')||
		 (hasParent(target,"input,textarea"))))
		return;
	    else if (!(touched)) startpress(evt);}}
    function mousedown(evt){
	evt=evt||event;
	if ((evt.shiftKey)||(evt.ctrlKey)||
	    (evt.altKey)||(evt.metaKey)||
	    (evt.button))
	    return;
	mouse_down=true;
	th_target=fdjtUI.T(evt);
	start_x=touch_x=evt.clientX||getClientX(evt);
	start_x=touch_y=evt.clientY||getClientY(evt);
	if (trace_taps)
	    fdjtLog("down %o t=%o x=%o y=%o",evt,th_target,start_x,start_y);
	if (evt.ctrlKey) return;
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if (fdjtUI.isClickable(evt)) return;
	if (!(touched)) startpress(th_target,evt);
	fdjtUI.cancel(evt);}
    
    function keyup(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=false;
	    if ((evt.ctrlKey)||(evt.altKey)) return;
	    if ((!(shift_down))&&(!(mouse_down))) endpress();}}
    TapHold.keyup=keyup;
    function mouseup(evt){
	evt=evt||event;
	if (!(mouse_down)) return;
	mouse_down=false;
	touch_x=evt.clientX||getClientX(evt)||touch_x;
	touch_y=evt.clientY||getClientY(evt)||touch_y;
	if (trace_taps)
	    fdjtLog("up %o etl=%o tht=%o sx=%o sy=%o x=%o y=%o",evt,
		    ((evt.touches)&&(evt.touches.length)&&
		     evt.touches.length),
		    th_target,start_x,start_y,touch_x,touch_y);
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if (fdjtUI.isClickable(evt)) return;
	if ((!(shift_down))&&(!(mouse_down)))
	    endpress(evt);
	else if (trace_taps)
	    fdjtLog("md=%o, sd=%o",mouse_down,shift_down);
	fdjtUI.cancel(evt);}

    function TapHold(elt,fortouch){
	elt=elt||window;
	addClass(elt,"fdjtaphold");
	fdjtDOM.addListener(elt,((fortouch)?("touchmove"):("mousemove")),
			    mousemove);
	fdjtDOM.addListener(elt,((fortouch)?("touchstart"):("mousedown")),
			    mousedown);
	fdjtDOM.addListener(elt,((fortouch)?("touchend"):("mouseup")),
			    mouseup);
	if (!(window_setup)) {
	    fdjtDOM.addListener(document,
				((fortouch)?("touchmove"):("mousemove")),
				outer_mousemove);
	    fdjtDOM.addListener(document,"keydown",keydown);
	    fdjtDOM.addListener(document,"keyup",keyup);
	    window_setup=window;}

	if (debug_taps) {
	    fdjtDOM.addListener(elt,"tap",tap_handler);
	    fdjtDOM.addListener(elt,"hold",hold_handler);
	    fdjtDOM.addListener(elt,"release",release_handler);}}
    TapHold.mouseup=mouseup;
    TapHold.mousedown=mousedown;
    TapHold.keydown=keydown;

    TapHold.ispressed=function(){
	return (pressed);}

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
