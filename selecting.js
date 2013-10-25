/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/selecting.js ###################### */

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
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));
if (!(fdjt.UI)) fdjt.UI={};

fdjt.TextSelect=fdjt.UI.Selecting=fdjt.UI.TextSelect=
    (function(){
        "use strict";
        var fdjtDOM=fdjt.DOM;
        var fdjtLog=fdjt.Log;
        var fdjtUI=fdjt.UI;
        var hasParent=fdjtDOM.hasParent;
        var stripIDs=fdjtDOM.stripIDs;        
        var getStyle=fdjtDOM.getStyle;

        function position(elt,arr){
            if (arr.indexOf) return arr.indexOf(elt);
            else {
                var i=0, lim=arr.length;
                while (i<lim) {
                    if (arr[i]===elt) return i;
                    else i++;}
                return -1;}}

        var selectors={}; // Maps DOM ids to instances
        var tapholds={}; // Maps DOM ids to taphold objects
        var serialnum=0;  // Tracks instances
        var trace=false;

        function TextSelect(nodes,opts){
            if (!(this instanceof TextSelect))
                return new TextSelect(nodes,opts);
            else this.serial=++serialnum;
            if (typeof nodes==='string') {
                var elt=document.getElementById(nodes);
                if (!(elt)) return false;
                else this.nodes=nodes=[elt];}
            else if (nodes.nodeType) this.nodes=nodes=[nodes];
            else if (!(nodes.length)) return false;
            else this.nodes=nodes;
            var sel=this;
            var orig=this.orig=[], wrapped=this.wrapped=[];
            var words=this.words=[], wrappers=this.wrappers=[];
            var prefix=this.prefix="fdjtSel0"+this.serial;
            this.loupe=fdjtDOM("span.fdjtselectloupe");
            this.adjust=false; /* This will be 'start' or 'end' */
            selectors[prefix]=sel;
            var stripid=prefix.length+1;
            var k=0, n=nodes.length;
            while (k<n) {
                var node=nodes[k++];
                var style=getStyle(node);
                var wrapper=
                    ((style.display==='inline')?
                     (fdjtDOM("span.fdjtselecting")):
                     (fdjtDOM("div.fdjtselecting")));
                // Initialize the wrapper
                wrapper.id=prefix+"w"+k;
                wrapper.title=((opts)&&(opts.title))||
                    "Tap or hold/drag to move the ends of the text range";
                selectors[wrapper.id]=sel;
                wrappers.push(wrapper);
                tapholds[wrapper.id]=addHandlers(wrapper,sel,opts);
                if (trace)
                    fdjtLog("Created TapHold handler (#%d) for wrapper %s around %o",
                            tapholds[wrapper.id].serial,wrapper.id,node);
                // Replace the node with the wrapper and then update
                // the node (replacing words with spans) while it's
                // outside of the DOM for performance.
                node.parentNode.replaceChild(wrapper,node);
                orig.push(node); wrapped.push(wrapper);
                // Actually wrap the words in spans
                wrapText(node,orig,wrapped,words,prefix);
                // And put the node back into the DOM
                wrapper.appendChild(node);}
            // These track the state of the current selection
            //  for this instance
            this.start=false; this.end=false;
            this.min=-1; this.max=-1; this.n_words=0;
            this.onchange=((opts)&&(opts.onchange))||false;
            // This gets the word offset for a particular target
            this.wordnum=function wordnum(target){
                var id=false;
                while ((target)&&(target.nodeType!==1))
                    target=target.parentNode;
                if ((target)&&((id=target.id))&&
                    (target.tagName==="SPAN")&&
                    (id.search(prefix)===0))
                    return parseInt(id.slice(stripid),10);
                else return false;};
            
            this.startEvent=function startEvent(evt){
                var target=fdjtUI.T(evt);
                if (trace)
                    fdjtLog("startEvent %o, target=%o, wrappers=%o",
                            evt,target,wrappers);
                var j=0, n_wrappers=wrappers.length; while (j<n_wrappers) {
                    var wrapper=wrappers[j++];
                    if ((hasParent(wrapper,target))||(hasParent(target,wrapper))) {
                        var taphold=tapholds[wrapper.id];
                        if (trace)
                            fdjtLog("Using TapHold handler @%d for wrapper %s (#%d)",
                                    j-1,wrapper.id,taphold.serial);
                        taphold.fakePress(evt);
                        return;}}};

            return this;}

        TextSelect.prototype.toString=function(){
            var wrappers=this.wrappers; 
            var output="TextSelect(["+
                (this.min)+((this.adjust==="start")?("*"):(""))+","+
                (this.max)+((this.adjust==="end")?("*"):(""))+"],";
            
            var i=0, lim=wrappers.length;
            while (i<lim) {
                var id=wrappers[i].id;
                if (id) output=output+((i>0)?(","):(""))+
                    "'"+wrappers[i].id+"'";
                i++;}
            output=output+")";
            return output;};

        function wrapText(node,orig,wrapped,words,prefix){
            var i, lim;
            if (node.nodeType===3) {
                var text=node.nodeValue, span;
                var sliced=text.split(/\b/), wordspans=[];
                i=0; lim=sliced.length;
                while (i<lim) {
                    var word=sliced[i++];
                    if (word.length===0) continue;
                    else if ((word.search(/\S/)>=0)&&
                             (word.search(/\s/)>=0)) {
                        var scan=word;
                        while (scan.length) {
                            var space=scan.search(/\s/);
                            var notspace=scan.search(/\S/);
                            var split=((space<=0)?(notspace):
                                       (notspace<=0)?(space):
                                       (space<notspace)?(space):
                                       (notspace));
                            if (split<=0) split=scan.length;
                            span=fdjtDOM("span.fdjtword",scan.slice(0,split));
                            span.id=prefix+"_"+(words.length);
                            words.push(span);
                            wordspans.push(span);
                            scan=scan.slice(split);}}
                    else {
                        span=fdjtDOM("span.fdjtword",word);
                        span.id=prefix+"_"+(words.length);
                        words.push(span);
                        wordspans.push(span);}}
                return fdjtDOM("span.fdjtselectwrap",wordspans);}
            else if (node.nodeType!==1) return node;
            else if (node.className==='fdjtselectwrap') return node;
            else if (node.nodeType===1) {
                var children=node.childNodes;
                if (!(children)) return node;
                else if (children.length===0) return node;
                else if (node.className==='fdjtselectwrap') return node;
                else {
                    i=0; lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        var wrap=wrapText(child,orig,wrapped,words,prefix);
                        if (child!==wrap) {
                            orig.push(child);
                            wrapped.push(wrap);
                            node.replaceChild(wrap,child);}}
                    return node;}}}

        /* Selecting ranges */

        function selectWords(words,start,end){
            var i=start; while (i<=end)
                words[i++].className="fdjtselected";}
        function deselectWords(words,start,end){
            var i=start; while (i<=end)
                words[i++].className="fdjtword";}

        TextSelect.prototype.setRange=function(start,end){
            if (trace) fdjtLog("TextSelect.setRange %o %o for %o",
                               start,end,this);
            if (!(start)) {
                if ((this.start)&&(this.end)) {
                    deselectWords(this.words,this.min,this.max);}
                this.start=this.end=false;
                this.min=this.max=-1;
                this.n_words=0;
                if (this.onchange) this.onchange();
                return;}
            var words=this.words;
            var min=this.wordnum(start), max=this.wordnum(end);
            if (max<min) {
                var tmp=start; start=end; end=tmp;
                tmp=min; min=max; max=tmp;}
            if (!(this.start)) {
                // First selection
                selectWords(words,min,max);
                words[max].className='fdjtselectend';
                words[min].className='fdjtselectstart';}
            else if ((this.start===start)&&(this.end===end)) return;
            else {
                // Minimize the effort for a change in selection
                var cur_min=this.wordnum(this.start);
                var cur_max=this.wordnum(this.end);
                if ((min>cur_max)||(max<cur_min)) {
                    deselectWords(words,cur_min,cur_max);
                    selectWords(words,min,max);}
                else {
                    // Overlapping, just do the difference
                    if (min<cur_min) selectWords(words,min,cur_min);
                    else if (min>cur_min) deselectWords(words,cur_min,min);
                    else {}
                    if (max>cur_max) selectWords(words,cur_max,max);
                    else if (max<cur_max) deselectWords(words,max,cur_max);
                    else {}}
                words[max].className="fdjtselectend";
                words[min].className="fdjtselectstart";}
            this.min=min; this.max=max;
            this.start=start; this.end=end;
            this.n_words=(max-min)+1;
            if (this.onchange) this.onchange();};

        /* Handler support */
        
        function overWord(word,tapped){
            var sel=false, id=false;
            while ((word)&&(word.nodeType!==1)) word=word.parentNode;
            if (hasParent(word,".fdjtselectloupe"))
                return;
            if ((word)&&((id=word.id))&&
                (word.tagName==='SPAN')&&
                (id.search("fdjtSel")===0)) {
                var split=id.indexOf("_");
                if (split) sel=selectors[id.slice(0,split)];}
            if (!(sel)) {
                var container=word; while (container) {
                    if ((container.className)&&(container.id)&&
                        (container.className.search(/\bfdjtselecting\b/)>=0))
                        break;
                    else container=container.parentNode;}
                if (!(container)) return false;
                else sel=selectors[container.id];}
            if (!(sel)) return false;
            if (trace) fdjtLog("overWord %o, sel=%o, tapped=%o, adjust=%o",
                               word,sel,tapped,sel.adjust);
            if (!(sel.start))
                // We could have some smarts here to include quoted
                //  phrases, capitalization runs, etc.
                sel.setRange(word,word);
            else if (sel.start===sel.end)
                // Just one word is selected, so use the touched word
                // as the 'end' and let setRange sort out the correct
                // order
                sel.setRange(sel.start,word);
            else {
                var off=sel.wordnum(word);
                var start=sel.start, end=sel.end;
                // Check that you're consistent with the end you're moving
                if ((sel.adjust==='start')&&(off>sel.max)) return;
                if ((sel.adjust==='end')&&(off<sel.min)) return;
                // Figure out whether you're moving the beginning or end
                if (sel.adjust==='start') start=word;
                else if (sel.adjust==='end') end=word;
                else if (start===word) sel.setAdjust('start');
                else if (end===word) sel.setAdjust('end');
                else if (off<=sel.min) {
                    start=word; sel.setAdjust('start');}
                else if (off>=sel.max) {
                    end=word; sel.setAdjust('end');}
                else if ((off-sel.min)<6) {
                    start=word; sel.setAdjust('start');}
                else if ((sel.max-off)<6) {
                    end=word; sel.setAdjust('end');}
                else if (tapped) return;
                else if ((off-sel.min)>((sel.max-sel.min)/2)) {
                    end=word; sel.setAdjust('end');}
                else {
                    start=word; sel.setAdjust('start');}
                sel.setRange(start,end);}
            if (sel.loupe) {
                var parent=word.parentNode, loupe=sel.loupe;
                loupe.innerHTML=""; loupe.style.display="";
                if ((word.previousSibling)&&
                    (word.previousSibling.nodeType===1)&&
                    (word.previousSibling!==loupe)) {
                    var before=fdjtDOM.clone(word.previousSibling);
                    loupe.appendChild(before);}
                var clone=fdjtDOM.clone(word); stripIDs(clone);
                loupe.appendChild(clone);
                if ((word.nextSibling)&&(word.nextSibling.nodeType===1)&&
                    (word.nextSibling!==loupe)) {
                    var after=fdjtDOM.clone(word.nextSibling);
                    loupe.appendChild(after);}
                if (word.nextSibling)
                    parent.insertBefore(loupe,word.nextSibling);
                else parent.appendChild(loupe);}
            if (tapped) setTimeout(1000,function(){
                loupe.display='none';});
            return true;}

        function getSelector(word){
            var id=false;
            if ((word)&&((id=word.id))&&
                (word.tagName==='SPAN')&&
                (id.search("fdjtSel")===0)) {
                var split=id.indexOf("_");
                if (split)
                    return selectors[id.slice(0,split)]||false;
                else return false;}
            else return false;}
        TextSelect.getSelector=getSelector;

        // Getting the selection text
        // This tries to be consistent with textify functions in fdjtDOM
        TextSelect.prototype.setString=function(string){
            var wrappers=this.wrappers;
            var whole=((wrappers.length===1)&&(wrappers[0]));
            if (!(whole)) {
                whole=fdjtDOM("div"); 
                var i=0, lim=wrappers.length;
                while (i<lim) {
                    var wrapper=wrappers[i++];
                    whole.appendChild(wrapper.cloneNode(true));}}
            var found=fdjtDOM.findString(whole,string);
            if (!(found)) return;
            var start=found.startContainer, end=found.endContainer;
            while ((start)&&(start.nodeType!==1)) start=start.parentNode;
            while ((end)&&(end.nodeType!==1)) end=end.parentNode;
            if ((start)&&(end)&&(start.id)&&(end.id)&&
                (start.id.search(this.prefix)===0)&&
                (end.id.search(this.prefix)===0)) {
                start=document.getElementById(start.id);
                end=document.getElementById(end.id);}
            else return;
            if ((start)&&(end)) this.setRange(start,end);};

        TextSelect.prototype.getString=function(start,end){
            if (!(start)) start=this.start; if (!(end)) end=this.end;
            var wrappers=this.wrappers; 
            var combine=[]; var prefix=this.prefix; var wpos=-1;
            var scan=start; while (scan) {
                if (scan.nodeType===1) {
                    var style=getStyle(scan);
                    if (style.display!=='inline') combine.push("\n");}
                if ((scan.nodeType===1)&&(scan.tagName==='SPAN')&&
                    (scan.id)&&(scan.id.search(prefix)===0)) {
                    combine.push(scan.firstChild.nodeValue);
                    if (scan===end) break;}
                if ((scan.firstChild)&&
                    (scan.className!=="fdjtselectloupe")&&
                    (scan.firstChild.nodeType!==3))
                    scan=scan.firstChild;
                else if (scan.nextSibling) scan=scan.nextSibling;
                else {
                    while (scan) {
                        if ((wpos=position(scan,wrappers))>=0) break;
                        else if (scan.nextSibling) {
                            scan=scan.nextSibling; break;}
                        else scan=scan.parentNode;}
                    if (wpos>=0) {
                        if ((wpos+1)<wrappers.length)
                            scan=wrappers[wpos+1];}}
                if (!(scan)) break;}
            return combine.join("");};

        TextSelect.prototype.getOffset=function(under){
            if (!(this.start)) return false;
            var first_word=this.words[0]; 
            if (under) {
                var words=this.words; var i=0, lim=words.length;
                if (!((hasParent(this.start,under))&&
                      (hasParent(this.end,under))))
                    return false;
                while ((i<lim)&&(!(hasParent(first_word,under))))
                    first_word=words[i++];}
            var selected=this.getString();
            var preselected=this.getString(first_word,this.end);
            return preselected.length-selected.length;};
        
        TextSelect.prototype.getInfo=function(under){
            if (!(this.start)) return false;
            var selected=this.getString();
            var first_word=this.words[0]; 
            if (under) {
                var words=this.words; var i=0, lim=words.length;
                if (!((hasParent(this.start,under))&&
                      (hasParent(this.end,under))))
                    return false;
                while ((i<lim)&&(!(hasParent(first_word,under))))
                    first_word=words[i++];}
            var preselected=this.getString(first_word,this.end);
            if (trace) 
                fdjtLog("GetInfo %o: start=%o, end=%o, off=%o, string=%o",
                        this,this.start,this.end,
                        preselected.length-selected.length,selected);
            return { start: this.start, end: this.end,
                     off: preselected.length-selected.length,
                     string: selected};};
        
        TextSelect.prototype.setAdjust=function(val){
            if (trace) fdjtLog("TextSelect.setAdjust %o for %o",val,this);
            if (val) {
                this.adjust=val;
                fdjt.DOM.swapClass(
                    this.nodes,/\b(fdjtadjuststart|fdjtadjustend)\b/,
                    "fdjtadjust"+val);}
            else {
                this.adjust=false;
                fdjt.DOM.dropClass(
                    this.nodes,/\b(fdjtadjuststart|fdjtadjustend)\b/);}};


        // Life span functions

        TextSelect.prototype.clear=function(){
            var wrappers=this.wrappers;
            var orig=this.orig, wrapped=this.wrapped;
            if (!(orig)) return; // already cleared
            var i=orig.length-1;
            while (i>=0) {
                var o=orig[i], w=wrapped[i]; i--;
                w.parentNode.replaceChild(o,w);}
            var j=0, lim=wrappers.length;
            while (j<lim) {
                var wrapper=wrappers[j++];
                delete tapholds[wrapper.id];
                delete selectors[wrapper.id];}
            delete selectors[this.prefix];
            delete this.wrapped; delete this.orig;
            delete this.wrappers; delete this.nodes;
            delete this.words; delete this.wrappers;
            delete this.start; delete this.end;};
        
        // Handlers

        function hold_handler(evt){
            evt=evt||event;
            var target=fdjtUI.T(evt);
            while ((target)&&(target.nodeType!==1)) target=target.parentNode;
            if ((target)&&(target.id)&&(target.tagName==='SPAN')&&
                (target.id.search("fdjtSel")===0)) {
                if (trace) fdjtLog("hold %o t=%o",evt,target);
                if (overWord(target)) fdjtUI.cancel(evt);}}
        TextSelect.hold_handler=hold_handler;
        TextSelect.handler=hold_handler;
        function tap_handler(evt){
            evt=evt||event;
            var target=fdjtUI.T(evt);
            while ((target)&&(target.nodeType!==1)) target=target.parentNode;
            if ((target)&&(target.id)&&(target.tagName==='SPAN')&&
                (target.id.search("fdjtSel")===0)) {
                var sel=getSelector(target);
                if (trace) fdjtLog("tap %o t=%o sel=%o",evt,target,sel);
                // Tapping on a single word selection clears it
                if (sel.n_words===1) sel.setRange(false);
                else if ((target.className==="fdjtselectstart")||
                         (target.className==="fdjtselectend")) {
                    // Tapping on a start or end selects just that word
                    fdjtUI.cancel(evt);
                    sel.setRange(target,target);}
                // Otherwise, call overWord, which makes the word the
                //  beginning or end of the selection
                else if (overWord(target,true)) {
                    if (target.className==="fdjtselectstart")
                        sel.adjust="start";
                    else if (target.className==="fdjtselectend")
                        sel.adjust="end";
                    else sel.adjust=false;
                    fdjtUI.cancel(evt);}
                else if (sel) sel.adjust=false;}}
        TextSelect.tap_handler=tap_handler;
        function release_handler(evt,sel){
            evt=evt||event;
            var target=fdjtUI.T(evt);
            if (trace) fdjtLog("release %o t=%o sel=%o",evt,target,sel);
            if (sel) {
                sel.setAdjust(false);
                if (sel.loupe) sel.loupe.style.display='none';}}
        function slip_handler(evt,sel){
            evt=evt||event;
            var target=fdjtUI.T(evt);
            if (trace) fdjtLog("slip %o t=%o sel=%o",evt,target,sel);
            if (sel) {
                if (sel.loupe) sel.loupe.style.display='none';}}
        TextSelect.release_handler=release_handler;
        function get_release_handler(sel,also){
            return function(evt){
                release_handler(evt,sel);
                if (also) also(evt,sel);};}
        function get_slip_handler(sel,also){
            return function(evt){
                slip_handler(evt,sel);
                if (also) also(evt,sel);};}
        
        function addHandlers(container,sel,opts){
            var taphold=new fdjtUI.TapHold(container,opts);
            fdjtDOM.addListener(container,"tap",
                                ((opts)&&(opts.ontap))||
                                tap_handler);
            fdjtDOM.addListener(container,"hold",
                                ((opts)&&(opts.onhold))||
                                hold_handler);
            fdjtDOM.addListener(
                container,"release",
                get_release_handler(sel,opts.onrelease||false));
            fdjtDOM.addListener(
                container,"slip",
                get_slip_handler(sel,opts.onslip||false));
            return taphold;}

        TextSelect.Trace=function(flag,thtoo){
            if ((flag)&&(thtoo)) fdjt.TapHold.Trace(true);
            if (typeof flag === "undefined") {
                trace=(!(trace));}
            else trace=flag;};
        
        // Return the constructor
        return TextSelect;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
