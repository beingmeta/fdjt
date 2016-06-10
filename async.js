/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/async.js ###################### */

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

/* Time functions */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.Async=fdjt.ASync=fdjt.async=
    (function (){
        "use strict";
        /* global
           setTimeout: false, clearTimeout: false,
           Promise: false */

        function fdjtAsync(fn,args){
            function async_call(resolve,reject){
                function async_doit(){
                    var value;
                    try {
                        if (args) value=fn.call(null,args);
                        else value=fn();
                        resolve(value);}
                    catch (ex) {reject(ex);}}
                setTimeout(async_doit,1);}
            return new Promise(async_call);}

        function getnow() {return (new Date()).getTime();}
        
        function timeslice(fcns,slice,space,stop,done,fail){
            var timer=false;
            function slicefn(){
                var timelim=getnow()+slice;
                var nextspace=false;
                while (i<lim) {
                    var fcn=fcns[i++];
                    if (!(fcn)) continue;
                    else if (typeof fcn === 'number') {
                        nextspace=fcn; break;}
                    else {
                        try {fcn();} catch (ex) {fail(ex);}}
                    if (getnow()>timelim) break;}
                if ((i<lim)&&((!(stop))||(!(stop()))))
                    timer=setTimeout(slicefn,nextspace||space);
                else {
                    clearTimeout(timer); 
                    timer=false;
                    done(false);}}
            if (typeof slice !== 'number') slice=100;
            if (typeof space !== 'number') space=100;
            var i=0; var lim=fcns.length;
            return slicefn();}
        function timeslice_method(fcns,opts){
            if (!(opts)) opts={};
            var slice=opts.slice||100, space=opts.space||100;
            var stop=opts.stop||false;
            function timeslicing(success,failure){
                timeslice(fcns,slice,space,stop,success,failure);}
            return new Promise(timeslicing);}
        fdjtAsync.timeslice=timeslice_method;

        function slowmap(fn,vec,watch,done,failed,slice,space,onerr,watch_slice){
            var i=0; var lim=vec.length; var chunks=0;
            var used=0; var zerostart=getnow();
            var timer=false;
            if (!(slice)) slice=20;
            if (!(space)) space=10;
            if (!(watch_slice)) watch_slice=0;
            function slowmap_stepfn(){
                try {
                    var started=getnow(); var now=started;
                    var stopat=started+slice;
                    if (watch)
                        watch(((i===0)?'start':'resume'),i,lim,chunks,used,
                              zerostart);
                    while ((i<lim)&&((now=getnow())<stopat)) {
                        var elt=vec[i];
                        if ((watch)&&(((watch_slice)&&((i%watch_slice)===0))||
                                      (i+1===lim)))
                            watch('element',i,lim,elt,used,now-zerostart);
                        try {fn(elt);}
                        catch (ex) {
                            var exdata={elt: elt,i: i,lim: lim,vec: vec};
                            if ((onerr)&&(onerr(ex,elt,exdata))) continue;
                            if (failed) return failed(ex);
                            else throw ex;}
                        if ((watch)&&(((watch_slice)&&((i%watch_slice)===0))||
                                      (i+1===lim)))
                            watch('after',i,lim,elt,used+(getnow()-started),
                                  zerostart,getnow()-now);
                        i++;}
                    chunks=chunks+1;
                    if (i<lim) {
                        used=used+(now-started);
                        if (watch) watch('suspend',i,lim,chunks,used,
                                         zerostart);
                        timer=setTimeout(slowmap_stepfn,space);}
                    else {
                        now=getnow(); used=used+(now-started);
                        clearTimeout(timer); timer=false;
                        if (watch)
                            watch('finishing',i,lim,chunks,used,zerostart);
                        var donetime=((done)&&(getnow()-now));
                        now=getnow(); used=used+(now-started);
                        if (watch)
                            watch('done',i,lim,chunks,used,zerostart,donetime);
                        if ((done)&&(done.call)) 
                            done(vec,now-zerostart,used);}}
                catch (ex) {if (failed) failed(ex);}}
            timer=setTimeout(slowmap_stepfn,space);}
        function slowmap_handler(fcn,vec,opts){
            if (!(opts)) opts={};
            var slice=opts.slice, space=opts.space, onerr=opts.onerr;
            var watchfn=opts.watchfn, watch_slice=opts.watch;
            var sync=((opts.hasOwnProperty("sync"))?(opts.sync):
                      ((opts.hasOwnProperty("async"))?(!(opts.async)):
                       (false)));
            var donefn=opts.done;
            function slowmapping(resolve,reject){
                if (sync) {
                    var i=0, lim=vec.length; while (i<lim) {
                        var elt=vec[i++];
                        try { fcn(vec[elt]); }
                        catch (ex) {
                            var exdata={elt: elt,i: i,lim: lim,vec: vec};
                            if ((onerr)&&(onerr(ex,elt,exdata))) continue;
                            if (reject) return reject(ex);
                            else throw ex;}}
                    if (resolve) resolve(vec);}
                else slowmap(fcn,vec,watchfn,
                             ((donefn)?(function(){
                                 donefn(); if (resolve) resolve(vec);}):
                              (resolve)),
                             reject,
                             slice,space,onerr,watch_slice);}
            if (watch_slice<1) watch_slice=vec.length*watch_slice;
            return new Promise(slowmapping);}
        fdjtAsync.slowmap=slowmap_handler;
        
        // Returns a function, that, as long as it continues to be
        // invoked, will not be triggered. The function will be called
        // after it stops being called for N milliseconds. If
        // `immediate` is passed, trigger the function on the leading
        // edge, instead of the trailing.
        function debounce(func, wait, immediate) {
            var timeout;
            return function debounced() {
                var context = this, args = arguments;
                var later = function debounce_later() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        }
        fdjtAsync.debounce=debounce;

        function poll(fn, callback, errback, timeout, interval) {
            var endTime = Number(new Date()) + (timeout || 2000);
            interval = interval || 100;

            (function p() {
                // If the condition is met, we're done! 
                if(fn()) {
                    callback();
                }
                // If the condition isn't met but the timeout hasn't elapsed, go again
                else if (Number(new Date()) < endTime) {
                    setTimeout(p, interval);
                }
                // Didn't match and too much time, reject!
                else {
                    errback(new Error('timed out for ' + fn + ': ' + arguments));
                }
            })();
        }
        fdjtAsync.poll=poll;

        function once(fn, context) { 
            var result;

            return function justonce() { 
                if(fn) {
                    result = fn.apply(context || this, arguments);
                    fn = null;
                }

                return result;
            };
        }
        fdjtAsync.once=once;

        return fdjtAsync;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
