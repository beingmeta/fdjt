var fdjtTapHold=(function(){
    var trace_taps=true;

    var touched=false;
    var pressed=false;
    var th_target=false;
    var th_timer=false;
    var mouse_down=false;
    var shift_down=false;

    
    function fakeEvent(target,etype,orig){
	var evt = document.createEvent("UIEvent");
	if (trace_taps)
	    fdjtLog("Synthesizing %s on %o",etype,target);
	evt.initEvent(etype, true, true);
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


    function tapped(target,evt){
	return fakeEvent(target,"tap",evt||event);}
    function held(target,evt){
	return fakeEvent(target,"hold",evt||event);}
    function released(target,evt){
	return fakeEvent(target,"release",evt||event);}

    function assignListeners(elt){
	elt=elt||window;
	fdjtDOM.addListener(elt,"mousemove",mousemove);
	fdjtDOM.addListener(elt,"touchmove",mousemove);
	fdjtDOM.addListener(elt,"keydown",keydown);
	fdjtDOM.addListener(elt,"touchstart",mousedown);
	fdjtDOM.addListener(elt,"mousedown",mousedown);
	fdjtDOM.addListener(elt,"keyup",keyup);
	fdjtDOM.addListener(elt,"mouseup",mouseup);
    	fdjtDOM.addListener(elt,"touchend",mouseup);
	if (trace_taps) {
	    fdjtDOM.addListener(elt,"tap",tap_handler);
	    fdjtDOM.addListener(elt,"hold",hold_handler);
	    fdjtDOM.addListener(elt,"release",release_handler);}}

    function startpress(evt){
	if (touched) return;
	if (pressed) return;
	if (th_timer) return;
	touched=th_target; pressed=false
	th_timer=setTimeout(function(evt){
	    pressed=th_target;
	    held(th_target,evt);
	    th_timer=false;
	    touched=false;},500);}
    function endpress(evt){
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;
	    if (th_target===touched) tapped(th_target,evt);}
	else if (pressed) {released(pressed,evt);}
	touched=false; pressed=false;}

    function mousemove(evt){
	evt=evt||event;
	var target=fdjtUI.T(evt);
	// if (target!==th_target) fdjtLog("New target %o",target);
	th_target=target;
	if ((pressed)&&(th_target!==pressed)) {
	    released(pressed);
	    pressed=th_target;
	    held(pressed);}}

    function keydown(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=true;
	    if (!(touched)) startpress(th_target);}}
    function mousedown(evt){
	evt=evt||event;
	mouse_down=true;
	th_target=fdjtUI.T(evt);
	if (fdjtUI.isClickable(evt)) return;
	if (!(touched)) startpress(th_target);}
    
    function keyup(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=false;
	    if ((!(shift_down))&&(!(mouse_down))) endpress();}}
    function mouseup(evt){
	evt=evt||event;
	mouse_down=false;
	if (fdjtUI.isClickable(evt)) return;
	if ((!(shift_down))&&(!(mouse_down))) endpress();}

    return assignListeners;})();

