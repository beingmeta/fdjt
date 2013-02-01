/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/scrollever.js ###################### */

/* Copyright (C) 2011-2013 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file implements a simple version of infinite scrolling.

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

var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));
if (!(fdjt.UI)) fdjt.UI={};

fdjt.ScrollEver=fdjt.UI.ScrollEver=(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM, fdjtID=fdjt.ID;
    var fdjtState=fdjt.State, fdjtString=fdjt.String;
    var fdjtLog=fdjt.Log;
    
    function fdjtScrollEver(spec) {
        var busy=false, timer=false;
        if (!(spec)) spec={};
        var url=spec.url||
            fdjtDOM.getLink("~{http://fdjt.org/}scrollfetch")||
            fdjtDOM.getLink("~SCROLLFETCH");
        var off=spec.off||fdjtState.getQuery("OFF")||0;
        var win=spec.win||fdjtState.getQuery("WINDOW")||
            fdjtDOM.getMeta("~{http://fdjt.org/}scrollwindow")||
            fdjtDOM.getMeta("~SCROLLWINDOW")||
            7;
        var limit=spec.limit||fdjtState.getQuery("LIMIT")||
            fdjtDOM.getMeta("~{http://fdjt.org/}scrollmax")||
            fdjtDOM.getMeta("~scrollmax")||
            7;
        var container=spec.container||
            fdjtDOM.getMeta("~{http://fdjt.org/}scrollelement")||
            fdjtDOM.getMeta("~scrollelement")||
            "FDJTSCROLLCONTAINER";
        if (typeof container === 'string') {
            if (fdjtID(container)) container=fdjtID(container);
            else {
                fdjtLog.warn("No container %s",container);
                return;}}
        var thresh=spec.thresh||
            fdjtDOM.getMeta("~{http://fdjt.org/}scrollthresh")||
            fdjtDOM.getMeta("~scrollthresh")||
            100;
        var interval=spec.interval||
            fdjtDOM.getMeta("~{http://fdjt.org/}scrollinterval")||
            fdjtDOM.getMeta("~scrollinterval")||
            500;
        if (typeof off !== 'number') off=parseInt(off,10);
        if (typeof win !== 'number') win=parseInt(win,10);
        if (typeof limit !== 'number') limit=parseInt(limit,10);
        if (typeof thresh !== 'number') thresh=parseInt(thresh,10);
        if (typeof interval !== 'number') interval=parseInt(interval,10);
        
        if (fdjtScrollEver.debug) {
            fdjtLog("fdjtScrollEver called: %o/%o+%o, fetch=%s",
                    off,limit,win,url);
            fdjtLog("fdjtScrollEver scrolling on %opx, checking every %ous on %o",
                    thresh,interval,container);}

        function getMoreResults(){
            if (busy) return;
            if ((!(url))||(!(container))||(off>=limit)) {
                if (timer) clearTimeout(timer);
                return;}
            else busy=true;
            var call=url.replace("-off-",fdjtString(off+win));
            var req=new XMLHttpRequest();
            req.open("GET",call,true);
            req.withCredentials=true;
            req.onreadystatechange=function () {
                if ((req.readyState === 4) && (req.status === 200)) {
                    if (fdjtScrollEver.debug)
                        fdjtLog("fdjtScrollEver getMoreResults (response)");
                    var tbl=fdjtDOM(container.tagName);
                    var htmltext=req.responseText;
                    try {tbl.innerHTML=htmltext;}
                    catch (ex) {
                        var span=document.createElement("span");
                        span.style.display='none';
                        span.innerHTML="<"+container.tagName+">"+
                            htmltext+"</"+container.tagName+">";
                        tbl=span.childNodes[0];}
                    var add=[];
                    var children=tbl.childNodes;
                    var i=0; var lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        if ((child.nodeType===1)&&(child.id)) {
                            if (document.getElementById(child.id)) {}
                            else add.push(child);}
                        else add.push(child);}
                    fdjtDOM(container,add);
                    off=off+win;
                    var iscroll=spec.iscroll||window.iscroller||false;
                    if (iscroll)
                        setTimeout(function(){iscroll.refresh();},10);
                    busy=false;}};
            if (fdjtScrollEver.debug)
                fdjtLog("fdjtScrollEver getMoreResults (call)");
            req.send(null);}

        function scrollChecker(){
            if (busy) return;
            var iscroll=spec.iscroll||window.iscroller||false;
            var page_height=(iscroll)?(iscroll.scrollerH):
                (document.documentElement.scrollHeight);
            var scroll_pos=(iscroll)?(-iscroll.y):
                (window.pageYOffset);
            if ((!(iscroll))&&(typeof scroll_pos !== 'number'))
                scroll_pos=document.documentElement.scrollTop;
            var client_height=(iscroll)?(iscroll.wrapperH):
                (document.documentElement.clientHeight);
            if (((page_height-(scroll_pos+client_height))<thresh)||
                (page_height<client_height))
                getMoreResults();}
        return (timer=setInterval(scrollChecker,interval));}
    return fdjtScrollEver;})();

// fdjtScrollEver.debug=true;

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
