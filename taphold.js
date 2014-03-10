/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

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
    
    function getClientX(evt){
        if (typeof evt.clientX === "number") return evt.clientX;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        if (touches) return (touches[0].pageX-window.pageXOffset);
        else return false;}
    function getClientY(evt){
        if (typeof evt.clientY === "number") return evt.clientY;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        if (touches) return (touches[0].pageY-window.pageYOffset);
        else return false;}
    
    function synthesizeEvent(target,etype,th,orig,tx,ty,also){
        var serial=th.serial, trace=th.traced, handlers=th.handlers;
        var orig_target=(orig)&&(eTarget(orig));
        if (!(target)) target=orig_target;
        var evt = document.createEvent("UIEvent");
        var event_arg=
            (((orig)&&(orig.touches)&&(orig.touches.length))||
             ((orig)&&(orig.button))||
             0);
        evt.initUIEvent(etype, true, true,window,event_arg);
        evt.clientX=tx; evt.clientY=ty;
        if (also) {
            for (var prop in also) {
                if (also.hasOwnProperty(prop)) {
                    evt[prop]=also[prop];}}}
        if ((trace)||(traceall)) {
            if ((also)&&(also.startX))
                fdjtLog("TapHold/%s(%d) on %o @%d,%d/%d,%d from %o given %o",
                        etype,serial,target,tx,ty,also.startX,also.startY,
                        orig||"scratch",also);
            else if (also)
                fdjtLog("TapHold/%s(%d) on %o @%d,%d from %o given %o",
                        etype,serial,target,tx,ty,orig||"scratch",also);
            else fdjtLog("TapHold/%s(%d) on %o @%d,%d from %o",
                         etype,serial,target,tx,ty,orig||"scratch");}
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
        evt=evt||event;
        if (traceall) fdjtLog("TapHold/global/mouseup %o",evt);
        if (evt.button===1) mouse_down=false;}
    function global_mousedown(evt){
        evt=evt||event;
        if (traceall) fdjtLog("TapHold/global/mousedown %o",evt);
        if (evt.button===1) mouse_down=true;}
    function global_mouseout(evt){
        evt=evt||event;
        var target=eTarget(evt), rel=evt.relatedTarget||evt.toElement;
        if (traceall)
            fdjtLog("TapHold/global/mouseout %o %o==>%o",
                    evt,target,rel);
        if (target===document.documentElement)
            mouse_down=false;}


    function TapHold(elt,opts,fortouch,holdthresh,movethresh,taptapthresh,
                     wanderthresh,override,bubble,scrolling){
        if (!(elt)) {
            fdjtLog.warn("TapHold with no argument!");
            return;}
        
        if (!(this instanceof TapHold))
            return new TapHold(elt,opts);
        
        var th=this;
        var holdclass="tapholding";
        var touched=false;
        var pressed=false;
        var pressed_at=false;
        var tap_target=false;
        var th_target=false;
        var th_targets=[];
        var th_timer=false;
        var scroll_x=0, scroll_y=0;
        var start_x=false;
        var start_y=false;
        var start_t=false;
        var touch_x=false;
        var touch_y=false;
        var touch_t=0;
        var target_x=false, target_y=false, target_t=false;
        var minmove=2;
        var fdx=0, fdy=0;
        var noslip=false;
        var trace=0;
        
        // If this is true, second touches are turned into touchtoo events;
        //  otherwise, they start a new tap or hold
        var holdfast=false;

        var serial=serial_count++;

        var touchable=elt.getAttribute("data-touchable");
        if ((opts)&&(opts.touchable)) {
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
        if ((opts)&&(opts.touch_xoff)) fdx=opts.touch_xoff;
        if ((opts)&&(opts.touch_yoff)) fdy=opts.touch_yoff;

        if ((opts)&&(opts.hasOwnProperty("trace"))) {
            var opt_val=opts.trace;
            if (typeof opt_val==="number") trace=opt_val;
            else if (opt_val) trace=2;
            else trace=0;}
        else if (hasParent(elt,/\btracetaphold\d*\b/g)) {
            var trace_parent=getParent(elt,/\btracetaphold\d*\b/g);
            if (hasClass(trace_parent,"tracetaphold")) trace=1;
            else if (hasClass(trace_parent,"tracetaphold1")) trace=1;
            else if (hasClass(trace_parent,"tracetaphold2")) trace=2;
            else if (hasClass(trace_parent,"tracetaphold2")) trace=3;
            else trace=4;}
        else trace=0;

        var wander_timer=false;

        function cleartouch(){
            start_x=start_y=start_t=
                touch_x=touch_y=touch_t=
                target_x=target_y=target_t=false;
            touched=pressed=pressed_at=false;}

        function synthEvent(target,etype,th,orig,tx,ty,also){
            return synthesizeEvent(target,etype,th,orig,tx,ty,also);}

        function setTarget(t){
            if (((trace>2)||(traceall>2))||
                ((t!==th_target)&&((trace)||(traceall))))
                fdjtLog("TapHold/setTarget(%d) %o cur=%o",serial,t,th_target);
            if ((th_target)&&(th_target!==t)) dropClass(th_target,"tapholdtarget");
            if (t) addClass(t,"tapholdtarget");
            if ((t)&&(th_target)&&(t!==th_target)) {
                target_x=touch_x; target_y=touch_y; target_t=touch_t;}
            th_target=t;}

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
            if (typeof x === "undefined") x=touch_x;
            if (typeof y === "undefined") y=touch_y;
            if (holdclass)
                setTimeout(function(){dropClass(elt,holdclass);},20);
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
                setTimeout(function(){dropClass(elt,holdclass);},20);
            return synthEvent(target,"slip",th,evt,touch_x,touch_y,also);}
        function taptapped(target,evt){
            return synthEvent(target,"taptap",th,evt,
                              touch_x,touch_y,false,trace);}
        function tapheld(target,evt){
            return synthEvent(target,"taphold",th,evt,touch_x,touch_y,false);}
        function swiped(target,evt,sx,sy,cx,cy){
            var dx=cx-sx, dy=cy-sy;
            return synthEvent(target,"swipe",th,evt,cx,cy,
                                 {startX: sx,startY: sy,endX: cx,endY: cy,
                                  deltaX: dx,deltaY: dy});}
        
        function startpress(evt,to){
            if (!(to)) to=holdthresh||TapHold.interval||100;
            evt=evt||event;
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/startpress(%d) %o tht=%o timer=%o tt=%o touched=%o pressed=%o@%o timeout=%oms",
                        serial,evt,th_target,th_timer,tap_target,touched,
                        pressed,pressed_at,to);
            if ((tap_target)&&(th_timer)) {
                clearTimeout(th_timer); th_timer=false;}
            if ((touched)||(pressed)||(th_timer)) return;
            else if (!(th_target)) return;
            else {touched=th_target; pressed=false;}
            if (reticle.live) reticle.highlight(true);
            pressed_at=fdjtTime(); 
            if (th_timer) clearTimeout(th_timer);
            th_timer=setTimeout((function(){
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/startpress/timeout(%d) (%dms) %o",
                            serial,to,evt);
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
                if (tap_target) {tapheld(th_target,evt); tap_target=false;}
                else held(th_target,evt);
                if (th_timer) clearTimeout(th_timer);
                th_timer=false;
                touched=false;}),
                                to);}
        function endpress(evt){
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/endpress(%d) %o t=%o p=%o tch=%o tm=%o ttt=%o/%o",
                        serial,evt,th_target,pressed,touched,th_timer,
                        tap_target,taptapthresh||false);
            if ((!(pressed))&&(!(touched))&&(!(th_timer))) {
                cleartouch();
                return;}
            var x=touch_x, y=touch_y;
            if (th_timer) {
                clearTimeout(th_timer); th_timer=false;
                if (reticle.live) 
                    setTimeout(function(){reticle.highlight(false);},1500);
                if (th_target===touched) {
                    if ((tap_target)&&(tap_target===th_target)) {
                        tap_target=false;
                        taptapped(th_target,evt);}
                    else if (taptapthresh) {
                        tap_target=th_target;
                        if ((trace>1)||(traceall>1))
                            fdjtLog("TapHold/taptap(%d) waiting %d on %o",
                                    serial,taptapthresh,tap_target);
                        if (th_timer) clearTimeout(th_timer);
                        th_timer=setTimeout(function(){
                            var tmp=tap_target; tap_target=false;
                            th_timer=false;
                            if ((trace)||(traceall))
                                fdjtLog("TapHold/singletap(%d) on %o",serial,tmp);
                            tapped(tmp,evt,x,y);},
                                            taptapthresh);}
                    else tapped(th_target,evt,x,y);}
                else if (noslip) {}
                else slipped(th_target,evt);}
            else if (pressed) {
                var geom=fdjtDOM.getGeometry(elt);
                if ((x>=geom.left)&&(x<=geom.right)&&(y>=geom.top)&&(y<=geom.bottom))
                    released(pressed,evt,x,y);
                else if (noslip)
                    released(pressed,evt,x,y);
                else slipped(th_target,evt,x,y);}
            else {}
            if (reticle.live) reticle.highlight(false);
            cleartouch();
            touched=false; pressed=false; pressed_at=false;
            setTarget(false);
            if (holdclass)
                setTimeout(function(){dropClass(elt,holdclass);},20);
            th_targets=[];}
        function abortpress(evt,why){
            if ((trace)||(traceall))
                fdjtLog("TapHold/abort%s(%d) %o: th=%o t=%o p=%o",
                        ((why)?("("+why+")"):("")),serial,
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
            evt=evt||event;
            var to=evt.toElement||evt.relatedTarget;
            if (wander_timer) return;
            if (!(th_target)) return;
            if ((pressed)&&(!(hasParent(to,elt)))) {
                wander_timer=setTimeout(function(){
                    if (!(noslip))
                        slipped(pressed,evt,{relatedTarget: to});
                    abortpress(evt,"taphold_mouseout");},
                                          wanderthresh||2000);}}

        function taphold_mouseover(evt){
            evt=evt||event;
            if (wander_timer) {
                clearTimeout(wander_timer);
                wander_timer=false;}}

        function taphold_move(evt){
            evt=evt||event;
            var target;
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            if ((scrolling)&&(evt.touches)) {
                if (scroll_x>=0) 
                    scrolling.scrollLeft=
                    scroll_x-(evt.touches[0].pageX-window.pageXOffset);
                if (scroll_y>=0)
                    scrolling.scrollTop=
                    scroll_y-(evt.touches[0].pageY-window.pageYOffset);}
            if ((pressed)&&(cleared>start_t)) {
                abortpress(evt,"move/cleared");
                return;}
            if (!(mouse_down)) {
                abortpress(evt,"mousemove/up");
                return;}
            
            // if (target!==th_target) fdjtLog("New target %o",target);
            var x=evt.clientX||getClientX(evt);
            var y=evt.clientY||getClientY(evt);
            if ((evt.touches)||(fdx)||(fdy)) {
                x=x+fdx; y=y+fdy;
                target=document.elementFromPoint(x,y);}
            else target=eTarget(evt);
            if (!(target)) return;
            var holder=getParent(target,".tapholder");
            // fdjtLog("taphold_move %o %d,%d %o %o",evt,x,y,target,holder);
            if (holder!==elt) {
                if ((trace>2)||(traceall>2)) {
                    trace_ignore_move(evt,serial,elt,holder,th_target,target,
                                      start_x,start_y,target_x,target_y,
                                      touch_x,touch_y);}
                if (th_target) {
                    if ((trace)||(traceall))
                        fdjtLog("setWanderTimeout(%d): h=%o!=elt=%o",
                                serial,holder,elt);
                    wander_timer=setTimeout(function(){
                        abortpress(evt,"taphold_wander_timeout");},
                                            wanderthresh||2000);
                    if (pressed) {
                        if (!(noslip))
                            slipped(pressed,evt,{relatedTarget: target});
                        setTarget(false);}}
                return;}
            else if (wander_timer) {
                clearTimeout(wander_timer); wander_timer=false;
                if ((trace>1)||(traceall>1))
                    fdjtLog("Wander return(%d) %o pressed=%o, target=%o",
                            serial,evt,pressed,th_target);
                if ((pressed)&&(!(th_target))) {
                    setTarget(pressed);
                    held(pressed,evt);}}
            else {}
            // If touched is false, the tap/hold was aborted somehow
            if (!((touched)||(pressed))) return;
            
            var distance=(Math.abs(x-target_x))+(Math.abs(y-target_y));
            var delta=(Math.abs(x-touch_x))+(Math.abs(y-touch_y));
            var dt=(fdjtTime()-touch_t)/1000;
            if ((movethresh)&&(start_x)&&(start_y)&&(th_timer)&&
                (distance>movethresh)) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/move/cancel(%d) s=%d,%d tt=%d,%d t=%d,%d c=%d,%d d=%d thresh=%o, md=%o, event=%o",
                            serial,start_x,start_y,target_x,target_y,touch_x,touch_y,x,y,
                            distance,movethresh,mouse_down,evt);
                abortpress(evt,"movefar");
                if (th_timer) clearTimeout(th_timer);
                pressed_at=touched=th_timer=pressed=false; th_targets=[];
                swiped(target,evt,start_x,start_y,x,y);
                setTarget(false);
                return;}
            else if ((delta<(minmove*10))&&(dt>0)&&((delta/dt)<minmove)) {
                if ((trace>2)||(traceall>2))
                    fdjtLog("TapHold/move/ignore(%d) s=%d,%d t=%d,%d c=%d,%d total=%d/%o, local=%d/%o, md=%o",
                            serial,start_x,start_y,touch_x,touch_y,x,y,
                            distance,movethresh,delta,minmove,mouse_down);
                return;}
            else {
                if ((trace>2)||(traceall>2))
                    fdjtLog("TapHold/move(%d) s=%d,%d t=%d,%d c=%d,%d total=%d/%o, local=%d/%o, md=%o",
                            serial,start_x,start_y,touch_x,touch_y,x,y,
                            distance,movethresh,delta,minmove,mouse_down);
                touch_x=x; touch_y=y; touch_t=fdjtTime();
                target=getParent(target,touchable);}
            if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if (!(target)) return;
            if (hasParent(target,".tapholder")) setTarget(target);
            if ((evt.touches)&&(touched)&&(!(pressed))&&
                (th_targets[th_targets.length-1]!==th_target))
                th_targets.push(th_target);
            if ((evt.touches)&&(evt.touches.length)&&(evt.touches.length>1))
                return;
            else {
                if (reticle.live) reticle.onmousemove(evt,touch_x,touch_y);}
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
        function trace_ignore_move(evt,serial,elt,holder,th_target,target,
                                   start_x,start_y,target_x,target_y,
                                   touch_x,touch_y) {
            fdjtLog(
                "TapHold/move%s/farout(%d) %o %o -> %o s=%d,%d tt=%d,%d t=%d,%d",
                ((mouse_down)?("/md"):("")),serial,
                evt,th_target,target,start_x,start_y,
                target_x,target_y,touch_x,touch_y);
            fdjtLog("TapHold/move/farout(%d) target in %o, elt is %o",
                    serial,holder,elt);}

        function taphold_down(evt,holdthresh){
            evt=evt||event;
            if ((evt.ctrlKey)||
                (evt.altKey)||(evt.metaKey)||
                (evt.button)||
                ((evt.which)&&(evt.which>1)))
                return;
            mouse_down=true; cleared=0;
            touch_x=(evt.clientX||getClientX(evt)||touch_x)+fdx;
            touch_y=(evt.clientY||getClientY(evt)||touch_y)+fdy;
            start_x=target_x=touch_x; start_y=target_y=touch_y;
            target_t=touch_t=fdjtTime();
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            var new_event=false;
            var target=(((fdx)||(fdy))?
                        (document.elementFromPoint(touch_x,touch_y)):
                        (eTarget(evt)));
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/down/ignore(%d) %o tht=%o target=%o holder=%o elt=%o",
                            serial,evt,th_target,target,holder,elt);
                return;}

            if (target) target=getParent(target,touchable);
            if ((scrolling)&&(evt.touches)) {
                if (scroll_x>=0)
                    scroll_x=scrolling.scrollLeft+(evt.touches[0].pageX-window.pageXOffset);
                if (scroll_y>=0)
                    scroll_y=scrolling.scrollLeft+(evt.touches[0].pageY-window.pageYOffset);}
            if (evt.touches) {
                target=document.elementFromPoint(touch_x,touch_y);}
            // if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if ((trace>1)||(traceall>1))
                fdjtLog(
                    "TapHold/down(%d) %o tht=%o trg=%o s=%o,%o,%o t=%o,%o m=%o tch=%o prs=%o ttt=%o",
                    serial,evt,th_target,target,
                    start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                    touched,pressed,taptapthresh||false);
            
            if ((evt.touches)&&(th_target)) {
                var cur_holder=getParent(elt,".tapholder"), touch=evt.changedTouches[0];
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold(%d) second touch on %o (in %o) after %o (in %o)",
                            serial,target,holder,th_target,cur_holder,(cur_holder===holder));
                if ((holdfast)&&(cur_holder===holder)) {
                    if ((trace>1)||(traceall>1))
                        fdjtLog("TapHold(%d) holdfast with touchtoo on %o after %o: %o",
                                serial,target,th_target,evt);
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
                else if ((cur_holder)&&(holder)) {
                    if ((trace>1)||(traceall>1))
                        fdjtLog("TapHold(%d) Clearing taphold on %o, redispatching %o to %o",
                                serial,th_target,evt,target);
                    new_event=document.createEvent('TouchEvent');
                    new_event.initTouchEvent(
                        evt.type,true,true,window,0,
                        touch.screenX,touch.screenY,touch.clientX,touch.clientY,
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
                fdjtLog("TapHold/down(%d) %o t=%o x=%o y=%o t=%o touched=%o",
                        serial,evt,th_target,start_x,start_y,start_t,touched);
            if ((untouchable)&&(untouchable(evt))) return;
            if (!(touched)) startpress(evt,holdthresh);}

        function taphold_up(evt){
            evt=evt||event;
            mouse_down=false;
            if (cleared>start_t) {
                abortpress(evt,"up");
                return;}
            if ((!(bubble))) noBubble(evt);
            if (override) noDefault(evt);
            var target=eTarget(evt);
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((trace>1)||(traceall>1))
                    fdjtLog("TapHold/up/ignore(%d) %o tht=%o target=%o holder=%o elt=%o",
                            serial,evt,th_target,target,holder,elt);
                return;}
            if (target) target=getParent(target,touchable);
            touch_x=(evt.clientX||getClientX(evt)||touch_x)+fdx;
            touch_y=(evt.clientY||getClientY(evt)||touch_y)+fdy;
            touch_t=fdjtTime();
            if ((!(target))||(fdx)||(fdy))
                target=getRealTarget(elt,touchable,touch_x,touch_y);
            if ((trace>1)||(traceall>1))
                fdjtLog("TapHold/up(%d) %o tht=%o s=%o,%o,%o t=%o,%o m=%o touched=%o pressed=%o ttt=%o",
                        serial,evt,th_target,
                        start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                        touched,pressed,
                        taptapthresh||false);
            if ((evt.touches)&&(evt.touches.length)&&
                (evt.touches.length>1))
                return;
            if ((untouchable)&&(untouchable(evt))) return;
            if ((!(mouse_down))&&((touched)||(pressed))) {
                endpress(evt,taptapthresh);}
            else {}
            cleartouch();}

        function taphold_cancel(evt){
            if ((trace)||(traceall))
                fdjtLog("TapHold/cancel(%d) %o: th=%o t=%o p=%o",
                        serial,evt,th_target,touched,pressed);
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
        holdthresh=((opts.hasOwnProperty('holdthresh'))?(opts.holdthresh):
                    (default_opts.hasOwnProperty('holdthresh'))?
                    (default_opts.holdthresh):(200));
        movethresh=((opts.hasOwnProperty('movethresh'))?(opts.movethresh):
                    (default_opts.hasOwnProperty('movethresh'))?
                    (default_opts.movethresh):(20));
        taptapthresh=((opts.hasOwnProperty('taptapthresh'))?(opts.taptapthresh):
                      (default_opts.hasOwnProperty('taptapthresh'))?
                      (default_opts.taptapthresh):(false));
        wanderthresh=((opts.hasOwnProperty('wanderthresh'))?(opts.wanderthresh):
                     (default_opts.hasOwnProperty('wanderthresh'))?
                     (default_opts.wanderthresh):(2000));
        override=((opts.hasOwnProperty('override'))?(opts.override):
                   (default_opts.hasOwnProperty('override'))?
                   (default_opts.override):(false));
        holdfast=((opts.hasOwnProperty('holdfast'))?(opts.holdfast):
                   (default_opts.hasOwnProperty('holdfast'))?
                   (default_opts.holdfast):(false));
        bubble=((opts.hasOwnProperty('bubble'))?(opts.bubble):
                (default_opts.hasOwnProperty('bubble'))?
                (default_opts.bubble):(false));
        if ((taptapthresh)&&(typeof taptapthresh !== "number"))
            taptapthresh=200;
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
            if (!(default_opts.touch)) {
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
                   holdthresh: holdthresh,
                   taptapthresh: taptapthresh};
        this.istouched=function(){return (touched);};
        this.ispressed=function(){return (pressed);};
        this.clear=function(){
            if ((pressed)&&(!(noslip))) slipped(pressed);
            pressed_at=touched=pressed=tap_target=false;
            cleartouch();
            if (th_timer) {clearTimeout(th_timer); th_timer=false;}
            setTarget(false);
            th_targets=[];};
        this.fakePress=function fakePress(evt,holdthresh){
            start_x=target_x=touch_x=evt.clientX||getClientX(evt);
            start_y=target_y=touch_y=evt.clientY||getClientY(evt);
            touch_t=start_t=fdjtET();
            var target=document.elementFromPoint(start_x,start_y);
            if (!(target))
                fdjtLog("TapHold(%d): No target from %o,%o",
                        serial,start_x,start_y);
            setTarget(target); th_targets=[target];
            if ((trace)||(traceall))
                fdjtLog("TapHold/fakePress(%d) t=%o x=%o y=%o t=%o",
                        serial,th_target,start_x,start_y,start_t);
            startpress(evt,holdthresh);};
        this.abort=abortpress;
        
        if ((trace)||(traceall))
            fdjtLog("New TapHold(%d) for %o: %o opts %j, trace=%o/%o",
                    serial,elt,th,opts||false,trace,traceall);
        
        return this;}

    TapHold.default_opts=default_opts;

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

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
