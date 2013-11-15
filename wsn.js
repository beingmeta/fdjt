/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/wsn.js ###################### */

/* Copyright (C) 2011-2013 beingmeta, inc.
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

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

var WSN=(function(){
    "use strict";
    var fdjtHash=fdjt.Hash;
    var fdjtString=fdjt.String;

    function get_punct_regex(){
        try { return (/(\pM)/g);}
        catch (ex1) {
            try { return (/(\pP)/g); }
            catch (ex2) {return (/[.,?!-_@&%$#\\\/\^()]/);}}}
    
    var punct_regex=get_punct_regex();
    var decodeEntities=fdjtString.decodeEntities;
    
    function WSN(arg,sortfn,wordfn,keepdup){
        if (arg==="") return arg;
        else if ((!(arg))&&(this instanceof WSN)) {
            // Assume we're being used as a constructor.
            if (sortfn) this.sortfn=sortfn;
            if (wordfn) this.wordfn=wordfn;
            if (keepdup) this.keepdup=keepdup;
            return this;}
        else if (!(arg)) return arg;
        if (typeof sortfn === 'undefined') sortfn=WSN.sortfn||false;
        if (typeof wordfn === 'undefined') wordfn=WSN.wordfn||false;
        if (typeof keepdup === 'undefined') keepdup=WSN.keepdup||false;
        if (typeof arg === 'string') {
            var norm=
                decodeEntities(arg).toLowerCase().replace(punct_regex,"");
            // Trim spaces
            if (norm.trim) norm=norm.trim();
            else {
                if (norm.search(/\S/)>0)
                    norm=norm.slice(norm.search(/\S/));
                if (norm.search(/\s+$/)>0)
                    norm=norm.slice(0,norm.search(/\s+$/));}
            if (norm==="") return "";
            var words=norm.split(/\W*\s+\W*/g), word;
            var xwords=[], xword;
            var nwords=words.length;
            var i, lim;
            if (nwords===0) return "";
            else words[0]=words[0].replace(/^\W+/,"");
            if (nwords>1)
                words[nwords-1]=words[nwords-1].replace(/\W+$/,"");
            if (wordfn) {
                if (typeof wordfn === 'number') {
                    i=0; lim=words.length;
                    while (i<lim) {
                        xword=words[i++];
                        if (word.length>wordfn) xwords.push(xword);}
                    if (xwords.length) words=xwords;}
                else if (wordfn.call) {
                    i=0; lim=words.length;
                    while (i<lim) {
                        xword=wordfn(words[i++]);
                        if (xword) xwords.push(xword);
                        i++;}
                    if (xwords.length) words=xwords;}
                else  {
                    i=0; lim=words.length;
                    while (i<lim) {
                        word=words[i++];
                        xword=wordfn[word];
                        if (xword==="") {}
                        else if ((!(xword))||(typeof xword !== 'string'))
                            xwords.push(word);
                        else xwords.push(xword);}
                    if (xwords.length) words=xwords;}}
            var sorter=sortfn;
            // By default, use lensort
            // But if you're passed nativesort, just
            //  pass false to sort()
            if (sortfn===true) sorter=lensort;
            else if (sortfn===nativesort) sorter=false;
            else {}
            if ((sortfn)&&(keepdup))
                return words.sort(sorter).join(" ");
            else if (sortfn)
                return dedupfn(words.sort(sorter)).join(" ");
            else return words.join(" ");}
        else if (!(arg.nodeType))
            throw new Error("bad arg to WSN");
        else if (arg.nodeType===3)
            return WSN(arg.nodeValue);
        else if (arg.nodeType===1)
            return WSN(textify(arg));
        else throw new Error("bad arg to WSN");}
    
    function dedupfn(arr){
        var i=0; var lim=arr.length; var last=false;
        if (lim<2) return arr;
        else while (i<lim) {
            if ((last)&&(arr[i]===last)) return dodedup(arr);
            else last=arr[i++];}
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
    function nativesort(x,y){
        if (x>y) return -1;
        else if (x<y) return 1;
        else return 0;}
    WSN.nativesort=nativesort;

    function textify(arg,text){
        /* global window: false */
        if (!(arg.nodeType)) return text||"";
        else if (arg.nodeType===3)
            if (text) return text+arg.nodeValue; else return arg.nodeValue;
        else if (arg.nodeType===1) {
            var children=arg.childNodes;
            var style=((window.getComputedStyle)?
                       (window.getComputedStyle(arg)):
                       {position: 'static',display: 'block'});
            if (style.position!=='static') return text||"";
            if (style.display!=='inline')
                text="\n"+(text||"");
            else if (!(text)) text="";
            var i=0; var lim=children.length;
            while (i<lim) {
                var child=children[i++];
                if (child.nodeType===3) text=text+child.nodeValue;
                else if (child.nodeType===1) text=textify(child,text);
                else {}}
            return text;}
        else if (text) return text;
        else return "";}
    WSN.prototype.textify=WSN.textify=textify;

    function fuddle(arg,sortfn){return WSN(arg,sortfn||lensort);}
    WSN.fuddle=fuddle;

    function md5ID(){
        var wsn=WSN.apply(null,arguments);
        if (WSN.md5) return WSN.md5(wsn);
        else if ((fdjtHash)&&(fdjtHash.hex_md5))
            return fdjtHash.hex_md5(wsn);
        else throw new Error("No MD5 implementation");}
    WSN.md5ID=md5ID;
    
    function sha1ID(){
        var wsn=WSN.apply(null,arguments);
        if (WSN.sha1) return WSN.md5(wsn);
        else if ((fdjtHash)&&(fdjtHash.hex_sha1))
            return fdjtHash.hex_sha1(wsn);
        else throw new Error("No SHA1 implementation");}
    WSN.sha1ID=sha1ID;

    function hash(arg,hashfn,sortfn,wordfn,keepdups){
        if (typeof hashfn === 'undefined') hashfn=WSN.hashfn||false;
        if (typeof sortfn === 'undefined') sortfn=WSN.sortfn||false;
        if (typeof wordfn === 'undefined') wordfn=WSN.wordfn||false;
        if (typeof keepdups === 'undefined') keepdups=WSN.keepdup||false;
        var wsn=WSN(arg,sortfn,wordfn,keepdups);
        return ((hashfn)?(hashfn(wsn)):(wsn));}
    WSN.hash=hash;
    WSN.prototype.Hash=function(arg){
        return hash(arg,this.hashfn||WSN.hashfn||false,
                    this.sortfn||WSN.sortfn||false,
                    this.wordfn||WSN.wordfn||false,
                    this.keepdup||WSN.keepdup||false);};

    function maphash(nodes,hashfn,sortfn,wordfn,keepdups){
        if (typeof hashfn === 'undefined') hashfn=WSN.hashfn||false;
        if (typeof sortfn === 'undefined') sortfn=WSN.sortfn||false;
        if (typeof wordfn === 'undefined') wordfn=WSN.wordfn||false;
        if (typeof keepdups === 'undefined') keepdups=WSN.keepdup||false;
        var map={};
        var i=0; var lim=nodes.length;
        while (i<lim) {
            var node=nodes[i++];
            var wsn=WSN(node,sortfn,wordfn,keepdups);
            var id=((hashfn)?(hashfn(wsn)):(wsn));
            map[id]=node;}
        return map;}
    WSN.maphash=maphash;
    WSN.prototype.maphash=function(arg){
        return maphash(arg,this.hashfn||WSN.hashfn||false,
                       this.sortfn||WSN.sortfn||false,
                       this.wordfn||WSN.wordfn||false,
                       this.keepdup||WSN.keepdup||false);};
    
    function mapMD5(nodes,sortfn,wordfn,keepdups){
        var hashfn=WSN.md5||((fdjtHash)&&(fdjtHash.hex_md5));
        return maphash(nodes,hashfn,sortfn,wordfn,keepdups);}
    function mapSHA1(nodes,sortfn,wordfn,keepdups){
        var hashfn=WSN.sha1||((fdjtHash)&&(fdjtHash.hex_sha1));
        return maphash(nodes,hashfn,sortfn,wordfn,keepdups);}
    WSN.mapMD5=mapMD5;
    WSN.mapSHA1=mapSHA1;

    WSN.md5=((fdjtHash)&&(fdjtHash.hex_md5));
    WSN.sha1=((fdjtHash)&&(fdjtHash.hex_sha1));

    return WSN;})();

fdjt.WSN=WSN;

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
