/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/state.js ###################### */

/* Copyright (C) 2009-2013 beingmeta, inc.
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
/* jshint browser: true, sub: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.State=
    (function(){
        "use strict";
        var fdjtLog=fdjt.Log;

        function fdjtState(name,val,persist){
            if (arguments.length===1)
                return ((window.sessionStorage)&&(getSession(name)))||
                ((window.sessionStorage)&&(getLocal(name)))||
                getCookie(name);
            else if (persist)
                if (window.localStorage)
                    if (val) setLocal(name,val);
            else dropLocal(name);
            else {
                var domain=fdjtState.domain||location.hostname;
                var path=fdjtState.path||"/";
                var duration=fdjtState.duration||(3600*24*365*7);
                if (val) setCookie(name,val,duration,path,domain);
                else clearCookie(name,path,domain);}
            else if (val)
                if (window.sessionStorage) setSession(name,val);
            else setCookie(name,val);
            else if (window.sessionStorage) dropSession(name);
            else clearCookie(name);}
        fdjtState.domain=false;
        fdjtState.path=false;
        fdjtState.duration=false;

        /* Old-school cookies */

        function getCookie(name,parse){
            try {
                var cookies=document.cookie;
                var namepat=new RegExp("(^|(; ))"+name+"=","g");
                var pos=cookies.search(namepat);
                var valuestring;
                if (pos>=0) {
                    var start=cookies.indexOf('=',pos)+1;
                    var end=cookies.indexOf(';',start);
                    if (end>0) valuestring=cookies.slice(start,end);
                    else valuestring=cookies.slice(start);}
                else return false;
                if (parse)
                    return JSON.parse(decodeURIComponent(valuestring));
                else return decodeURIComponent(valuestring);}
            catch (ex) {
                return false;}}
        fdjtState.getCookie=getCookie;

        function setCookie(name,value,expires,path,domain){
            try {
                if (value) {
                    var valuestring=
                        ((typeof value === 'string') ? (value) :
                         (value.toJSON) ? (value.toJSON()) :
                         (value.toString) ? (value.toString()) : (value));
                    var cookietext=name+"="+encodeURIComponent(valuestring);
                    if (expires)
                        if (typeof(expires)==='string')
                            cookietext=cookietext+'; '+expires;
                    else if (expires.toGMTString)
                        cookietext=cookietext+"; expires="+expires.toGMTString();
                    else if (typeof(expires)==='number')
                        if (expires>0) {
                            var now=new Date();
                            now.setTime(now.getTime()+expires);
                            cookietext=cookietext+"; expires="+now.toGMTString;}
                    else cookietext=cookietext+"; expires=Sun 1 Jan 2000 00:00:00 UTC";
                    else {}
                    if (path) cookietext=cookietext+"; path="+path;
                    // This certainly doesn't work generally and might not work ever
                    if (domain) cookietext=cookietext+"; domain="+domain;
                    // fdjtTrace("Setting cookie %o cookietext=%o",name,cookietext);
                    document.cookie=cookietext;}
                else clearCookie(name,path,domain);}
            catch (ex) {
                fdjtLog.warn("Error setting cookie %s",name);}}
        fdjtState.setCookie=setCookie;
        
        function clearCookie(name,path,domain){
            try {
                var cookietext=encodeURIComponent(name)+
                    "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                if (path) cookietext=cookietext=cookietext+"; path="+path;
                if (domain) cookietext=cookietext=cookietext+"; domain="+domain;
                document.cookie=cookietext;}
            catch (ex) {
                fdjtLog.warn("Error clearing cookie %s: %s",
                             name,ex);}
            if (getCookie(name)) {
                var altcookietext=encodeURIComponent(name)+
                    "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie=altcookietext;}}
        fdjtState.clearCookie=clearCookie;

        /* Session storage */

        function setSession(name,val,unparse){
            if (unparse) val=JSON.stringify(val);
            if (window.sessionStorage)
                window.sessionStorage[name]=val;
            else setCookie(name,val);}
        fdjtState.setSession=setSession;

        function getSession(name,parse){
            var val=((window.sessionStorage)?
                     (window.sessionStorage[name]):
                     (getCookie(name)));
            if (val)
                if (parse) return JSON.parse(val); else return val;
            else return false;}
        fdjtState.getSession=getSession;

        function dropSession(name){
            if (window.sessionStorage)
                return window.sessionStorage.removeItem(name);
            else clearCookie(name);}
        fdjtState.dropSession=dropSession;

        /* Local storage (persists between sessions) */

        function setLocal(name,val,unparse){
            if (!(name)) throw { error: "bad name",name: name};
            if (unparse) val=JSON.stringify(val);
            if (window.localStorage) {
                if (name instanceof RegExp) {
                    var keys=[];
                    var storage=window.localStorage;
                    var i=0; var lim=storage.length;
                    while (i<lim) {
                        var key=storage.key(i++);
                        if (key.search(name)>=0) keys.push(key);}
                    i=0; lim=keys.length; while (i<lim) {
                        storage[keys[i++]]=val;}}
                else window.localStorage[name]=val;}}
        fdjtState.setLocal=setLocal;

        function getLocal(name,parse){
            if (!(name)) throw { error: "bad name",name: name};
            else if (window.localStorage) {
                if (name instanceof RegExp) {
                    var storage=window.localStorage;
                    var i=0; var lim=storage.length;
                    while (i<lim) {
                        var key=storage.key(i++);
                        if (key.search(name)>=0) {
                            return ((parse)?(JSON.parse(storage[key])):(storage[key]));}}
                    return false;}
                else {
                    var val=window.localStorage[name];
                    if (val)
                        if (parse) return JSON.parse(val); else return val;
                    else return false;}}
            else return false;}
        fdjtState.getLocal=getLocal;

        function findLocal(name,val,parse){
            if (window.localStorage) {
                var result={};
                var storage=window.localStorage;
                var i=0; var lim=storage.length;
                while (i<lim) {
                    var key=storage.key(i++);
                    if ((!(name))||(key.search(name)>=0)) {
                        var v=storage[key];
                        if ((!(val))||(v.search(val)>=0)) {
                            if (parse) {
                                try {v=JSON.parse(v);} catch (ex) {}}
                            result[key]=v;}}}
                return result;}
            else return false;}
        fdjtState.findLocal=findLocal;

        function dropLocal(name){
            if (window.localStorage) {
                if (name instanceof RegExp) {
                    var drop=[];
                    var storage=window.localStorage;
                    var i=0; var lim=storage.length;
                    while (i<lim) {
                        var key=storage.key(i++);
                        if (key.search(name)>=0) drop.push(key);}
                    i=0; lim=drop.length; while (i<lim) {
                        storage.removeItem(drop[i++]);}}
                else return window.localStorage.removeItem(name);}
            else return false;}
        fdjtState.dropLocal=dropLocal;
        
        function listLocal(){
            var keys=[];
            if (window.localStorage) {
                var storage=window.localStorage;
                var i=0; var lim=storage.length;
                while (i<lim) keys.push(storage.key(i++));}
            return keys;}
        fdjtState.listLocal=listLocal;

        function clearLocal(){
            if (window.localStorage) {
                var storage=window.localStorage;
                var i=0; var lim=storage.length;
                var keys=[];
                while (i<lim) keys.push(storage.key(i++));
                i=0; while (i<lim) storage.removeItem(keys[i++]);}}
        fdjtState.clearLocal=clearLocal;

        /* Gets arguments from the query string */
        function getParam(from,name,multiple,matchcase,verbatim,start){
            var results=[];
            var ename=encodeURIComponent(name);
            var namepat=new RegExp("(&|^)"+ename+"(=|&|$)",
                                   ((matchcase)?"g":"gi"));
            start=from.search(namepat);
            while (start>=0) {
                // Skip over separator if non-initial
                var valstart=start+ename.length;
                var valstring=from.slice(valstart+1);
                var end=valstring.search(/(&|$)/g);
                if (from[valstart]==="=") {
                    if (end<=0) {
                        results.push("");
                        if (!(multiple)) break;}
                    else {
                        results.push(valstring.slice(0,end));
                        end=end+valstart+1;
                        if (!(multiple)) break;}}
                else if (multiple) 
                    results.push(from.slice(start,end));
                else if (verbatim) 
                    return from.slice(start,end);
                else return querydecode(from.slice(start,end));
                if (end>0) {
                    from=from.slice(end);
                    start=from.search(namepat);}}
            if (!(verbatim)) {
                var i=0; var lim=results.length;
                while (i<lim) {results[i]=querydecode(results[i]); i++;}}
            if (multiple) return results;
            else if (results.length)
                return results[0];
            else return false;}
        fdjtState.getParam=getParam;

        function getQuery(name,multiple,matchcase,verbatim){
            if (!(location.search))
                if (multiple) return [];
            else return false;
            var from=location.search;
            if (from[0]==="?") from=from.slice(1);
            return getParam(from,name,multiple,matchcase,verbatim);}
        fdjtState.getQuery=getQuery;
        
        function getHash(name,multiple,matchcase,verbatim){
            if (!(location.hash))
                if (multiple) return [];
            else return false;
            var from=location.hash;
            if (from[0]==="#") from=from.slice(1);
            return getParam(location.hash,name,multiple,matchcase,verbatim);}
        fdjtState.getHash=getHash;

        function querydecode(string){
            if (decodeURIComponent)
                return decodeURIComponent(string);
            else return string.replace
            (/%3A/gi,":").replace
            (/%2F/gi,"/").replace
            (/%3F/gi,"?").replace
            (/%3D/gi,"=").replace
            (/%20/gi," ").replace
            (/%40/gi,"@").replace
            (/%23/gi,"#");}

        function test_opt(pos,neg){
            var pospat=((pos)&&(new RegExp("\\b"+pos+"\\b")));
            var negpat=((neg)&&negative_opt_pat(neg));
            var i=2; while (i<arguments.length) {
                var arg=arguments[i++];
                if (!(arg)) continue;
                else if (typeof arg === 'string')
                    if ((pospat)&&(arg.search(pospat)>=0)) return true;
                else if ((negpat)&&(arg.search(negpat)>=0)) return false;
                else continue;
                else if (arg.length) {
                    var j=0; var len=arg.length;
                    while (j<len)
                        if ((pos)&&(arg[j]===pos)) return true;
                    else if ((neg)&&(arg[j]===neg)) return false;
                    else j++;
                    return false;}
                else continue;}
            return false;}
        fdjtState.testOption=test_opt;

        function negative_opt_pat(neg){
            if (!(neg)) return neg;
            else if (typeof neg === 'string')
                return (new RegExp("\\b"+neg+"\\b","gi"));
            else if (neg.length) {
                var rule="\\b(";
                var i=0; while (i<neg.length) {
                    var name=neg[i];
                    if (i>0) rule=rule+"|";
                    rule=rule+"("+name+")";
                    i++;}
                rule=rule+")\\b";
                return new RegExp(rule,"gi");}
            else return false;}

        fdjtState.argVec=function(argobj,start){
            var i=start||0;
            var result=new Array(argobj.length-i);
            while (i<argobj.length) {
                result[i-start]=argobj[i]; i++;}
            return result;};

        var zeros="000000000000000000000000000000000000000000000000000000000000000";
        function zeropad(string,len){
            if (string.length===len) return string;
            else if (string.length>len) return string.slice(0,len);
            else return zeros.slice(0,len-string.length)+string;}
        
        // This is a random nodeid used to generate UUIDs
        //  We use it because we can't access the MAC address
        var nodeid=
            zeropad(((Math.floor(Math.random()*65536)).toString(16)+
                     (Math.floor(Math.random()*65536)).toString(16)+
                     (Math.floor(Math.random()*65536)).toString(16)+
                     (Math.floor(Math.random()*65536)|0x01)).toString(16),
                    12);
        
        var clockid=Math.floor(Math.random()*16384); var msid=1;
        var last_time=new Date().getTime();
        
        fdjtState.getNodeID=function(){return nodeid;};
        fdjtState.setNodeID=function(arg){
            if (typeof arg==='number')
                nodeid=zeropad(arg.toString(16),12);
            else if (typeof arg === 'string')
                if (arg.search(/[^0123456789abcdefABCDEF]/)<0)
                    nodeid=zeropad(arg,12);
            else throw {error: 'invalid node id',value: arg};
            else throw {error: 'invalid node id',value: arg};};

        function getUUID(node){
            var now=new Date().getTime();
            if (now<last_time) {now=now*10000; clockid++;}
            else if (now===last_time)   now=now*10000+(msid++);
            else {now=now*10000; msid=1;}
            now=now+122192928000000000;
            if (!(node)) node=nodeid;
            var timestamp=now.toString(16); var tlen=timestamp.length;
            if (tlen<15) timestamp=zeros.slice(0,15-tlen)+timestamp;
            return timestamp.slice(7)+"-"+timestamp.slice(3,7)+
                "-1"+timestamp.slice(0,3)+
                "-"+(32768+(clockid%16384)).toString(16)+
                "-"+((node)?
                     ((typeof node === 'number')?
                      (zeropad(node.toString(16),12)):
                      (zeropad(node,12))):
                     (nodeid));}
        fdjtState.getUUID=getUUID;
        
        // Getting version information
        function versionInfo(){
            var s=navigator.userAgent; var result={};
            var start;
            while ((start=s.search(/\w+\/\d/g))>=0) {
                var slash=s.indexOf('/',start);
                var afterslash=s.slice(slash+1);
                var num_end=afterslash.search(/\W/);
                var numstring=afterslash.slice(0,num_end);
                try {
                    result[s.slice(start,slash)]=parseInt(numstring,10);}
                catch (ex) {
                    result[s.slice(start,slash)]=numstring;}
                s=afterslash.slice(num_end);}
            if (result['Chrome']) result.browser='Chrome';
            else if (result['Opera']) result.browser='Opera';
            else if (result['Safari']) result.browser='Safari';
            else if ((result['Safari'])&&(result['Mobile']))
                result.browser='MobileSafari';
            else if (result['Firefox']) result.browser='Firefox';
            else if ((result['Explorer'])||(result['IE'])||
                     (result['InternetExplorer'])||(result['MSIE']))
                result.browser='IE';
            else if (result['Mozilla']) result.browser='Mozilla';
            else result.browser='Browser';
            result.platform=navigator.platform||"Turing";
            return result;}
        fdjtState.versionInfo=versionInfo;

        function getStyleTag() {
            // This is a trick for making a tag value visible to Javascript from CSS
            // From: http://tech.particulate.me/javascript/2013/10/10/how-to-conveniently-check-for-responsive-breakpoints-in-javascript/
            var tag = window.getComputedStyle(document.body,':after').getPropertyValue('content');
            tag = tag.replace(/"/g,'');   // Firefox bugfix
            return tag;}
        // To use it, define:
        //    body:after { content: 'styletag'; }
        // in your CSS.  This is typically done inside the @media rules which define
        // adaptive design breakpoints
        fdjtState.getStyleTag=getStyleTag;

        function getURL(keepquery,keephash){
            var url=window.location.href;
            var hashpos=url.indexOf('#'), qpos=url.indexOf('?');
            var hash=((keephash)&&(hashpos>=0)&&(url.slice(hashpos+1)));
            var query=((keepquery)&&(qpos>=0)&&
                       ((hashpos>=0)?(url.slice(qpos+1,hashpos)):
                        (url.slice(qpos+1))));
            url=((qpos>=0)?(url.slice(0,qpos)):
                 (hashpos>=0)?(url.slice(0,hashpos)):
                 (url));
            return url+((query)?("?"+query):(""))+((hash)?("#"+hash):(""));}
        fdjtState.getURL=getURL;

        return fdjtState;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
