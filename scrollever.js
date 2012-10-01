/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/scrollever.js ###################### */

/* Copyright (C) 2011-2012 beingmeta, inc.
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

function fdjtScrollEver(spec) {
    var busy=false, timer=false;
    if (!(spec)) spec={};
    var url=spec.url||fdjtDOM.getLink("SCROLLFETCH");
    var off=spec.off||fdjtState.getQuery("OFF")||0;
    var win=spec.win||fdjtState.getQuery("WINDOW")||
	fdjtDOM.getMeta("SCROLLWINDOW")||7;
    var limit=spec.limit||fdjtState.getQuery("LIMIT")||
	fdjtDOM.getMeta("SCROLLMAX")||7;
    var container=spec.container||fdjtDOM.getMeta("SCROLLELEMENT");
    var thresh=spec.thresh||fdjtDOM.getMeta("SCROLLTHRESH")||100;
    var interval=spec.interval||fdjtDOM.getMeta("SCROLLINTERVAL")||500;
    if (typeof container==='string')
	container=document.getElementById(container);
    if (typeof off !== 'number') off=parseInt(off);
    if (typeof win !== 'number') win=parseInt(win);
    if (typeof limit !== 'number') limit=parseInt(limit);
    if (typeof thresh !== 'number') thresh=parseInt(thresh);
    if (typeof interval !== 'number') interval=parseInt(interval);
    
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
	    if ((req.readyState == 4) && (req.status == 200)) {
		var tbl=fdjtDOM("TABLE");
		var htmltext=req.responseText;
		tbl.innerHTML=htmltext;
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
		busy=false;}};
	req.send(null);}

    function scrollChecker(){
	if (busy) return;
	var page_height=document.documentElement.scrollHeight;
	var scroll_pos=window.pageYOffset;
	if (typeof scroll_pos !== 'number')
	    scroll_pos=document.documentElement.scrollTop;
	var client_height=document.documentElement.clientHeight;
	if (((page_height-(scroll_pos+client_height))<thresh)||
	    (page_height<client_height))
	    getMoreResults();}
    return (timer=setInterval(scrollChecker,interval));}

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  End: ***
*/
