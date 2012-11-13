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
    var trace_taps=true;
    var debug_taps=false;
    var window_setup=false;
    
    var touched=false;
    var pressed=false;
    var th_target=false;
    var th_targets=[];
    var th_timer=false;
    var mouse_down=false;
    var holdkey_down=false;
    var start_x=false;
    var start_y=false;
    var start_t=false;
    var touch_x=false;
    var touch_y=false;
    
    var getGeometry=fdjtDOM.getGeometry;
    var addClass=fdjtDOM.addClass;
    var hasClass=fdjtDOM.hasClass;
    var hasParent=fdjtDOM.hasParent;
    var reticle=fdjtUI.Reticle;
    var cancel=fdjtUI.cancel;
    // We disable the default behavior, which is usually selection
    // (where we do tap and hold)
    var noDefault=fdjtUI.noDefault;
    var dontcancel=function(evt){};

    var keynums={
	shift: 16, alt: 18, control: 17, meta: 224,
	os: 91, altgr: 225, fn: -1,
	numlock: 144, capslock: 20, scrolllock: 145};
    var keynames={};
    for (var akeyname in keynums)
	if (keynums.hasOwnProperty(akeyname)) {
	    var akeynum=keynums[akeyname];
	    if ((typeof akeynum === 'number')&&(akeynum>0))
		keynames[akeynum]=akeyname;}
    
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
    
    function dispatchEvent(target,etype,orig){
	if (!(target)) target=fdjtUI.T(orig);
	var evt = document.createEvent("UIEvent");
	var event_arg=
	    (((orig)&&(orig.touches)&&(orig.touches.length))||
	     ((orig)&&(orig.button))||
	     0);
	evt.initUIEvent(etype, true, true,window,event_arg);
	evt.clientX=touch_x; evt.clientY=touch_y;
	if (trace_taps)
	    fdjtLog("Synthesizing %s on %o @%d,%d from %o",
		    etype,target,touch_x,touch_y,orig||"scratch");
	if (orig) cancel(orig); // noDefault
	if (!(hasParent(target,document.body))) target=fdjtUI.T(orig);
	if ((!target)||(!(hasParent(target,document.body))))
	    target=document.getElementAtPoint(touch_x,touch_y);
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

    function tapped(target,evt){return dispatchEvent(target,"tap",evt);}
    function held(target,evt){return dispatchEvent(target,"hold",evt);}
    function released(target,evt){return dispatchEvent(target,"release",evt);}
    function slipped(target,evt){return dispatchEvent(target,"slip",evt);}

    function startpress(evt,holdthresh){
	evt=evt||event;
	if (touched) return;
	if (pressed) return;
	if (th_timer) return;
	if (!(th_target)) return;
	touched=th_target; pressed=false;
	if (trace_taps) fdjtLog("startpress %o",evt);
	if (reticle.live) reticle.highlight(true);
	noDefault(evt);
	th_timer=setTimeout((function(){
	    if (trace_taps) fdjtLog("startpress/timeout %o",evt);
	    if (th_targets.length>0) {
		var touched=th_targets;
		var i=0, lim=touched.length;
		while (i<lim) {
		    var elt=touched[i++];
		    if ((i===lim)&&(elt===th_target)) break;
		    held(elt); slipped(elt);}}
	    pressed=th_target; th_targets=[];
	    held(th_target,evt);
	    th_timer=false;
	    touched=false;}),
			    holdthresh||TapHold.interval||100);}
    function endpress(evt){
	if ((!(pressed))&&(!(touched))&&(!(th_timer))) return;
	if (trace_taps)
	    fdjtLog("TapHold/endpress %o t=%o p=%o tch=%o tm=%o",
		    evt,th_target,pressed,touched,th_timer);
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;
	    if (reticle.live) 
		setTimeout(function(){reticle.highlight(false);},1500);
	    if (th_target===touched)
		tapped(th_target,evt);
	    else slipped(th_target,evt);}
	else if (pressed) {released(pressed,evt);}
	if (reticle.live) reticle.highlight(false);
	if (evt) noDefault(evt);
	start_x=false; start_y=false; start_t=false;
	touched=false; pressed=false;
	th_targets=[];}
    function abortpress(evt){
	if (trace_taps)
	    fdjtLog("TapHold/abort %o: t=%o p=%o",evt,th_target,pressed);
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;}
	else if (pressed) {released(pressed,evt);}
	if (reticle.live) reticle.highlight(false);
	touched=false; pressed=false; th_targets=[];}

    function outer_mousemove(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	// If it doesn't have a parent, it's been removed from the DOM,
	//  so we can't tell if it *was* in a .fdjtaphold region, so we punt.
	if (!(target.parentNode)) return;
	if (!(hasParent(target,".fdjtaphold"))) {
	    if ((pressed)&&(trace_taps))
		fdjtLog("TapHold/slipout %o: t=%o p=%o",
			evt,th_target,pressed);
	    if (pressed) released(pressed);
	    touched=pressed=th_target=false; th_targets=[];
	    return;}}

    function mousemove(evt,movethresh){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	// if (target!==th_target) fdjtLog("New target %o",target);
	th_target=target;
	touch_x=evt.clientX||getClientX(evt);
	touch_y=evt.clientY||getClientY(evt);
	if ((movethresh)&&(start_x)&&(start_y)&&(th_timer)) {
	    var distance=(Math.abs(touch_x-start_x))+
		(Math.abs(touch_y-start_y));
	    var speed=distance/(fdjtET()-start_t);
	    if (speed>movethresh) {
		clearTimeout(th_timer);
		touched=th_timer=pressed=th_target=false;
		th_targets=[];}}
	if (evt.touches) {
	    th_target=document.elementFromPoint(touch_x,touch_y);
	    if ((touched)&&(!(pressed))&&
		(th_targets[th_targets.length-1]!==th_target))
		th_targets.push(th_target);}
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	else {
	    if (reticle.live) reticle.onmousemove(evt);
	    noDefault(evt);}
	if ((pressed)&&(th_target!==pressed)) {
	    if (trace_taps)
		fdjtLog("TapHold/move %o %o %d,%d",
			evt,th_target,touch_x,touch_y);
	    slipped(pressed);
	    pressed=th_target;
	    held(pressed);}}
    
    function keydown(evt){
	evt=evt||event;
	if (!(TapHold.holdkey)) return;
	var holdkey=TapHold.holdkey, holdkeynum, holdkeyname;
	if (!(holdkey)) return;
	else if (holdkey===true) holdkey="Shift";
	if (typeof holdkey === 'number') {
	    holdkeyname=keynames[holdkey];
	    holdkeynum=holdkey;}
	else if (typeof holdkey === 'string') {
	    holdkeynum=keynums[holdkey.toLowerCase()];
	    holdkeyname=holdkey.toLowerCase();}
	else {
	    fdjtLog.warn("Invalid holdkey specification %s",holdkey);
	    return;}
	if ((evt.key===holdkeyname)||
	    (evt.keyCode===holdkeynum)||
	    ((evt.getModifierState)&&
	     (evt.getModifierState(holdkeyname)))) {
	    holdkey_down=true;
	    var target=fdjtUI.T(evt);
	    if ((target)&&(target.tagName)&&
		((target.tagName==='INPUT')||
		 (target.tagName==='TEXTAREA')||
		 (hasParent(target,"input,textarea"))))
		return;
	    else if (!(touched)) startpress(evt);}}
    function mousedown(evt,holdthresh){
	evt=evt||event;
	if ((evt.shiftKey)||(evt.ctrlKey)||
	    (evt.altKey)||(evt.metaKey)||
	    (evt.button))
	    return;
	mouse_down=true;
	th_target=fdjtUI.T(evt); th_targets=[th_target];
	start_x=touch_x=evt.clientX||getClientX(evt);
	start_x=touch_y=evt.clientY||getClientY(evt);
	start_t=fdjtET();
	if (trace_taps)
	    fdjtLog("down %o t=%o x=%o y=%o t=%o",
		    evt,th_target,start_x,start_y,start_t);
	if (evt.ctrlKey) return;
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if (fdjtUI.isClickable(evt)) return;
	if (!(touched)) startpress(evt,holdthresh);
	noDefault(evt);}
    function fakePress(evt,holdthresh){
	var x=start_x=touch_x=evt.clientX||getClientX(evt);
	var y=start_y=touch_y=evt.clientY||getClientY(evt);
	start_t=fdjtET();
	var target=document.elementFromPoint(x,y);
	th_target=target; th_targets=[target];
	mouse_down=true;
	if (trace_taps)
	    fdjtLog("fakePress t=%o x=%o y=%o t=%o",
		    th_target,start_x,start_y,start_t);
	startpress(evt,holdthresh);}
    
    function keyup(evt){
	evt=evt||event;
	if (!(TapHold.holdkey)) return;
	var holdkey=TapHold.holdkey, holdkeynum, holdkeyname;
	if (!(holdkey)) return;
	else if (holdkey===true) holdkey="Shift";
	if (typeof holdkey === 'number') {
	    holdkeyname=keynames[holdkey];
	    holdkeynum=holdkey;}
	else if (typeof holdkey === 'string') {
	    holdkeynum=keynums[holdkey.toLowerCase()];
	    holdkeyname=holdkey.toLowerCase();}
	else {
	    fdjtLog.warn("Invalid holdkey specification %s",holdkey);
	    return;}
	if ((evt.key===holdkeyname)||
	    (evt.keyCode===holdkeynum)||
	    ((evt.getModifierState)&&
	     (evt.getModifierState(holdkeyname)))) {
	    holdkey_down=false;
	    if ((!(holdkey_down))&&(!(mouse_down)))
		endpress();}}
    TapHold.keyup=keyup;
    function mouseup(evt){
	evt=evt||event;
	if (!(mouse_down)) return;
	mouse_down=false;
	touch_x=evt.clientX||getClientX(evt)||touch_x;
	touch_y=evt.clientY||getClientY(evt)||touch_y;
	if (trace_taps)
	    fdjtLog("up %o etl=%o tht=%o sx=%o sy=%o x=%o y=%o t=%o",evt,
		    ((evt.touches)&&(evt.touches.length)&&
		     evt.touches.length),
		    th_target,start_x,start_y,touch_x,touch_y,
		    start_t);
	if ((evt.touches)&&(evt.touches.length)&&
	    (evt.touches.length>1))
	    return;
	if (fdjtUI.isClickable(evt)) return;
	if (trace_taps)
	    fdjtLog("TapHold/mouseup %o md=%o, kd=%o, th=%o",
		    evt,mouse_down,holdkey_down,th_target);
	if ((!(holdkey_down))&&(!(mouse_down))&&(touched)) {
	    fdjtUI.cancel(evt);
	    endpress(evt);}
	else {}}

    function get_mousedown(holdthresh){
	return function(evt){
	    return mousedown(evt,holdthresh);}}

    function get_mousemove(movethresh){
	return function(evt){
	    return mousemove(evt,movethresh);}}

    function TapHold(elt,fortouch,holdthresh,movethresh){
	if (!(elt)) {
	    fdjtLog.warn("TapHold with no argument!");
	    return;}
	addClass(elt,"fdjtaphold");
	var mm=((movethresh)?(get_mousemove(movethresh)):(mousemove));
	if (!(fortouch)) fdjtDOM.addListener(elt,"mousemove",mm);
	fdjtDOM.addListener(elt,"touchmove",mm);
	var md=((holdthresh)?(get_mousedown(holdthresh)):(mousedown));
	if (!(fortouch)) fdjtDOM.addListener(elt,"mousedown",md);
	fdjtDOM.addListener(elt,"touchstart",md);
	if (!(fortouch)) fdjtDOM.addListener(elt,"mouseup",mouseup);
	fdjtDOM.addListener(elt,"touchend",mouseup);
	if (!(window_setup)) {
	    if (!(fortouch))
		fdjtDOM.addListener(document,"mousemove",outer_mousemove);
	    fdjtDOM.addListener(document,"touchmove",outer_mousemove);
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
    TapHold.holdkey=16;
    TapHold.fakePress=fakePress;

    TapHold.ispressed=function(){
	return (pressed);}

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
