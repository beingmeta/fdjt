/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* Copyright (C) 2011 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   It implements a method for breaking narrative HTML content
   across multiple pages, attempting to honor page break constraints,
   etc.

   Check out the 'mini manual' at the bottom of the file or read the
   code itself.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or any
   later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

   Use and redistribution (especially embedding in other CC licensed
   content) is also permitted under the terms of the Creative Commons
   "Attribution-NonCommercial" license:

   http://creativecommons.org/licenses/by-nc/3.0/ 

   Other uses may be allowed based on prior agreement with
   beingmeta, inc.  Inquiries can be addressed to:

   licensing@beingmeta.com

   Enjoy!

*/

var WSN=(function(){

    var unicode_regex=/(\p{Mark})/g;
    
    function WSN(arg,sortfn,dedup){
	if (typeof arg === 'string') {
	    var norm=
		((unicode_regex)?
		 (arg.toLowerCase().replace(unicode_regex,"")):
		 (arg.toLowerCase()));
	    var words=norm.split(/\W*\s+\W*/g);
	    var nwords=words.length;
	    if (nwords===0) return "";
	    else words[0]=words[0].replace(/^\W+/,"");
	    if (nwords>1)
		words[nwords-1]=words[nwords-1].replace(/\W+$/,"");
	    if ((sortfn)&&(dedup))
		return dedupfn(words.sort(sortfn)).join(" ");
	    else if (sortfn)
		return words.sort(sortfn).join(" ");
	    else return words.join(" ");}
	else if (!(arg.nodeType))
	    throw new Exception("bad arg to WSN");
	else if (arg.nodeType===3)
	    return WSN(arg.nodeValue);
	else if (arg.nodeType===1)
	    return WSN(textify(arg));
	else throw new Exception("bad arg to WSN");}

    function dedupfn(arr){
	var i=0; var lim=arr.length; var last=false;
	if (lim<2) return arr;
	else while (i<lim) {
	    if ((last)&&(arr[i]===last)) return dodedup(arr);
	    else last=arr[i];}
	return arr;}
    function dodedup(arr){
	var last=arr[0]; var result=[last];
	var i=1; var lim=arr.length;
	while (i<lim) 
	    if (arr[i]===last) i++;
	    else result.push(last=arr[i++]);
	return result;}
    
    function lensort(x,y){
	var xl=x.length, yl=y.length;
	if (xl===yl) {
	    if (x>y) return -1;
	    else if (x<y) return 1;
	    else return 0;}
	else if (xl>yl) return -1;
	else return 1;}
    WSN.lensort=lensort;

    function textify(arg,text){
	if (!(arg.nodeType)) return text||"";
	else if (arg.nodeType===3)
	    if (text) return text+arg.nodeValue; else return arg.nodeValue;
	else if (arg.nodeType===1) {
	    var children=arg.childNodes;
	    var style=window.getComputedStyle(node);
	    var display=style.display;
	    if (!(text)) text="";
	    if (display!=='inline') text=text+"\n";
	    var i=0; var lim=children.length;
	    while (i<lim) {
		var child=children[i++];
		if (child.nodeType===3) text=text+child.nodeValue;
		else if (child.nodeType===1) text=textify(child,text);
		else {}}}
	else if (text) return text;
	else return "";}
    WSN.textify=textify;

    function fuddle(arg,sortfn){return WSN(arg,sortfn||lensort);}
    WSN.fuddle=fuddle;

    function md5id(arg){
	var wsn=WSN(arg);
	if (WSN.md5) return WSN.md5(wsn);
	else if ((fdjtHash)&&(fdjtHash.hex_md5))
	    return fdjtHash.hex_md5(wsn);
	else throw new Exception("No MD5 implementation");}
    WSN.md5id=md5id;
    
    function sha1id(arg){
	var wsn=WSN(arg);
	if (WSN.sha1) return WSN.md5(wsn);
	else if ((fdjtHash)&&(fdjtHash.hex_sha1))
	    return fdjtHash.hex_sha1(wsn);
	else throw new Exception("No MD5 implementation");}
    WSN.sha1id=sha1id;

    try {
	if (("A\u0300".search(unicode_regex))<0)
	    unicode_regex=false;}
    catch (ex) {
	unicode_regexes=false;}
    
    return WSN;})();

