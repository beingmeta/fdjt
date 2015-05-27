/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

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
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));
    if (!(fdjt.UI)) fdjt.UI={};

fdjt.TapHold=fdjt.UI.TapHold=(function(){
    "use strict";
    var fdjtLog=fdjt.Log;
    var fdjtDOM=fdjt.DOM;
    var fdjtTime=fdjt.Time;
    var fdjtUI=fdjt.UI;
    var fdjtET=fdjt.ET;

    var traceall=0;
    var window_setup=false;
    var default_opts={};
    
    var getChildren=fdjtDOM.getChildren;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var hasClass=fdjtDOM.hasClass;
    var getParent=fdjtDOM.getParent;
    var hasParent=fdjtDOM.hasParent;
    var Selector=fdjtDOM.Selector;
    var reticle=fdjtUI.Reticle;

    var noBubble=fdjtUI.noBubble;
    var noDefault=fdjtUI.noDefault;
    // var cancel=fdjtUI.cancel;
    var eTarget=fdjtUI.T;

    var cleared=0;
    var serial_count=1;

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
    
    var sqrt=Math.sqrt;
    function xyd(x0,y0,x1,y1){
        if ((typeof x0==="number")&&(typeof y0==="number")&&
            (typeof x1==="number")&&(typeof y1==="number"))
            return sqrt((x0-x1)*(x0-x1)+(y0-y1)*(y0-y1));
        else return false;}

    function getClientX(evt,x,y){
        if (typeof evt.clientX === "number") return evt.clientX;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        var winxoff=window.pageXOffset, winyoff=window.pageYOffset;
        if ((touches)&&(touches.length)) {
            if ((touches.length===1)||
                (typeof x !== "number")||
                (typeof y !== "number"))
                return (touches[0].pageX-winxoff);
            else {
                var i=1, lim=touches.length, tch=touches[0];
                var d=xyd(Math.abs(tch.pageX-winxoff),
                          Math.abs(tch.pageY-winyoff),
                          x,y);
                var d_min=d, touch=tch;
                while (i<lim) {
                    tch=touches[i++];
                    d=xyd(Math.abs(tch.pageX-winxoff),
                          Math.abs(tch.pageY-winyoff),
                          x,y);
                    if (d<d_min) {touch=tch; d_min=d;}}
                return touch.pageX-winxoff;}}
        else return false;}
    function getClientY(evt,x,y){
        if (typeof evt.clientY === "number") return evt.clientY;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        var winxoff=window.pageXOffset, winyoff=window.pageYOffset;
        if ((touches)&&(touches.length)) {
            if ((touches.length===1)||
                (typeof x !== "number")||
                (typeof y !== "number"))
                return (touches[0].pageY-winyoff);
            else {
                var i=1, lim=touches.length, tch=touches[0];
                var d=(Math.abs(Math.abs(tch.pageX-winxoff)-x)+
                       (Math.abs(Math.abs(tch.pageY-winyoff)-y)));
                var d_min=d, touch=tch;
                while (i<lim) {
                    tch=touches[i++];
                    d=(Math.abs(Math.abs(tch.pageX-winxoff)-x)+
                       (Math.abs(Math.abs(tch.pageY-winyoff)-y)));
                    if (d<d_min) {touch=tch; d_min=d;}}
                return touch.pageY-winyoff;}}
        else return false;}
    
    function synthesizeEvent(target,etype,th,orig,tx,ty,tn,also){
        var thid=th.id||(typeof th), trace=th.traced, handlers=th.handlers;
        var orig_target=(orig)&&(eTarget(orig));
        if (!(target)) target=orig_target;
        var evt = document.createEvent("UIEvent");
        var event_arg=
            (((orig)&&(orig.touches)&&(orig.touches.length))||
             ((orig)&&(orig.button))||
             0);
        evt.initUIEvent(etype, true, true,window,event_arg);
        evt.clientX=tx; evt.clientY=ty; evt.ntouches=tn||1;
        if (also) {
            for (var prop in also) {
                if (also.hasOwnProperty(prop)) {
                    evt[prop]=also[prop];}}}
        if ((trace)||(traceall)) {
            if ((also)&&(typeof also.startX === "number"))
                fdjtLog("TapHold/%s(%s) on %o @%d,%d/%d,%d from %o given %j",
                        etype,thid,target,tx,ty,also.startX,also.startY,
                        orig||"scratch",also);
            else if (also)
                fdjtLog("TapHold/%s(%s) on %o @%d,%d from %o given %j",
                        etype,thid,target,tx,ty,orig||"scratch",also);
            else fdjtLog("TapHold/%s(%s) on %o @%d,%d from %j",
                         etype,thid,target,tx,ty,orig||"scratch");}
        if ((!target)||(!(hasParent(target,document.body))))
            target=document.elementFromPoint(tx,ty);
        if (orig_target!==target)
            evt.relatedTarget=orig_target;
        if ((handlers)&&(handlers.hasOwnProperty(etype))) {
            evt.target=target;
            handlers[etype](evt,target);}
        else target.dispatchEvent(evt);}
    
    /* This gets the target based on geometry. */
    function getRealTarget(holder,touchable,x,y){
        var children=getChildren(holder,touchable);
        var i=0, lim=children.length;
        while (i<lim) {
            var child=children[i++];
            var left=child.offsetLeft, top=child.offsetTop;
            var right=child.offsetRight, bot=child.offsetBottom;
            if (typeof left !== "number") continue;
            else if ((((right-left)<=1)?
                      ((x>=left)&&(y<=right)):
                      ((x>=left)&&(y<right)))&&
                     (((bot-top)<=1)?
                      ((y>=top)&&(y<=bot)):
                      ((x>=top)&&(y<bot)))) {
                // fdjtLog("Got %o at %d,%d ltrb=%d,%d,%d,%d",child,x,y,left,top,right,bot);
                return child;}}
        return false;}

    var mouse_down=false;
    function global_mouseup(evt){
        evt=evt||window.event;
        if (traceall) fdjtLog("TapHold/global/mouseup %o",evt);
        if (evt.button===1) mouse_down=false;}
    function global_mousedown(evt){
        evt=evt||window.event;
        if (traceall) fdjtLog("TapHold/global/mousedown %o",evt);
        if (evt.button===1) mouse_down=true;}
    function global_mouseout(evt){
        evt=evt||window.event;
        var target=eTarget(evt), rel=evt.relatedTarget||evt.toElement;
        if (traceall>2)
            fdjtLog("TapHold/global/mouseout %o %o==>%o",
                    evt,target,rel);
        if (target===document.documentElement)
            mouse_down=false;}

    function traceValue(classname){
        var parsed=/\bfdjtlog(\d*)/.exec(classname);
        if ((parsed)&&(parsed.length)) {
            var level=
                ((typeof parsed[1] === "string")&&
                 (parseInt(parsed[1],10)));
            if ((level)&&(!(isNaN(level))))
                return level;
            else return 1;}
        else return 0;}

    function TapHold(elt,opts){
        if (!(elt)) {
            fdjtLog.warn("TapHold with no argument!");
            return;}
        
        if (!(this instanceof TapHold))
            return new TapHold(elt,opts);
        
        var th=this;
        var holdclass="tapholding";
        var touchclass="tapholdtarget";
        // Touched is set when the gesture is started, pressed is set
        // when it becomes a hold (with pressed_at as the time)
        var touched=false, pressed=false, pressed_at=false;
        // The timer which turns a touch into a hold
        var th_timer=false, tt_timer=false;
        // The current touch target, and a history of touch targets,
        // to handle slips.
        var th_target=false, th_targets=[];
        var tap_target=false, th_target_t=false, th_last=false;
        // Whether we're in a touch environment.
        var fortouch=false;
        // Whether motion causes a 'hold' to slip among targets,
        // triggering 'slip' events and new 'hold' events.
        var noslip=false;
        // Whether created events bubble;
        var bubble=false;
        // Whether to override (cancel) the default handlers on the
        // container
        var override=false;
        // Don't capture events with more than this number of touches
        var maxtouches=1;

        // If this is true, second touches in the container during a
        //  live touch are turned into touchtoo events; otherwise,
        //  they abort the current press/touch and start a new tap or
        //  hold
        var touchtoo=false;
        
        // How long it takes a touch to become a press
        var holdmsecs=false;
        // How long (and whether) to recognize double taps
        var taptapmsecs=false;
        // Abort a press when the touch moves move than this many pixels
        var movethresh=false;
        // How long to wait before aborting a press after the touch wanders
        //  away from the touch container
        var wanderthresh=false;
        // Minimum distance before recognizing a swipe
        var min_swipe=30;
        
        var scrolling=false, scroll_x=0, scroll_y=0;
        // These indicate where/when the current gesture started, is
        // currently, and the last point at which the touch target
        // changed.
        var start_x=false, start_y=false, start_t=false;
        var touch_x=false, touch_y=false, touch_t=0, touch_n=false;
        var target_x=false, target_y=false, target_t=false;
        // This is when (and whether) a swipe event has been generated
        //  for the current gesture.
        var swipe_t=false;
        // This controls the maximum velocity (in pixels/second) for touches
        //  to change targets
        var minmove=2;
        // This is how far the touch 'hotspot' is from the actual x, y
        // (This may not be entirely consistent with touchstart
        // targets, which is a potential problem.).
        var hot_xoff=0, hot_yoff=0;
        // The level of tracing to use for this TapHold handler
        var trace=0;
        
        var clickable=
            ((opts.clickable)&&
             ((opts.clickable===true)?(new Selector("a[href]")):
              (typeof opts.clickable === "string")?
              (new Selector(opts.clickable)):
              (opts.clickable)));

        var serial=serial_count++;
        var thid=(((opts)&&(opts.id))?(opts.id+":"+serial):
                  (elt.id)?("#"+elt.id+":"+serial):
                  (""+serial));
        th.id=thid;

        var touchable=elt.getAttribute("data-touchable");
        if ((opts)&&(opts.hasOwnProperty("touchable"))) {
            // Opts override attributes
            if (typeof opts.touchable === "string")
                touchable=fdjtDOM.Selector(opts.touchable);
            else touchable=opts.touchable;}
        else if (touchable) touchable=fdjtDOM.Selector(touchable);
        else touchable=function(e){return hasParent(e,elt);};

        var isClickable=fdjtUI.isClickable, untouchable;
        if ((opts)&&(opts.hasOwnProperty("untouchable"))) {
            // Opts override attributes
            if (typeof opts.untouchable === "string") {
                var notouch=fdjtDOM.Selector(opts.untouchable);
                untouchable=function(e){
                    if (e.nodeType) return notouch.match(e);
                    else return notouch.match(eTarget(e));};}
            else untouchable=opts.untouchable;}
        else untouchable=function(e){return isClickable(e);};
        
        if ((opts)&&(opts.noslip)) noslip=opts.noslip;
        if ((opts)&&(opts.touch_xoff)) hot_xoff=opts.touch_xoff;
        if ((opts)&&(opts.touch_yoff)) hot_yoff=opts.touch_yoff;

        if ((opts)&&(opts.hasOwnProperty("trace"))) {
            var opt_val=opts.trace;
            if (typeof opt_val==="number") trace=opt_val;
            else if (opt_val) trace=2;
            else trace=0;}
        else if (hasClass(elt,/\bfdjtlog\d*/g))
            trace=traceValue(elt.className);
        else trace=0;
        
        var wander_timer=false;

        function cleartouch(all){
            if (th_timer) {clearTimeout(th_timer); th_timer=false;}
            if ((all)&&(tt_timer)) {
                clearTimeout(tt_timer); tt_timer=false;}
            if ((th_target)&&(touchclass))
                dropClass(th_target,touchclass);
            th_target=th_target_t=false; th_targets=[];
            swipe_t=start_x=start_y=start_t=
                touch_x=touch_y=touch_t=touch_n=
                target_x=target_y=target_t=false;
            touched=pressed=pressed_at=false;}

        function synthEvent(target,etype,th,orig,tx,ty,also){
            return synthesizeEvent(target,etype,th,orig,tx,ty,touch_n,also);}

        function setTarget(t){
            if (((trace>2)||(traceall>2))||
                ((t!==th_target)&&((trace)||(traceall))))
                fdjtLog("TapHold/setTarget(%s) %o cur=%o",thid,t,th_target);
            if ((th_target)&&(th_target!==t)&&(touchclass))
                dropClass(th_target,"tapholdtarget");
            if ((t)&&(touchclass)) addClass(t,"tapholdtarget");
            if ((t)&&(th_target)&&(t!==th_target)) {
                target_x=touch_x; target_y=touch_y; target_t=touch_t;}
            th_last=th_target;
            th_target=t; th_target_t=fdjtTime();}

        function tapped(target,evt,x,y){
            if (typeof x === "undefined") x=touch_x;
            if (typeof y === "undefined") y=touch_y;
            return synthEvent(target,"tap",th,evt,x,y,false);}
        function held(target,evt,x,y){
            if (typeof x === "undefined") x=touch_x;
            if (typeof y === "undefined") y=touch_y;
            if (holdclass)
                setTimeout(function(){addClass(elt,holdclass);},20);
            return synthEvent(target,"hold",th,evt,x,y,false);}
        function released(target,evt,x,y){
            var target_time=
                ((th_target_t)&&(th_last)&&(fdjtTime()-th_target_t));
            if (typeof x === "undefined") x=touch_x;
            if (typeof y === "undefined") y=touch_y;
            if (holdclass)
                setTimeout(function(){
                    if (!(th_target)) dropClass(elt,holdclass);},
                           50);
            if ((target_time)&&(target_time<200)) {
                if (trace)
                    fdjtLog("TapHold(%s) %d=i<200ms, target=%o not %o",
                            thid,target_time,th_last,target);
                target=th_last;}
            return synthEvent(target,"release",th,evt,x,y,
                              {startX: start_x,startY: start_y});}
        function slipped(target,evt,also){
            if (also) {
                also.startX=start_x; also.startY=start_y;}
            else also={startX: start_x,startY: start_y};
            if (evt) {
                var rel=evt.relatedTarget||eTarget(evt);
                if (rel!==target) also.relatedTarget=rel;}
            if (holdclass)
                setTimeout(function(){
                    if (!(th_target)) dropClass(elt,holdclass);},
                           50);
            return synthEvent(target,"slip",th,evt,touch_x,touch_y,also);}
        function taptapped(target,evt){
            return synthEvent(target,"taptap",th,evt,
                              touch_x,touch_y,false,trace);}
        function swiped(target,evt,sx,sy,cx,cy){
            var dx=cx-sx, dy=cy-sy; swipe_t=fdjtTime();
            return synthEvent(target,"swipe",th,evt,cx,cy,
                              {startX: sx,startY: sy,endX: cx,endY: cy,
                               deltaX: dx,deltaY: dy});}
        
        function startpress(evt,to){
            if (!(to)) to=holdmsecs||TapHold.interval||100;
            evt=evt||window.event;
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/startpress(%s) %o tht=%o timer=%o tt=%o touched=%o pressed=%o@%o timeout=%oms",
                        thid,evt,th_target,th_timer,tap_target,touched,
                        pressed,pressed_at,to);
            if ((tap_target)&&(th_timer)) {
                clearTimeout(th_timer); th_timer=false;}
            if ((tap_target)&&(tt_timer)) {
                clearTimeout(tt_timer); tt_timer=false;
                taptapped(tap_target,evt);
                cleartouch(true);
                return;}
            if ((touched)||(pressed)||(th_timer)) return;
            else if (!(th_target)) {
                swipe_t=false; return;}
            else {touched=th_target; pressed=false; swipe_t=false;}
            if (reticle.live) reticle.highlight(true);
            pressed_at=fdjtTime(); 
            if (th_timer) clearTimeout(th_timer);
            th_timer=setTimeout((function(){
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/startpress/timeout(%s) (%dms) %o",
                            thid,to,evt);
                if (th_targets.length>0) {
                    var targets=th_targets;
                    var i=0, lim=targets.length;
                    while (i<lim) {
                        var elt=targets[i++];
                        if ((i===lim)&&(elt===th_target)) break;
                        held(elt);
                        if (noslip) {}
                        else if (i<lim)
                            slipped(elt,evt,{relatedTarget: targets[i]});
                        else slipped(elt,evt);}}
                pressed=th_target; th_targets=[];
                if (th_target) pressed_at=fdjtTime(); else pressed_at=false;
                held(th_target,evt);
                if (th_timer) clearTimeout(th_timer);
                th_timer=false;
                touched=false;}),
                                to);}
        function endpress(evt){
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/endpress(%s) %o t=%o p=%o tch=%o tm=%o ttt=%o/%o, start=%d,%d,%d/%d",
                        thid,evt,th_target,pressed,touched,th_timer,
                        tap_target,taptapmsecs,
                        start_x,start_y,start_t,fdjtET());
            if ((!(pressed))&&(!(touched))&&(!(th_timer))) {
                cleartouch(true);
                return;}
            var x=touch_x, y=touch_y;
            if (th_timer) {
                clearTimeout(th_timer); th_timer=false;
                if (reticle.live) 
                    setTimeout(function(){reticle.highlight(false);},1500);
                if ((th_target===touched)||
                    ((fdjtET()-start_t)<(holdmsecs/1000))) {
                    tap_target=th_target;
                    if ((taptapmsecs)&&(taptapmsecs>0)) {
                        tt_timer=setTimeout(function(){
                            tt_timer=false; tapped(tap_target,evt,x,y);},
                                            taptapmsecs);}
                    else tapped(th_target,evt,x,y);}
                else if (noslip) {}
                else slipped(th_target,evt);}
            else if (pressed) {
                var geom=fdjtDOM.getGeometry(elt);
                if ((x>=geom.left)&&(x<=geom.right)&&
                    (y>=geom.top)&&(y<=geom.bottom))
                    released(pressed,evt,x,y);
                else if (noslip)
                    released(pressed,evt,x,y);
                else slipped(th_target,evt,{touch_x: x,touch_y: y});}
            else {}
            if (reticle.live) reticle.highlight(false);
            cleartouch();
            setTarget(false);
            if (holdclass)
                setTimeout(function(){dropClass(elt,holdclass);},20);
            th_targets=[];}
        function abortpress(evt,why){
            if ((trace)||(traceall))
                fdjtLog("TapHold/abort%s(%s) %o: th=%o t=%o p=%o",
                        ((why)?("("+why+")"):("")),thid,
                        evt,th_target,touched,pressed);
            if (th_timer) {
                clearTimeout(th_timer); th_timer=false;}
            else if (noslip) {}
            else if (pressed) {slipped(pressed,evt);}
            if (reticle.live) reticle.highlight(false);
            pressed_at=touched=pressed=tap_target=false;
            if (holdclass)
                setTimeout(function(){dropClass(elt,holdclass);},20);
            th_targets=[];
            setTarget(false);}

        function taphold_mouseout(evt){
            evt=evt||window.event;
            var to=evt.toElement||evt.relatedTarget;
            if (wander_timer) return;
            if (!(th_target)) return;
            if ((pressed)&&(!(hasParent(to,elt)))) {
                wander_timer=setTimeout(function(){
                    if (!(noslip))
                        slipped(pressed,evt,{relatedTarget: to});
                    abortpress(evt,"taphold_mouseout");},
                                        wanderthresh);}}

        function taphold_mouseover(evt){
            evt=evt||window.event;
            if (wander_timer) {
                clearTimeout(wander_timer);
                wander_timer=false;}}

        function taphold_move(evt){
            evt=evt||window.event;
            var target, n_touches=((evt.touches)&&(evt.touches.length))||1;
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            if ((scrolling)&&(evt.touches)&&(evt.touches.length<=maxtouches)) {
                if (scroll_x>=0) 
                    scrolling.scrollLeft=
                    scroll_x-(evt.touches[0].pageX-window.pageXOffset);
                if (scroll_y>=0)
                    scrolling.scrollTop=
                    scroll_y-(evt.touches[0].pageY-window.pageYOffset);}
            if ((pressed)&&(cleared>start_t)) {
                abortpress(evt,"move/cleared");
                return;}
            if (((touched)||(pressed))&&(!(mouse_down))) {
                abortpress(evt,"move/up");
                return;}
            
            // if (target!==th_target) fdjtLog("New target %o",target);
            var x=evt.clientX||getClientX(evt,touch_x,touch_y);
            var y=evt.clientY||getClientY(evt,touch_x,touch_y);
            var distance=((pressed)?
                          (xyd(x,y,target_x,target_y)):
                          (xyd(x,y,start_x,start_y)));
            if ((evt.touches)||(hot_xoff)||(hot_yoff)) {
                x=x+hot_xoff; y=y+hot_yoff;
                target=document.elementFromPoint(x,y);}
            else target=eTarget(evt);
            var delta=(Math.abs(x-touch_x))+(Math.abs(y-touch_y));
            var dt=(fdjtTime()-touch_t)/1000;
            if ((trace>2)||(traceall>2))
                fdjtLog("TapHold/move(%s) s=%d,%d tt=%d,%d t=%d,%d c=%d,%d d=%d thresh=%o, dt=%o md=%o, pressed=%o, touched=%o, event=%o target=%o",
                        thid,start_x,start_y,
                        target_x,target_y,touch_x,touch_y,x,y,
                        distance,movethresh,dt,mouse_down,
                        pressed,touched,evt,target);
            if (!(target)) {
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                if (!(touch_n)) touch_n=n_touches; else
                    if (n_touches>touch_n) touch_n=n_touches;
                return;}
            var holder=getParent(target,".tapholder");
            // fdjtLog("taphold_move %o %d,%d %o %o",evt,x,y,target,holder);
            if (holder!==elt) {
                if ((trace>2)||(traceall>2)) {
                    trace_ignore_move(evt,thid,elt,holder,th_target,target,
                                      start_x,start_y,target_x,target_y,
                                      touch_x,touch_y);}
                if (th_target) {
                    if ((trace)||(traceall))
                        fdjtLog("setWanderTimeout(%s): h=%o!=elt=%o",
                                thid,holder,elt);
                    wander_timer=setTimeout(function(){
                        abortpress(evt,"taphold_wander_timeout");},
                                            wanderthresh);
                    if (pressed) {
                        if (!(noslip))
                            slipped(pressed,evt,{relatedTarget: target});
                        setTarget(false);}}
                return;}
            else if (wander_timer) {
                clearTimeout(wander_timer); wander_timer=false;
                if ((trace>2)||(traceall>2))
                    fdjtLog("Wander return(%s) %o pressed=%o, target=%o",
                            thid,evt,pressed,th_target);
                if ((pressed)&&(!(th_target))) {
                    setTarget(pressed);
                    held(pressed,evt);}}
            else {}

            // If touched is false, the tap/hold was aborted somehow
            if ((!((touched)||(pressed)))) {
                // Just tracking, to detect swipes
                if ((!(swipe_t))&&(min_swipe>0)&&(xyd(start_x,start_y,x,y)>min_swipe))
                    swiped(target,evt,start_x,start_y,x,y);
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                if (!(touch_n)) touch_n=n_touches; else
                    if (n_touches>touch_n) touch_n=n_touches;
                return;}
            
            if ((movethresh)&&(th_timer)&&
                (distance>movethresh)) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/move/cancel(%s) s=%d,%d tt=%d,%d t=%d,%d c=%d,%d d=%d thresh=%o, dt=%o md=%o, event=%o",
                            thid,start_x,start_y,
                            target_x,target_y,touch_x,touch_y,x,y,
                            distance,movethresh,dt,mouse_down,evt);
                abortpress(evt,"movefar");
                if (th_timer) clearTimeout(th_timer);
                pressed_at=touched=th_timer=pressed=false; th_targets=[];
                if ((!(swipe_t))&&(min_swipe>0)&&(xyd(start_x,start_y,x,y)>min_swipe))
                    swiped(target,evt,start_x,start_y,x,y);
                setTarget(false);
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                if (!(touch_n)) touch_n=n_touches; else
                    if (n_touches>touch_n) touch_n=n_touches;
                return;}
            else if ((delta<(minmove*10))&&(dt>0)&&((delta/dt)<minmove)) {
                if ((trace>2)||(traceall>2))
                    fdjtLog("TapHold/move/ignore(%s) s=%d,%d t=%d,%d c=%d,%d dt=%o total=%d/%o, local=%d/%o/%o, thresh=%o md=%o",
                            thid,start_x,start_y,touch_x,touch_y,x,y,
                            dt,distance,movethresh,
                            delta,delta/dt,minmove,
                            mouse_down);
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                if (!(touch_n)) touch_n=n_touches; else
                    if (n_touches>touch_n) touch_n=n_touches;
                return;}
            else {
                if ((trace>2)||(traceall>2))
                    fdjtLog("TapHold/move(%s) s=%d,%d t=%d,%d c=%d,%d dt=%o total=%d/%o, local=%d/%o/%o, md=%o",
                            thid,start_x,start_y,touch_x,touch_y,x,y,
                            dt,distance,movethresh,delta,minmove,delta/dt,
                            mouse_down);
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                if (!(touch_n)) touch_n=n_touches; else
                    if (n_touches>touch_n) touch_n=n_touches;
                target=getParent(target,touchable);}
            if ((evt.touches)&&(evt.touches.length)&&
                (evt.touches.length>maxtouches))
                return;
            else {
                if (reticle.live) reticle.onmousemove(evt,touch_x,touch_y);}
            if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if (!(target)) return;
            if ((hasParent(target,".tapholder"))&&(!(noslip)))
                setTarget(target);
            if ((evt.touches)&&(touched)&&(!(pressed))&&
                (th_targets[th_targets.length-1]!==th_target))
                th_targets.push(th_target);
            if (!(mouse_down)) {
                if (!(noslip))
                    slipped(pressed,evt,{relatedTarget: target});
                pressed_at=pressed=false;}
            else if ((pressed)&&(th_target!==pressed)&&(noslip)) {      
                endpress(evt);}
            else if ((pressed)&&(th_target!==pressed)) {
                if (!(noslip))
                    slipped(pressed,evt,{relatedTarget: target});
                pressed=th_target;
                if (pressed) pressed_at=fdjtTime(); else pressed_at=false;
                pressed_at=fdjtTime();
                held(pressed);}
            else {}}
        function trace_ignore_move(evt,thid,elt,holder,th_target,target,
                                   start_x,start_y,target_x,target_y,
                                   touch_x,touch_y) {
            fdjtLog(
                "TapHold/move%s/farout(%s) %o %o -> %o s=%d,%d tt=%d,%d t=%d,%d",
                ((mouse_down)?("/md"):("")),thid,
                evt,th_target,target,start_x,start_y,
                target_x,target_y,touch_x,touch_y);
            fdjtLog("TapHold/move/farout(%s) target in %o, elt is %o",
                    thid,holder,elt);}

        function taphold_down(evt,holdmsecs){
            evt=evt||window.event;
            if ((evt.ctrlKey)||
                (evt.altKey)||(evt.metaKey)||
                (evt.button)||
                ((evt.which)&&(evt.which>1)))
                return;
            var n_touches=((evt.touches)&&(evt.touches.length))||1;
            mouse_down=true; cleared=0;
            touch_x=(evt.clientX||getClientX(evt)||touch_x)+hot_xoff;
            touch_y=(evt.clientY||getClientY(evt)||touch_y)+hot_yoff;
            start_x=target_x=touch_x; start_y=target_y=touch_y;
            target_t=touch_t=fdjtTime();
            if (!(touch_n)) touch_n=n_touches; else
                if (n_touches>touch_n) touch_n=n_touches;
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            var new_event=false;
            var target=(((hot_xoff)||(hot_yoff))?
                        (document.elementFromPoint(touch_x,touch_y)):
                        (eTarget(evt)));
            var holder=getParent(target,".tapholder");
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/down(%s) %o tht=%o target=%o holder=%o elt=%o",
                        thid,evt,th_target,target,holder,elt);
            if (holder!==elt) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/ignore(%s) %o tht=%o t=%o h=%o elt=%o",
                            thid,evt,th_target,target,holder,elt);
                return;}

            if (target) target=getParent(target,touchable);
            if ((scrolling)&&(evt.touches)&&(evt.touches.length<=maxtouches)) {
                if (scroll_x>=0)
                    scroll_x=scrolling.scrollLeft+(
                        evt.touches[0].pageX-window.pageXOffset);
                if (scroll_y>=0)
                    scroll_y=scrolling.scrollLeft+(
                        evt.touches[0].pageY-window.pageYOffset);}
            if (evt.touches) {
                target=document.elementFromPoint(touch_x,touch_y);}
            if ((trace>1)||(traceall>1))
                fdjtLog(
                    "TapHold/down(%s) %o tht=%o trg=%o s=%o,%o,%o t=%o,%o m=%o tch=%o prs=%o ttt=%o",
                    thid,evt,th_target,target,
                    start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                    touched,pressed,taptapmsecs||false);
            
            if ((evt.touches)&&(th_target)) {
                // Handle additional touches while holding/pressing
                var cur_holder=getParent(elt,".tapholder");
                var touch=evt.changedTouches[0];
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold(%s) second touch on %o (in %o) after %o (in %o)",
                            thid,target,holder,th_target,cur_holder,
                            (cur_holder===holder));
                if ((touchtoo)&&(cur_holder===holder)) {
                    if ((trace>1)||(traceall>1))
                        fdjtLog("TapHold(%s) touchtoo with touchtoo on %o after %o: %o",
                                thid,target,th_target,evt);
                    if (touchtoo.call) {
                        touchtoo.call(th,evt);
                        return;}
                    new_event=document.createEvent('UIEvent');
                    new_event.initUIEvent(
                        "touchtoo",true,true,window,0);
                    new_event.screenX=touch.screenX;
                    new_event.screenY=touch.screenY;
                    new_event.clientX=touch.clientX;
                    new_event.clientY=touch.clientY;
                    new_event.ctrlKey=evt.ctrlKey;
                    new_event.altKey=evt.altKey;
                    new_event.shiftKey=evt.shiftKey;
                    new_event.metaKey=evt.metaKey;
                    new_event.touches=document.createTouchList(touch);
                    new_event.targetTouches=document.createTouchList(touch);
                    new_event.changedTouches=document.createTouchList(touch);
                    target.dispatchEvent(new_event);
                    return;}
                else if ((cur_holder)&&(holder)&&
                         (cur_holder!==holder)) {
                    if ((trace>1)||(traceall>1))
                        fdjtLog("TapHold(%s) Clearing on %o, moving %o to %o",
                                thid,th_target,evt,target);
                    new_event=document.createEvent('TouchEvent');
                    new_event.initTouchEvent(
                        evt.type,true,true,window,null,
                        touch.screenX,touch.screenY,
                        touch.clientX,touch.clientY,
                        evt.ctrlKey,evt.altKey,evt.shiftKey,evt.metaKey,
                        document.createTouchList(touch),
                        document.createTouchList(touch),
                        document.createTouchList(touch));}
                else {}}
            if (new_event) {
                abortpress(evt,"down/touch2");
                target.dispatchEvent(new_event);
                return;}
            else {setTarget(target); th_targets=[];}
            start_t=fdjtET();
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/down(%s) %o t=%o x=%o y=%o t=%o touched=%o",
                        thid,evt,th_target,start_x,start_y,start_t,touched);
            if ((untouchable)&&(untouchable(evt))) return;
            if (!(touched)) startpress(evt,holdmsecs);}

        function taphold_up(evt){
            evt=evt||window.event;
            mouse_down=false;
            if (cleared>start_t) {
                abortpress(evt,"up");
                return;}
            var target=eTarget(evt);
            if ((clickable)&&(th_timer)&&
                (((clickable.match)&&(clickable.match(target)))||
                 ((clickable.call)&&(clickable(target))))) {
                // This is really a click
                abortpress(false,"up/clickable");
                return;}
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/up/ignore(%s) %o tht=%o target=%o holder=%o elt=%o",
                            thid,evt,th_target,target,holder,elt);
                return;}
            if (target) target=getParent(target,touchable);
            touch_x=(evt.clientX||getClientX(evt)||touch_x)+hot_xoff;
            touch_y=(evt.clientY||getClientY(evt)||touch_y)+hot_yoff;
            touch_t=fdjtTime();
            if ((!(target))||(hot_xoff)||(hot_yoff))
                target=getRealTarget(elt,touchable,touch_x,touch_y);
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/up(%s) %o tht=%o d=%o s=%o,%o,%o t=%o,%o m=%o touched=%o pressed=%o ttt=%o swipe_t=%o",
                        thid,evt,th_target,
                        xyd(start_x,start_y,touch_x,touch_y),
                        start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                        touched,pressed,taptapmsecs,swipe_t);
            if ((evt.changedTouches)&&(evt.changedTouches.length)&&
                (evt.changedTouches.length>maxtouches))
                return;
            var swipe_len=(swipe_t)?(0):xyd(start_x,start_y,touch_x,touch_y);
            if ((touched)||(pressed)) {
                if ((untouchable)&&(untouchable(evt))) return;
                endpress(evt);}
            else if ((min_swipe>0)&&(swipe_len>min_swipe)&&
                     (((!touched)||(touched!==elt))&&
                      ((!pressed)||(pressed!==elt))))
                swiped(target,evt,start_x,start_y,touch_x,touch_y);
            else if ((touched)||(pressed)) {
                if (!((untouchable)&&(untouchable(evt)))) endpress(evt);}
            else {}
            cleartouch();}

        function taphold_cancel(evt){
            if ((trace)||(traceall))
                fdjtLog("TapHold/cancel(%s) %o: th=%o t=%o p=%o",
                        thid,evt,th_target,touched,pressed);
            if (th_timer) {
                clearTimeout(th_timer); th_timer=false;}
            else if (pressed) {released(pressed,evt);}
            if (reticle.live) reticle.highlight(false);
            pressed_at=touched=pressed=tap_target=false;
            if (holdclass)
                setTimeout(function(){dropClass(elt,holdclass);},20);
            th_targets=[];
            setTarget(false);}

        if (!(opts)) opts={};
        else if (!(opts.hasOwnProperty)) opts={touch: true};
        else {}

        fortouch=((opts.hasOwnProperty('fortouch'))?(opts.fortouch):
                  (default_opts.hasOwnProperty('fortouch'))?
                  (default_opts.fortouch):(false));
        holdmsecs=((opts.hasOwnProperty('holdmsecs'))?(opts.holdmsecs):
                    (default_opts.hasOwnProperty('holdmsecs'))?
                    (default_opts.holdmsecs):(150));
        movethresh=((opts.hasOwnProperty('movethresh'))?(opts.movethresh):
                    (default_opts.hasOwnProperty('movethresh'))?
                    (default_opts.movethresh):(20));
        taptapmsecs=((opts.hasOwnProperty('taptapmsecs'))&&
                      (opts.taptapmsecs));
        wanderthresh=((opts.hasOwnProperty('wanderthresh'))?(opts.wanderthresh):
                      (default_opts.hasOwnProperty('wanderthresh'))?
                      (default_opts.wanderthresh):(2000));
        override=((opts.hasOwnProperty('override'))?(opts.override):
                  (default_opts.hasOwnProperty('override'))?
                  (default_opts.override):(false));
        touchtoo=((opts.hasOwnProperty('touchtoo'))?(opts.touchtoo):
                  (default_opts.hasOwnProperty('touchtoo'))?
                  (default_opts.touchtoo):(false));
        min_swipe=((opts.hasOwnProperty('minswipe'))?(opts.minswipe):
                   (default_opts.hasOwnProperty('minswipe'))?
                   (default_opts.minswipe):(30));
        bubble=((opts.hasOwnProperty('bubble'))?(opts.bubble):
                (default_opts.hasOwnProperty('bubble'))?
                (default_opts.bubble):(false));
        maxtouches=((opts.hasOwnProperty('maxtouches'))?(opts.maxtouches):
                    (default_opts.hasOwnProperty('maxtouches'))?
                    (default_opts.maxtouches):(1));
        if ((taptapmsecs)&&(typeof taptapmsecs !== "number"))
            taptapmsecs=default_opts.taptapmsecs||200;
        scrolling=((opts.hasOwnProperty('scrolling'))?(opts.touch):(false));
        if (scrolling) {
            if (!(scrolling.nodeType)) scrolling=elt;
            if ((opts.hasOwProperty('scrollx'))?(opts.scrollx):(false))
                scroll_x=0; else scroll_x=-1;
            if ((opts.hasOwProperty('scrolly'))?(opts.scrolly):(true))
                scroll_y=0; else scroll_y=-1;}

        if (opts.hasOwnProperty('holdclass')) holdclass=opts.holdclass;
        else if (default_opts.hasOwnProperty('holdclass'))
            holdclass=default_opts.holdclass;
        else {}

        if (opts.hasOwnProperty('touchclass')) touchclass=opts.touchclass;
        else if (default_opts.hasOwnProperty('touchclass'))
            touchclass=default_opts.touchclass;
        else {}

        if (opts.hasOwnProperty('minmove')) minmove=opts.minmove;
        else if (default_opts.hasOwnProperty('minmove'))
            minmove=default_opts.minmove;
        else if (fortouch) minmove=2;
        else minmove=0;

        if (opts.hasOwnProperty('handlers'))
            this.handlers=opts.handlers;
        
        addClass(elt,"tapholder");
        
        if (!(fortouch)) fdjtDOM.addListener(elt,"mousemove",taphold_move);
        fdjtDOM.addListener(elt,"touchmove",taphold_move);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mousedown",taphold_down);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseout",taphold_mouseout);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseover",taphold_mouseover);
        fdjtDOM.addListener(elt,"touchstart",taphold_down);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseup",taphold_up);
        // fdjtDOM.addListener(elt,"click",taphold_click);
        fdjtDOM.addListener(elt,"touchend",taphold_up);
        fdjtDOM.addListener(elt,"touchcancel",taphold_cancel);        
        if (!(window_setup)) {
            if (!(default_opts.fortouch)) {
                fdjtDOM.addListener(window,"mousedown",global_mousedown);
                fdjtDOM.addListener(window,"mouseup",global_mouseup);
                fdjtDOM.addListener(window,"mouseout",global_mouseout);}
            // fdjtDOM.addListener(document,"keydown",taphold_keydown);
            // fdjtDOM.addListener(document,"keyup",taphold_keyup);
            window_setup=window;}

        this.elt=elt;
        this.serial=serial;
        this.opts={bubble: bubble,
                   override: override,
                   movethresh: movethresh,
                   holdmsecs: holdmsecs,
                   taptapmsecs: taptapmsecs};
        this.istouched=function(){return (touched);};
        this.ispressed=function(){return (pressed);};
        this.clear=function(){
            if ((pressed)&&(!(noslip))) slipped(pressed);
            pressed_at=touched=pressed=tap_target=false;
            cleartouch(true);
            setTarget(false);
            th_targets=[];};
        this.fakePress=function fakePress(evt,holdmsecs){
            start_x=target_x=touch_x=evt.clientX||getClientX(evt);
            start_y=target_y=touch_y=evt.clientY||getClientY(evt);
            touch_t=start_t=fdjtET();
            var target=document.elementFromPoint(start_x,start_y);
            if (!(target))
                fdjtLog("TapHold(%s): No target from %o,%o",
                        thid,start_x,start_y);
            setTarget(target); th_targets=[target];
            if ((trace)||(traceall))
                fdjtLog("TapHold/fakePress(%s) t=%o x=%o y=%o t=%o",
                        thid,th_target,start_x,start_y,start_t);
            startpress(evt,holdmsecs);};
        this.abort=abortpress;
        
        if ((trace)||(traceall))
            fdjtLog("New TapHold(%s) for %o: %o opts %j, trace=%o/%o",
                    thid,elt,th,opts||false,trace,traceall);
        
        return this;}

    TapHold.clear=function(){
        if (traceall) fdjtLog("TapHold.clear()");
        cleared=fdjtET();};

    function traceTapHold(flag){
        if (typeof flag === "undefined")
            return traceall;
        else {
            var cur=traceall;
            if (typeof flag==="number")
                traceall=flag;
            else if (flag)
                traceall=default_opts.traceall||2;
            else {}
            return cur;}}
    TapHold.trace=traceTapHold;

    TapHold.default_opts=default_opts;

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
