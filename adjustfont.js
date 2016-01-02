/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/adjustfont.js ###################### */

/* Copyright (C) 2012-2014 beingmeta, inc.
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


   This is based on the implementation by Charlie Park described at:
   http:://charlipark.org/hatchshow/

*/
/* jshint browser: true */

/* To do:
   add maxheight constraints
   more documentation
*/

// var fdjt=((window.fdjt)||{});

(function(){
    "use strict";
    /* Tweaking fonts */

    var floor=Math.floor;
    var fdjtDOM=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var getFirstChild=fdjtDOM.getFirstChild;
    var wrapChildren=fdjtDOM.wrapChildren;
    var getStyle=fdjtDOM.getStyle;
    var Selector=fdjtDOM.Selector;
    var hasClass=fdjtDOM.hasClass;

    function toArray(arg) {
        return Array.prototype.slice.call(arg);}

    function adjustWrapperFont(wrapper,delta,done,size,min,max,w,h,fudge,dolog){
        var ow=floor(wrapper.scrollWidth), oh=floor(wrapper.scrollHeight);
        var nw, nh, newsize;
        var wstyle=wrapper.style;
        if (typeof fudge!== "number") fudge=1;

        // These are cases where one dimension is on the edge but
        // the other dimension is inside the edge
        if ((ow<=w)&&(oh<=h)&&(oh>=(h-fudge))) return size;
        // We actually skip this case because increasing the font size
        //  might not increase the width if it forces a new line break
        // else if ((sh<=h)&&(sw<=w)&&(sw>=(w-fudge))) return size;

        // Figure out if we need to grow or shrink 
        if ((ow>w)||(oh>h)) delta=-delta;

        if (delta>0) wstyle.maxWidth=floor(w)+"px";

        if (!(size)) {size=100; wstyle.fontSize=size+"%";}
        if (!(min)) min=20;
        if (!(max)) max=150;
        newsize=size+delta;
        wstyle.fontSize=newsize+"%";
        nw=floor(wrapper.scrollWidth); nh=floor(wrapper.scrollHeight);
        while ((size>=min)&&(size<=max)&&
               ((delta>0)?((nw<w)&&(nh<h)):((nw>w)||(nh>h)))) {
            size=newsize; newsize=newsize+delta;
            wstyle.fontSize=newsize+"%";
            if (dolog)
                fdjtLog(
                    "Adjust %o to %dx%d %o: size=%d=%d+(%d), %dx%d => %dx%d",
                    wrapper.parentNode,w,h,wrapper,newsize,size,delta,
                    ow,oh,nw,nh);
            nw=floor(wrapper.scrollWidth); nh=floor(wrapper.scrollHeight);}
        wstyle.maxWidth='';
        if (delta>0) {
            wstyle.fontSize=size+"%";
            return size;}
        else return newsize;}
    
    function adjustFontSize(node,min_font,max_font,fudge){
        var h=node.offsetHeight, w=node.offsetWidth;
        var dolog=hasClass(node,"_fdjtlog");
        var node_display='';
        if ((h===0)||(w===0)) {
            // Do a little to make the element visible if it's not.
            node_display=node.style.display;
            node.style.display='initial';
            h=node.offsetHeight; w=node.offsetWidth;
            if ((h===0)||(w===0)) {
                node.style.display=node_display;
                return;}}
        else {}
        if ((h===0)||(w===0)) {
            node.style.display=node_display;
            return;}
        var wrapper=wrapChildren(node,"div.fdjtfontwrapper");
        var wstyle=wrapper.style, size=100;
        wstyle.boxSizing='border-box';
        wstyle.padding=wstyle.margin="0px";
        wstyle.fontSize=size+"%";
        wstyle.transitionProperty='none';
        wstyle.transitionDuration='0s';
        wstyle[fdjtDOM.transitionProperty]='none';
        wstyle[fdjtDOM.transitionDuration]='0s';
        wstyle.visibility='visible';
        if ((h===0)||(w===0)) {
            node.removeChild(wrapper);
            fdjtDOM.append(node,toArray(wrapper.childNodes));
            node.style.display=node_display;
            return;}
        var min=((min_font)||(node.getAttribute("data-minfont"))||(20));
        var max=((max_font)||(node.getAttribute("data-maxfont"))||(200));
        if (typeof fudge!=="number") fudge=node.getAttribute("data-fudge");
        if (typeof min === "string") min=parseFloat(min,10);
        if (typeof max === "string") max=parseFloat(max,10);
        if (typeof fudge === "string") fudge=parseInt(fudge,10);
        if (typeof fudge !== "number") fudge=2;
        wstyle.width=wstyle.height="100%";
        w=wrapper.offsetWidth; h=wrapper.offsetHeight;
        wstyle.width=wstyle.height="100%";
        wstyle.maxWidth=wstyle.maxHeight="100%";
        w=wrapper.offsetWidth; h=wrapper.offsetHeight;
        wstyle.width=wstyle.height="";
        size=adjustWrapperFont(
            wrapper,10,false,size,min,max,w,h,fudge,dolog);
        size=adjustWrapperFont(
            wrapper,5,false,size,min,max,w,h,fudge,dolog);
        size=adjustWrapperFont(
            wrapper,1,false,size,min,max,w,h,fudge,dolog);
        wstyle.maxWidth=wstyle.maxHeight="";
        node.style.display=node_display;
        if (size===100) {
            if (dolog)
                fdjtLog("No need to resize %o towards %dx%d",node,w,h);
            node.removeChild(wrapper);
            fdjtDOM.append(node,toArray(wrapper.childNodes));}
        else {
            wstyle.width=''; wstyle.height='';
            wstyle.maxWidth=''; wstyle.maxHeight='';
            if (dolog)
                fdjtLog("Adjusted (%s) %o towards %dx%d, wrapper @ %d,%d",
                        wstyle.fontSize,node,w,h,
                        wrapper.scrollWidth,wrapper.scrollHeight);
            // We reset all of these
            wstyle.transitionProperty='';
            wstyle.transitionDuration='';
            wstyle[fdjtDOM.transitionProperty]='';
            wstyle[fdjtDOM.transitionDuration]='';
            var cwstyle=getStyle(wrapper);
            if (cwstyle[fdjtDOM.transitionProperty]) { 
                wstyle.fontSize=''; wstyle.visibility='';
                wstyle.fontSize=size+"%";}
            else wstyle.visibility='';}
        return size;}
    fdjtDOM.adjustFontSize=fdjtDOM.tweakFontSize=adjustFontSize;
    
    function resetFontSize(node){
        var wrapper=getFirstChild(node,".fdjtfontwrapper");
        if (wrapper) wrapper.style.fontSize="100%";}
    fdjtDOM.resetFontSize=resetFontSize;

    fdjtDOM.autofont=".fdjtadjustfont,.adjustfont";
    function adjustFonts(arg,top){
        var all=[];
        if (!(arg)) all=fdjtDOM.$(fdjtDOM.autofont);
        else if (typeof arg === "string") {
            if (document.getElementByID(arg)) 
                all=[document.getElementByID(arg)];
            else {
                fdjtDOM.autofont=fdjtDOM.autofont+","+arg;
                all=fdjtDOM.$(arg);}}
        else if (arg.nodeType===1) {
            var sel=new Selector(fdjtDOM.autofont);
            if (sel.match(arg))
                all=[arg];
            else all=fdjtDOM.getChildren(arg,fdjtDOM.autofont);}
        else all=fdjtDOM.$(fdjtDOM.autofont);
        var i=0, lim=all.length;
        if (lim) while (i<lim) adjustFontSize(all[i++]);
        else if (top) adjustFontSize(top);}
    fdjtDOM.tweakFont=fdjtDOM.tweakFonts=
        fdjtDOM.adjustFont=fdjtDOM.adjustFonts=adjustFonts;
    
    function adjustPositionedChildren(node){
        if ((!(node))||(node.nodeType!==1)) return;
        var style=getStyle(node);
        if ((node.childNodes)&&(node.childNodes.length)) {
            var children=node.childNodes; var i=0, lim=children.length;
            while (i<lim) {
                var child=children[i++];
                if (child.nodeType===1)
                    adjustPositionedChildren(child);}}
        if (((style.display==='block')||(style.display==='inline-block'))&&
            ((style.position==='absolute')||(style.position==='fixed')))
            adjustFontSize(node);}
    function adjustLayoutFonts(node){
        var marked=fdjtDOM.getChildren(node,fdjtDOM.autofont);
        var i=0, lim=marked.length;
        if (lim===0) adjustPositionedChildren(node);
        else while (i<lim) adjustFontSize(marked[i++]);}
    fdjtDOM.adjustLayoutFonts=adjustLayoutFonts;

    function autoAdjustFonts(){
        if (fdjtDOM.noautofontadjust) return;
        adjustFonts();
        fdjtDOM.addListener(window,"resize",adjustFonts);}

    fdjt.addInit(autoAdjustFonts,"adjustFonts");
    
})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
