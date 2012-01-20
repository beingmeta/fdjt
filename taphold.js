var fdjtTapHold=(function(){
    var touched=false;
    var pressed=false;
    var th_target=false;
    var th_timer=false;
    var mouse_down=false;
    var shift_down=false;

    function tapped(target){fdjtLog("Tapped %o",target);}
    function held(target){fdjtLog("Held %o",target);}
    function released(target){fdjtLog("Released %o",target);}

    function assignListeners(elt){
	elt=elt||window;
	fdjtDOM.addListener(elt,"mousemove",mousemove);
	fdjtDOM.addListener(elt,"touchmove",mousemove);
	fdjtDOM.addListener(elt,"keydown",keydown);
	fdjtDOM.addListener(elt,"touchstart",mousedown);
	fdjtDOM.addListener(elt,"mousedown",mousedown);
	fdjtDOM.addListener(elt,"keyup",keyup);
	fdjtDOM.addListener(elt,"mouseup",mouseup);
    	fdjtDOM.addListener(elt,"touchend",mousedown);}

    function startpress(){
	if (touched) return;
	if (pressed) return;
	if (th_timer) return;
	touched=th_target; pressed=false
	th_timer=setTimeout(function(evt){
	    pressed=th_target;
	    held(th_target);
	    th_timer=false;
	    touched=false;},500);}
    function endpress(){
	if (th_timer) {
	    clearTimeout(th_timer); th_timer=false;
	    if (th_target===touched) tapped(th_target);}
	else if (pressed) {released(pressed);}
	touched=false; pressed=false;}

    function mousemove(evt){
	evt=evt||event;
	th_target=fdjtUI.T(evt);
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
	if (!(touched)) startpress(th_target);}
    
    function keyup(evt){
	evt=evt||event;
	if (evt.keyCode===16) {
	    shift_down=false;
	    if ((!(shift_down))&&(!(mouse_down))) endpress();}}
    function mouseup(evt){
	evt=evt||event;
	mouse_down=false;
	if ((!(shift_down))&&(!(mouse_down))) endpress();}

    return assignListeners;})();

