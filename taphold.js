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
    var touch_x=false;
    var touch_y=false;
    
    var getGeometry=fdjtDOM.getGeometry;

    function getClientX(evt){
	if (typeof evt.offsetX === "number") return evt.offsetX;
	else if ((evt.touches)&&(evt.touches.length)) {
	    var touch=evt.touches[0];
	    return touch.clientX;}
	else if (typeof evt.clientX === "number") return evt.clientX;
	else return false;}
    function getClientY(evt){
	if (typeof evt.offsetY === "number") return evt.offsetY;
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
	evt.initEvent(etype, true, true);
	evt.clientX=touch_x; evt.clientY=touch_y;
	// If the target no longer has a parent, it's been removed
	//  from the DOM, so we use the event target if there is one
	if ((orig)&&(!(target.parentNode))) target=fdjtUI.T(orig);
	// Does dispatchEvent set this?
	// evt.target=target;
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

    function TapHold(elt){
	elt=elt||window;
	fdjtDOM.addListener(elt,"mousemove",mousemove);
	fdjtDOM.addListener(elt,"touchmove",mousemove);
	fdjtDOM.addListener(elt,"touchstart",mousedown);
	fdjtDOM.addListener(elt,"mousedown",mousedown);
	fdjtDOM.addListener(elt,"mouseup",mouseup);
    	fdjtDOM.addListener(elt,"touchend",mouseup);
	if (!(window_setup)) {
	    fdjtDOM.addListener(document,"keydown",keydown);
	    fdjtDOM.addListener(document,"keyup",keyup);
	    window_setup=window;}

	if (debug_taps) {
	    fdjtDOM.addListener(elt,"tap",tap_handler);
	    fdjtDOM.addListener(elt,"hold",hold_handler);
	    fdjtDOM.addListener(elt,"release",release_handler);}}

    function startpress(evt){
	if (touched) return;
	if (pressed) return;
	if (th_timer) return;
	touched=th_target; pressed=false
	th_timer=setTimeout((function(evt){
	    pressed=th_target;
	    held(th_target,evt);
	    th_timer=false;
	    touched=false;}),TapHold.interval||300);}
    function endpress(evt){
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;
	    if (th_target===touched) tapped(th_target,evt);}
	else if (pressed) {released(pressed,evt);}
	touched=false; pressed=false;}
    function abortpress(evt){
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;}
	else if (pressed) {released(pressed,evt);}
	touched=false; pressed=false;}

    function mousemove(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	// if (target!==th_target) fdjtLog("New target %o",target);
	th_target=target;
	touch_x=evt.clientX||getClientX(evt);
	touch_y=evt.clientY||getClientY(evt);
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if ((pressed)&&(th_target!==pressed)) {
	    slipped(pressed);
	    pressed=th_target;
	    held(pressed);}}

    function keydown(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=true;
	    if ((evt.ctrlKey)||(evt.altKey)) return;
	    if (!(touched)) startpress(th_target);}}
    TapHold.keydown=keydown;
    function mousedown(evt){
	evt=evt||event;
	mouse_down=true;
	th_target=fdjtUI.T(evt);
	touch_x=evt.clientX||getClientX(evt);
	touch_y=evt.clientY||getClientY(evt);
	if (evt.ctrlKey) return;
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if (fdjtUI.isClickable(evt)) return;
	if (!(touched)) startpress(th_target,evt);}
    TapHold.mousedown=mousedown;
    
    function keyup(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=false;
	    if ((evt.ctrlKey)||(evt.altKey)) return;
	    if ((!(shift_down))&&(!(mouse_down))) endpress();}}
    TapHold.keyup=keyup;
    function mouseup(evt){
	evt=evt||event;
	mouse_down=false;
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	touch_x=evt.clientX||getClientX(evt);
	touch_y=evt.clientY||getClientY(evt);
	if (fdjtUI.isClickable(evt)) return;
	if ((!(shift_down))&&(!(mouse_down))) endpress(evt);}
    TapHold.mouseup=mouseup;

    TapHold.ispressed=function(){
	return (pressed);}

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
