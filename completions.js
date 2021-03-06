/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/completions.js ###################### */

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
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));
if (!(fdjt.UI)) fdjt.UI={};

(function(){
    "use strict";
    var fdjtString=fdjt.String;
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var RefDB=fdjt.RefDB, fdjtID=fdjt.ID;

    var rAF=fdjtDOM.requestAnimationFrame;
    var async=fdjt.async;

    var serial=0;

    /* Constants */
    // Always set to distinguish no options from false
    var FDJT_COMPLETE_OPTIONS=1;
    // Whether the completion element is a cloud (made of spans)
    var FDJT_COMPLETE_CLOUD=2;
    // Whether to require that completion match an initial segment
    var FDJT_COMPLETE_ANYWORD=4;
    // Whether to match case in keys to completions
    var FDJT_COMPLETE_MATCHCASE=8;
    // Whether to an enter character always picks a completion
    var FDJT_COMPLETE_EAGER=16;
    // Default options
    var default_options=
        ((FDJT_COMPLETE_OPTIONS)|
         (FDJT_COMPLETE_CLOUD)|
         (FDJT_COMPLETE_ANYWORD));
    // Milliseconds to wait for auto complete
    var complete_delay=100;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getChildren=fdjtDOM.getChildren;
    var getParent=fdjtDOM.getParent;
    var getStyle=fdjtDOM.getStyle;
    var position=RefDB.position;

    var isEmpty=fdjtString.isEmpty;
    var hasPrefix=fdjtString.hasPrefix;
    var prefixAdd=fdjtString.prefixAdd;
    var prefixFind=fdjtString.prefixFind;
    var commonPrefix=fdjtString.commonPrefix;

    fdjtUI.FDJT_COMPLETE_OPTIONS=FDJT_COMPLETE_OPTIONS;
    fdjtUI.FDJT_COMPLETE_CLOUD=FDJT_COMPLETE_CLOUD;
    fdjtUI.FDJT_COMPLETE_ANYWORD=FDJT_COMPLETE_ANYWORD;
    fdjtUI.FDJT_COMPLETE_MATCHCASE=FDJT_COMPLETE_MATCHCASE;
    fdjtUI.FDJT_COMPLETE_EAGER=FDJT_COMPLETE_EAGER;

    var ValueMap=fdjt.Map||RefDB.Map;

    function Completions(dom,input,options) {
        this.dom=dom||false; this.input=input||false;
        this.options=options||default_options;
        this.nodes=[]; this.values=[]; this.serial=++serial;
        this.cues=[]; this.displayed=[]; this.known={};
        this.prefixtree={strings: []}; this.bykey={};
        this.byvalue=new ValueMap();
        this.selected=false; this.selclass=false;
        if (!((options)&(FDJT_COMPLETE_MATCHCASE))) this.stringmap={};
        this.initialized=false;
        return this;}

    // A completion is a DOM node with a 'key' string for matching
    //  and a 'value' for using.  A completion can include *variations*
    //  (with CSS class variation) which have different key values.
    
    // The key is either stored as a DOM property, attribute, 
    function getKey(node){
        return node.key||(node.getAttribute("data-key"))||
            (node.getAttribute("key"))||
            ((hasClass(node,"variation"))&&(fdjtDOM.textify(node)))||
            ((hasClass(node,"completion"))&&(completionText(node,"")));}
    Completions.getKey=getKey;
    // This gets the text of a completion node, excluding variations
    // and any fdjtdecoration(s).
    function completionText(node,sofar){
        if (node.nodeType===3) return sofar+node.nodeValue;
        else if (hasClass(node,"variation")) return sofar;
        else if (hasClass(node,"fdjtskiptext")) return sofar;
        else if ((node.nodeType===1)&&(node.childNodes)) {
            var children=node.childNodes;
            var i=0; var lim=children.length;
            while (i<lim) {
                var child=children[i++];
                if (child.nodeType===3) sofar=sofar+child.nodeValue;
                else if (child.nodeType===1)
                    sofar=completionText(child,sofar);
                else {}}
            return sofar;}
        else return sofar;}

    /* You can add a node to a completions lookup table.  We update
     * bykey and the prefix table. */
    function addNodeKey(node,keystring,ptree,bykey,anywhere){
        var keys=((anywhere)?(keystring.split(/\W/g)):[]).concat(keystring);
        var i=0; var lim=keys.length;
        while (i<lim) {
            var key=keys[i++];
            prefixAdd(ptree,key,0);
            if ((bykey[key])&&(bykey.hasOwnProperty(key)))
                bykey[key].push(node);
            else bykey[key]=new Array(node);
            bykey._count++;}}

    /* Get nodes for a completion */
    function getNodes(string,ptree,bykey,matchcase){
        var result=[]; var direct=[]; var variations=[];
        var keystring=stdspace(string);
        if (isEmpty(keystring)) return [];
        if (!(matchcase)) keystring=string.toLowerCase();
        var strings=prefixFind(ptree,keystring,0);
        var prefix=false;
        var exact=[]; var exactheads=[]; var keys=[];
        var i=0; var lim=strings.length;
        while (i<lim) {
            var s=strings[i++];
            var isexact=(s===keystring);
            if (prefix) prefix=commonPrefix(prefix,s,false,(!(matchcase)));
            else prefix=s;
            var completions=bykey[s];
            if (completions) {
                var j=0; var jlim=completions.length;
                while (j<jlim) {
                    var c=completions[j++];
                    if (hasClass(c,"hidden")) {}
                    // Skip redundant completions
                    else if (result.indexOf(c)>=0) {}
                    else if (hasClass(c,"completion")) {
                        if (isexact) {exactheads.push(c); exact.push(c);}
                        result.push(c); keys.push(s); direct.push(c);}
                    else {
                        var head=getParent(c,".completion");
                        if ((head)&&(hasClass(head,"hidden"))) {}
                        else if (head) {
                            if (isexact) exact.push(head);
                            result.push(head); keys.push(s);
                            variations.push(c);}}}}}
        if (exact.length) result.exact=exact;
        if (exactheads.length) result.exactheads=exactheads;
        result.prefix=prefix;
        result.strings=strings;
        result.matches=direct.concat(variations);
        return result;}

    function addCompletion(c,completion,key,value) {
        if (typeof key === "undefined")
            key=completion.key||getKey(completion);
        if (!(value))
            value=(completion.value)||(completion.getAttribute('value'))||key;
        if (!(completion._seen)) {
            c.nodes.push(completion);
            completion._seen=true;
            if (value) {
                c.values.push(value);
                c.byvalue.add(value,completion);}}
        else return;
        c.curstring=c.maxstring=false;
        if (key) addCompletionKeys(c,completion,key);}

    function addCompletionKeys(c,completion,key) {
        if (!(key)) key=completion.key||getKey(completion);
        var opts=c.options;
        var container=c.dom;
        var ptree=c.prefixtree;
        var bykey=c.bykey;
        var smap=c.stringmap;
        var stdkey=stdspace(key), lower;
        var matchcase=((opts)&(FDJT_COMPLETE_MATCHCASE));
        var anyword=((opts)&(FDJT_COMPLETE_ANYWORD));
        if (!(matchcase)) {
            lower=stdkey.toLowerCase();
            smap[lower]=stdkey;
            stdkey=lower;}
        if (!(getParent(completion,container)))
            fdjtDOM.append(container,completion," ");
        addNodeKey(completion,stdkey,ptree,bykey,anyword);
        if (hasClass(completion,"cue")) c.cues.push(completion);
        var variations=getChildren(completion,".variation");
        var i=0; var lim=variations.length;
        while (i<lim) {
            var variation=variations[i++];
            var vkey=stdspace(variation.key||getKey(variation));
            if (!(matchcase)) {
                lower=vkey.toLowerCase();
                smap[lower]=vkey;
                vkey=lower;}
            addNodeKey(variation,vkey,ptree,bykey,anyword);}}

    function initCompletions(c){
        var completions=getChildren(c.dom,".completion");
        var i=0; var lim=completions.length;
        while (i<lim) addCompletion(c,completions[i++]);
        c.initialized=true;}

    Completions.prototype.addCompletion=function(completion,key,value) {
        if (!(this.initialized)) initCompletions(this);
        addCompletion(this,completion,key,value);
        if (this.visible) this.visible=false;};
    Completions.prototype.addKeys=function(completion,key) {
        if (!(this.initialized)) {
            initCompletions(this);
            addCompletion(this,completion,key);}
        else addCompletionKeys(this,completion,key);
        if (this.visible) this.visible=false;};

    function updateDisplay(c,todisplay){
        var displayed=c.displayed;
        var i, lim;
        if (displayed) {
            i=0; lim=displayed.length;
            while (i<lim) dropClass(displayed[i++],"displayed");
            c.displayed=displayed=[];}
        else c.displayed=displayed=[];
        if (todisplay) {
            i=0; lim=todisplay.length;
            while (i<lim) {
                var node=todisplay[i++];
                if (hasClass(node,"completion")) {
                    addClass(node,"displayed");
                    displayed.push(node);}
                else {
                    var head=getParent(node,".completion");
                    if ((head)&&(!(hasClass(head,"displayed")))) {
                        displayed.push(node); displayed.push(head);
                        addClass(head,"displayed");
                        addClass(node,"displayed");}}}}
        // Clear the visible ordered elements cache
        c.visible=false;
        // Move the selection if neccessary
        if ((c.selection)&&(!(hasClass(c.selection,"displayed"))))
            if (!(c.selectNext()))
                if (!(c.selectPrevious()))
                    c.clearSelection();
        if (c.updated) c.updated.call(c);}
    
    Completions.prototype.getCompletions=function(string) {
        if ((string===this.curstring)||(string===this.maxstring)||
            ((this.curstring)&&(this.maxstring)&&
             (hasPrefix(string,this.curstring))&&
             (hasPrefix(this.maxstring,string))))
            return this.result;
        else {
            var result, that=this;
            if (!(this.initialized)) initCompletions(this);
            if (isEmpty(string)) {
                result=[]; result.prefix=""; result.matches=[];
                if (this.dom) addClass(this.dom,"noinput");}
            else {
                result=getNodes(string,this.prefixtree,this.bykey,
                                ((this.options)&(FDJT_COMPLETE_MATCHCASE)));
                if (this.dom) dropClass(this.dom,"noinput");
                rAF(function(){updateDisplay(that,result.matches);});}
            if ((this.stringmap)&&(this.strings)) {
                var stringmap=this.stringmap;
                var strings=this.strings;
                var i=0; var lim=strings.length;
                while (i<lim) {
                    var s=strings[i]; var m=stringmap[s];
                    if (m) strings[i++]=m;
                    else i++;}}
            this.curstring=string;
            this.maxstring=result.prefix||string;
            this.result=result;
            return result;}};

    Completions.prototype.getValue=function(completion) {
        if (completion.value) return completion.value;
        else if (completion.getAttribute("data-value"))
            return completion.getAttribute("data-value");
        else if (completion.getAttribute("value"))
            return completion.getAttribute("value");
        var pos=position(this.nodes,completion);
        if (pos<0) return false;
        else return this.values[pos];};
    Completions.prototype.getKey=function(completion) {
        if (completion.key) return completion.key;
        else if (completion.getAttribute("data-key"))
            return completion.getAttribute("data-key");
        else if (completion.getAttribute("key"))
            return completion.getAttribute("key");
        else return getKey(completion);};

    Completions.prototype.complete=function(string,callback){
        var that=this;
        if (!(this.initialized)) initCompletions(this);
        // fdjtLog("Completing on %o",string);
        if ((!(string))&&(string!==""))
            string=((this.getText)?(this.getText(this.input)):
                    (hasClass(this.input,"isempty"))?(""):
                    (this.input.value));
        if (isEmpty(string)) {
            rAF(function(){
                if (that.displayed) updateDisplay(that,false);
                addClass(that.dom,"noinput");
                dropClass(that.dom,"nomatches");
                if (callback) async(function(){callback([]);});});
            return [];}
        var result=this.getCompletions(string);
        if ((!(result))||(result.length===0)) {
            rAF(function(){
                updateDisplay(that,false);
                dropClass(that.dom,"noinput");
                addClass(that.dom,"nomatches");
                if (callback) async(function(){callback(result);});});
            return [];}
        else {
            rAF(function(){
                updateDisplay(that,result.matches);
                dropClass(that.dom,"noinput");
                dropClass(that.dom,"nomatches");
                if (callback) async(function(){callback(result);});});
            return result;}};

    Completions.prototype.getByValue=function(values,spec){
        if (!(this.initialized)) initCompletions(this);
        var result=[];
        var byvalue=this.byvalue;
        if (spec) spec=new fdjtDOM.Selector(spec);
        if (!(values instanceof Array)) values=[values];
        var i=0; var lim=values.length;
        while (i<lim) {
            var value=values[i++];
            var completions=byvalue.get(value);
            if (completions) {
                if (!(completions instanceof Array))
                    completions=[completions];
                if (spec) {
                    var j=0; var jlim=completions.length;
                    while (j<jlim) {
                        if (spec.match(completions[j]))
                            result.push(completions[j++]);
                        else j++;}}
                else result=result.concat(completions);}}
        return result;};
    Completions.prototype.getByKey=function(keys,spec){
        if (!(this.initialized)) initCompletions(this);
        var result=[];
        var bykey=this.bykey;
        if (spec) spec=new fdjtDOM.Selector(spec);
        if (!(keys instanceof Array)) keys=[keys];
        var i=0; var lim=keys.length;
        while (i<lim) {
            var key=keys[i++];
            var completions=bykey[key];
            if (completions) {
                if (!(completions instanceof Array))
                    completions=[completions];
                if (spec) {
                    var j=0; var jlim=completions.length;
                    while (j<jlim) {
                        if (spec.match(completions[j]))
                            result.push(completions[j++]);
                        else j++;}}
                else result=result.concat(completions);}}
        return result;};

    Completions.prototype.setCues=function(values,cueclass){
        if (!(this.initialized)) initCompletions(this);
        if (!(cueclass)) cueclass="cue";
        var cues=[];
        var byvalue=this.byvalue;
        var i=0; var lim=values.length;
        while (i<lim) {
            var value=values[i++];
            var completions=byvalue.get(value);
            if (completions) {
                if (!(completions instanceof Array))
                    completions=[completions];
                var j=0; var jlim=completions.length;
                while (j<jlim) {
                    var c=completions[j++];
                    if (hasClass(c,cueclass)) continue;
                    addClass(c,cueclass);
                    cues.push(c);}}}
        return cues;};

    Completions.prototype.setClass=function(values,classname){
        if (!(this.initialized)) initCompletions(this);
        var drop=fdjtDOM.getChildren(this.dom,".completion."+classname);
        if ((drop)&&(drop.length))
            dropClass(fdjtDOM.Array(drop),"hidden");
        var changed=[];
        var byvalue=this.byvalue;
        var i=0; var lim=values.length;
        while (i<lim) {
            var value=values[i++];
            var completions=byvalue.get(value);
            if (completions) {
                if (!(completions instanceof Array))
                    completions=[completions];
                var j=0; var jlim=completions.length;
                while (j<jlim) {
                    var c=completions[j++];
                    if (hasClass(c,classname)) continue;
                    addClass(c,classname);
                    changed.push(c);}}}
        return changed;};
    Completions.prototype.extendClass=function(values,classname){
        if (!(this.initialized)) initCompletions(this);
        var changed=[];
        var byvalue=this.byvalue;
        var i=0; var lim=values.length;
        while (i<lim) {
            var value=values[i++];
            var completions=byvalue.get(value);
            if (completions) {
                if (!(completions instanceof Array))
                    completions=[completions];
                var j=0; var jlim=completions.length;
                while (j<jlim) {
                    var c=completions[j++];
                    if (hasClass(c,classname)) continue;
                    addClass(c,classname);
                    changed.push(c);}}}
        return changed;};
    
    Completions.prototype.dropClass=function(classname){
        var drop=fdjtDOM.getChildren(this.dom,".completion."+classname);
        if ((drop)&&(drop.length))
            dropClass(fdjtDOM.Array(drop),classname);};

    Completions.prototype.docomplete=function(input,callback){
        if (!(this.initialized)) initCompletions(this);
        if (!(input)) input=this.input;
        var delay=this.complete_delay||complete_delay;
        var that=this;
        if (this.timer) {
            clearTimeout(that.timer);
            that.timer=false;}
        this.timer=setTimeout(
            function(){
                if (!(input)) input=that.input;
                var completions=that.complete(input.value);
                if (callback) callback(completions);},
            delay);};

    function stdspace(string){
        return string.replace(/\s+/," ").replace(/(^\s)|(\s$)/,"");}

    fdjtUI.Completions=Completions;

    /* Selection from list/cloud */

    var Selector=fdjtDOM.Selector;

    function gatherVisible(root){
        var scan=root.firstChild; var displayed=[];
        while (scan!==root) {
            if (scan.nodeType===1) {
                var iscompletion=hasClass(scan,"completion");
                if ((iscompletion)&&(getStyle(scan).display!=="none")) 
                    displayed.push(scan);
                if ((scan.firstChild)&&(!(iscompletion))) {
                    scan=scan.firstChild; continue;}}
            while ((scan!==root)&&(!(scan.nextSibling)))
                scan=scan.parentNode;
            if (scan!==root) scan=scan.nextSibling;}
        return displayed;}

    // This gets visible nodes in their order of appearance, for which
    // we can't use .nodes or .displayed
    Completions.prototype.getVisible=function getVisible(){
        if (this.visible) return this.visible;
        else {
            var visible=this.visible=gatherVisible(this.dom);
            return visible;}};

    Completions.prototype.select=function select(completion){
        var pref=false; var displayed=this.getVisible();
        if (completion instanceof Selector) {
            pref=completion; 
            completion=false;}
        if ((!(completion))&&(pref)) {
            var nodes=displayed;
            var i=0; var lim=nodes.length; while (i<lim) {
                var node=nodes[i++];
                if (hasClass(node,pref)) {completion=node; break;}
                else continue;}}
        if ((!(completion))&&(displayed.length))
            completion=displayed[0];
        if (this.selection) dropClass(this.selection,"selected");
        addClass(completion,"selected");
        this.selection=completion;
        return completion;};
    
    Completions.prototype.selectNext=function(selection){
        if (!(selection)) {
            if (this.selection) selection=this.selection;
            else selection=false;}
        var nodes=this.getVisible(), dflt=false, found=false;
        var i=0, lim=nodes.length; while (i<lim) {
            var node=nodes[i++];
            if (!(dflt)) dflt=node;
            if (!(selection)) {
                selection=node; break;}
            else if (node===selection) {
                selection=false; found=true;}
            else continue;}
        if (this.selection) dropClass(this.selection,"selected");
        if (!(found)) selection=dflt;
        addClass(selection,"selected");
        this.selection=selection;
        return selection;};

    Completions.prototype.selectPrevious=function(selection){
        if (!(selection)) {
            if (this.selection) selection=this.selection;
            else selection=false;}
        var nodes=this.getVisible(), dflt=false, found=false;
        var i=nodes.length-1; while (i>=0) {
            var node=nodes[i--];
            if (!(dflt)) dflt=node;
            if (!(selection)) {
                selection=node; break;}
            else if (node===selection) {
                selection=false; found=true;}
            else continue;}
        if (this.selection) dropClass(this.selection,"selected");
        if (!(found)) selection=dflt;
        if (selection) addClass(selection,"selected");
        this.selection=selection;
        return selection;};

    Completions.prototype.clearSelection=function(selection){
        if ((selection)&&(this.selection)&&(selection!==this.selection))
            return false;
        if (!(this.selection)) return;
        dropClass(this.selection,"selected");
        this.selection=false;
        return true;};

    /* Options, handlers, etc */

    var cached_completions={};

    function onkey(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var name=target.name;
        var completions=cached_completions[name];
        var compid=fdjtDOM.getAttrib(target,"completions");
        var dom=((compid)&&(fdjtID(compid)));
        if (!(dom)) return;
        if (!((completions)&&(completions.dom===dom))) {
            completions=new Completions(dom,target,default_options);
            cached_completions[name]=completions;}
        if (!(completions)) return;
        completions.docomplete(target);}
    fdjtUI.Completions.onkey=onkey;
    
    function update(evt){
        evt=evt||window.event;
        if (typeof evt==='string') evt=fdjtID(evt);
        if (!(evt)) return;
        var target=((evt.nodeType)?(evt):(fdjtUI.T(evt)));
        var name=target.name;
        var completions=cached_completions[name];
        var compid=fdjtDOM.getAttrib(target,"completions");
        var dom=((compid)&&(fdjtID(compid)));
        if (!(dom)) return;
        if (!((completions)&&(completions.dom===dom))) {
            completions=new Completions(dom,target,default_options);
            cached_completions[name]=completions;}
        if (!(completions)) return;
        completions.docomplete(target);}
    fdjtUI.Completions.update=update;

}());

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
