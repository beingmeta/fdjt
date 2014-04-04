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
if (!(fdjt.UI)) fdjt.UI={};

fdjt.UI.adjustFont=
    (function(){
        "use strict";
        function setupContainer(elt,opts){
            var parent=elt.parentNode, container;
            if (parent.className==="adjustfont_wrapper")
                return parent;
            var cstyle=getStyle(elt), style=elt.style;
            if (((cstyle)&&(cstyle.display==='block'))||
                (style.display==='block')||(elt.tagName==='DIV')||
                (elt.tagName==='P')||(elt.tagName[0]==='H'))
                container=document.createElement("div");
            else container=document.createElement("span");
            container.className="adjustfont_wrapper";
            parent.replaceChild(container,elt);
            container.appendChild(elt);
            container.style.display='block';
            // Set up CSS valures if needed
            if (!((cstyle)&&(cstyle.display==="inline-block"))) {
                try {style.display="inline-block;";} catch (ex) {}
                if (style.display!=="inline-block") style.display='inline';}
            var white_space_value=((opts)&&(opts.wsval))||
                (adjustFont.wsval)||"nowrap";
            if (!((cstyle)&&
                  ((cstyle.whiteSpace==="pre")||
                   (cstyle.whiteSpace==="nowrap"))))
                style.whiteSpace=white_space_value;
            container.style.fontSize="100%";
            return container;}

        function parsePct(arg){
            // To be more clever and robust, we could handle units besides
            // pixels
            if (!(arg)) return arg;
            else if (typeof arg === 'number') return arg;
            // In many cases, this just works
            else try { return parseFloat(arg); }
            catch (ex) {}
            var len=arg.length;
            if ((len>2)&&((arg.slice(len-1))==="%")) {
                try { return parseFloat(arg.slice(0,len-1)); }
                catch (ex) {return false;}}}

        function parentWidth(parent){
            var w=parent.offsetWidth;
            if (w>0) return w;
            else return ((parent.parentNode)&&
                         (parentWidth(parent.parentNode)));}

        function getStyle(elt){
            return (elt)&&(elt.nodeType===1)&&
                (elt.currentStyle||
                 ((window.getComputedStyle)&&
                  (window.getComputedStyle(elt,null))));}

        // This is the core of the algorithm, adjusting the font size to
        //  put the inner element's size just outside or inside the outer
        //  element.
        function tweakFontSize(elt,delta,container,pct,minpct,maxpct,pw){
            var parent=container.parentNode;
            if (!(pw)) pw=parentWidth(parent);
            if (!(pct)) pct=parseFloat(container.style.fontSize);
            // This is where the real scaling happens
            var w=elt.offsetWidth; if (!(pw)) pw=parentWidth(parent);
            if ((w<pw)&&(pct<(maxpct-delta)))
                while ((w<pw)&&(pct<=(maxpct-delta))) {
                    pct=pct+delta;
                    container.style.fontSize=(pct)+"%";
                    w=elt.offsetWidth;}
            else if ((w>pw)&&(pct>=(minpct-delta)))
                while (w>pw) {
                    pct=pct-delta;
                    container.style.fontSize=(pct)+"%";
                    w=elt.offsetWidth;}
            return pct;}
        
        // This is the function to adjust an element, which starts by
        // setting up the DOM as neccessary and then using tweakFontSize
        // with different deltas (10, 1 and 0.1) to zero in on a pretty
        // good value.
        function adjustFont(elt,opts){
            var container=setupContainer(elt,opts);
            var pct=parsePct(container.style.fontSize);
            var unhide=((opts)&&(opts.unhide))||(adjustFont.unhide);
            var max=((opts)&&(opts.maxpct)), min=((opts)&&(opts.minpct));
            var saved_display=elt.style.display;
            var visualized=((elt.offsetWidth===0)&&(makeVisible(elt)));
            if (!(max)) {
                max=parsePct(elt.getAttribute("data-maxfont"));
                if (!(max)) max=adjustFont.maxpct;
                else if (opts) opts.maxpct=max;
                else {}}
            if (!(max)) max=1000;
            if (!(min)) {
                min=parsePct(elt.getAttribute("data-minfont"));
                if (!(min)) min=adjustFont.minpct;
                else if (opts) opts.mincpt=min;
                else {}}
            if (!(min)) min=5;
            elt.style.display='inline-block';
            // Tweak the font percent size at progressively finer
            // granularities
            pct=tweakFontSize(elt,25,container,pct,min,max);
            pct=tweakFontSize(elt,10,container,pct,min,max);
            pct=tweakFontSize(elt,1,container,pct,min,max);
            var w=elt.offsetWidth, pw=parentWidth(container.parentNode);
            // If you're over, adjust it one last time to make it fit
            if (w>pw) pct=tweakFontSize(elt,0.1,container,pct,min,max);
            if (visualized) restoreVisibility(visualized);
            elt.style.display=saved_display;
            if (unhide) elt.style.visibility='visible';
            return pct;}
        
        function makeVisible(elt){
            var results=[];
            while (elt) {
                var cstyle=getStyle(elt);
                var style=elt.style;
                if (!(style)) elt=elt.parentNode; 
                else if (cstyle.display==='none') {
                    var saved={};
                    if ((style.opacity===0)||
                        ((style.opacity)&&(style.opacity!=='')))
                        saved.opacity=style.opacity;
                    if ((style.visibility)&&(style.visibility!==''))
                        saved.visibility=style.visibility;
                    if ((style.display)&&(style.display!==''))
                        saved.display=style.display;
                    style.visibility='hidden';
                    style.opacity=0.0;
                    if ((elt.tag==="TH")||(elt.tag==="TD"))
                        style.display="table-cell";
                    else if (elt.tag==="TR")
                        style.display="table-row";
                    else if (elt.tag==="LI")
                        style.display="list-item";
                    else if (elt.tag==="TBODY")
                        style.display="table-row-group";
                    else if (elt.tag==="TABLE")
                        style.display="table";
                    else style.display="block";
                    results.push([elt,saved]);
                    elt=elt.parentNode;}
                else elt=elt.parentNode;}
            return results;}
        function restoreVisibility(elements){
            var i=0, lim=elements.length;
            while (i<lim) {
                var entry=elements[i++];
                var elt=entry[0], saved=entry[1];
                if (saved.display)
                    elt.style.display=saved.display;
                else elt.style.display='';
                if (saved.visibility)
                    elt.style.visibility=saved.visibility;
                else elt.style.visibility=''; 
                if ((saved.opacity===0)||(saved.opacity))
                    elt.style.opacity=saved.opacity;
                else elt.style.opacity='';}}
                
        
        function classes2spec(classes){
            var specs=[]; var i=0, lim=classes.length;
            while (i<lim) {
                var classname=classes[i++];
                if (classname[0]===".") specs.push(classname);
                else specs.push("."+classname);}
            return specs.join(",");}

        // This handles getting the elements to adjust and makes up for
        // not being able to count on jQuery or another selector library,
        // though it does check for some of those libraries.
        function getElements(elt){
            var results=[];
            var classes=adjustFont.classes, spec;
            if (classes.length===0) return [];
            if (!(elt)) elt=document.body;
            if (!(elt)) return [];
            if (elt.querySelectorAll) {
                spec=classes2spec(classes);
                return elt.querySelectorAll(spec);}
            else if (window.jQuery) {
                spec=classes2spec(classes);
                return window.jQuery(spec);}
            else if ((window.fdjt)&&(window.fdjt.DOM)) {
                spec=classes2spec(classes);
                return fdjt.DOM.$(spec);}
            else if (window.Sizzle) {
                spec=classes2spec(classes);
                return window.Sizzle(spec);}
            else if (elt.getElementsByClassName) {
                if (classes.length===1)
                    return elt.getElementsByClassName(classes[0]);
                else {
                    var j=0, jlim=classes.length;
                    while (j<jlim) {
                        var classname=classes[j++];
                        results=results.concat(
                            elt.getElementsByClassName(classname));}
                    return results;}}
            else {
                var regex_string=
                    ((classes.length===1)?("\\b"+classes[0]+"\\b"):
                     ("(\\b"+classes.join("\\b)|(\\b")+"\\b)"));
                var regex=new RegExp(regex_string);
                if (elt.children) {
                    var children=elt.children;
                    var i=0, lim=children.length;
                    while (i<lim) {
                        var node=children[i++];
                        if ((node.nodeType===1)&&(node.className)&&
                            (node.className.search(regex)>=0))
                            results.push(node);}
                    return results;}
                else {
                    slowZoneSearch(elt,regex,results);
                    return results;}}}

        // This does a laborious search for elements whose className
        // contains the given regex.
        function slowZoneSearch(elt,regex,results){
            if (elt.nodeType!==1) return;
            if ((elt.className)&&(elt.className.search(regex)>=0))
                results.push(elt);
            var children=elt.childNodes;
            var i=0, lim=children.length;
            while (i<lim) {
                var child=children[i++];
                if (child.nodeType===1) slowZoneSearch(child,regex,results);}}
        
        // This sets up a DOM tree for use with the module; it's called by
        // the onload and onresize handlers and can also be called
        // explicitly if we're adding elements to the DOM.
        function update(elt,opts){
            var i=0, lim;
            if (Array.isArray(elt)) {
                lim=elt.length;
                while (i<lim) adjustFont(elt[i++],opts||false);}
            else {
                if (!(elt)) elt=document.body;
                var elts=getElements(elt);
                lim=elts.length;
                while (i<lim) adjustFont(elts[i++],opts||false);}}
        adjustFont.update=update;
        adjustFont.setup=update;

        function adjustfont_onresize(){update(document.body);}
        function adjustfont_onload(){update(document.body);}

        function onload(){
            if (adjustFont.onload) {
                if (adjustFont.delay)
                    adjustFont.delay=adjustfont_onload;
                else adjustfont_onload();}}
        function onresize(){
            if (adjustFont.onresize) {
                if (adjustFont.delay)
                    adjustFont.delay=adjustfont_onresize;
                else adjustfont_onresize();}}
        
        adjustFont.onload=true;
        adjustFont.onresize=true;
        adjustFont.classes=["adjustfont","hatchshow"];
        adjustFont.wsval="nowrap";
        adjustFont.unhide=true;
        
        if (window.addEventListener) {
            window.addEventListener("load",onload);
            window.addEventListener("resize",onresize);}
        else if (window.attachEvent) {
            window.attachEvent("onload",onload);
            window.attachEvent("onload",onresize);}
        else {}
        
        return adjustFont;
    })();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
