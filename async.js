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

fdjt.Async=
    (function (){
        "use strict";
        /* global
           setTimeout: false, clearTimeout: false,
           Promise: false */

	// This should so something real
	function fdjtAsync(fn,args){
	    function async_call(resolve,reject){
		function doit(){
		    var value;
		    try {
			if (args) value=fn.call(null,args);
			else value=fn();
			resolve(value);}
		    catch (ex) {reject(ex);}}
		setTimeout(doit,1);}
	    return new Promise(async_call);}

        function getnow() {return (new Date()).getTime();}

        function timeslice(fcns,slice,space,stop,done,fail){
            var timer=false;
            if (typeof slice !== 'number') slice=100;
            if (typeof space !== 'number') space=100;
            var i=0; var lim=fcns.length;
            var slicefn=function(){
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
                if ((i<lim)&&((!(done))||(!(done()))))
                    timer=setTimeout(slicefn,nextspace||space);
                else {
                    clearTimeout(timer); 
                    timer=false;
                    done(false);}};
            return slicefn();}
        fdjtAsync.timeslice=function(fcns,opts){
            if (!(opts)) opts={};
            var slice=opts.slice||100, space=opts.space||100;
            var stop=opts.stop||false;
            function timeslicing(success,failure){
                timeslice(fcns,slice,space,stop,success,failure);}
            return new Promise(timeslicing);};

        function slowmap(fn,vec,watch,done,failed,slice,space,watch_slice){
            var i=0; var lim=vec.length; var chunks=0;
            var used=0; var zerostart=getnow();
            var timer=false;
            if (!(slice)) slice=100;
            if (!(space)) space=slice;
            if (!(watch_slice)) watch_slice=0;
            var stepfn=function(){
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
                        fn(elt);
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
                        timer=setTimeout(stepfn,space);}
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
                catch (ex) {if (failed) failed();}};
            timer=setTimeout(stepfn,space);}
        fdjtAsync.slowmap=function(fcn,vec,opts){
            if (!(opts)) opts={};
            var slice=opts.slice, space=opts.space;
            var watchfn=opts.watchfn, watch_slice=opts.watch;
            var donefn=opts.done;
            function slowmapping(resolve,reject){
                slowmap(fcn,vec,watchfn,
                        ((donefn)?(function(){
                            donefn(); if (resolve) resolve(vec);}):
                         (resolve)),
                        reject,
                        slice,space,watch_slice);}
            if (watch_slice<1) watch_slice=vec.length*watch_slice;
            return new Promise(slowmapping);};

        return fdjtAsync;})();
