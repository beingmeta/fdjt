/* -*- Mode: Javascript; -*- */

/* ################# fdjt/dialog.js ###################### */

/* Copyright (C) 2012-2013 beingmeta, inc.

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

/* Non-blocking alerts and messages */

fdjt.Dialog=(function(){
    
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;
    var Template=fdjt.Template;
    var template=fdjt.Template;
    var Templates=fdjt.Templates;

    var hasClass=fdjtDOM.hasClass;
    var addToClass=fdjtDOM.addToClass;

    var countdown_serial=1; var countdown_tickers={};

    function Dialog(spec){
        if (!(spec)) spec={};
        else if (typeof spec === "string") spec={spec: spec};
        var box=fdjtDOM((spec.spec)||("div.fdjtdialog"));
        if (spec.classes) {
            box.className=(box.className||"")+
                ((box.className)?(" "):(""))+
                spec.classes;}
        if (!((spec.modal)||(spec.keep)||
              (hasClass(box,"fdjtmodal"))||
              (hasClass(box,"fdjtkeep")))) {
            var countdown=fdjtDOM("div.countdown","Closing…");
            countdown.id="FDJTCOUNTDOWN"+(countdown_serial++);
            box.appendChild(countdown);}
        if (!((spec.modal)||(spec.noclose)||(hasClass(box,"fdjtmodal")))) {
            var close_button=fdjtDOM.Image(
                "https://s3.amazonaws.com/static.beingmeta.com/g/codex/redx40x40.png",
                "closebutton","Close");
            close_button.onclick=close_dialog_handler;
            close_button.title="click to close";
            box.appendChild(close_button);}
        if (spec.title) {
            if (spec.title.nodeType) elts.push(spec.title);
            else {
                var title_text=template(spec.title,spec,spec.data);
                box.title=title_text;
                box.appendChild(fdjtDOM("div.title",title_text));}}
        var elts=[]; var i=1, lim=arguments.length;
        while (i<lim) {
            var arg=arguments[i++];
            if (arg.nodeType) box.appendChild(arg);
            else if (typeof arg === "string") {
                arg=Templates[arg]||arg;
                var ishtml=(arg.indexOf('<')>=0);
                var istemplate=(arg.search("{{")>=0);
                if ((ishtml)&&(istemplate))
                    box.appendChild(Template.toDOM(arg,spec));
                else if (ishtml)
                    fdjtDOM.append(box,arg);
                else if (istemplate)
                    box.appendChild(document.createTextNode(template(arg,spec)));
                else box.appendChild(document.createTextNode(arg));}
            else box.appendChild(document.createTextNode(arg.toString));}
        if ((spec.id)&&(!(box.id))) box.id=spec.id;
        fdjtDOM.addListeners(box,spec);
        return box;}
    var makeDialog=Dialog;

    function remove_dialog(evt){
        evt=evt||event;
        var target=((evt)?((evt.nodeType)?(evt):(fdjtUI.T(evt))):
                    ((fdjtID("FDJTALERT"))||(fdjtID("FDJTDIALOG"))));
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        if (box) {
            clear_countdown(box);
            fdjtDOM.remove(box);}}
    
    function close_dialog(evt){
        evt=evt||event;
        var target=((evt)?((evt.nodeType)?(evt):(fdjtUI.T(evt))):
                    ((fdjtID("FDJTALERT"))||(fdjtID("FDJTDIALOG"))));
        if ((evt)&&(!(evt.nodeType))) fdjtUI.cancel(evt);
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        if (box) {
            clear_countdown(box);
            if ((fdjtDOM.transitionEnd)&&
                (!(fdjtDOM.hasClass(box,"closing")))) {
                fdjtDOM.addListener(box,fdjtDOM.transitionEnd,function(){
                    fdjtDOM.remove(box);});
                fdjtDOM.addClass(box,"closing");}
            else fdjtDOM.remove(box);}}

    function clear_countdown(box){
        var countdown=fdjtDOM.getChild(box,".countdown");
        if (countdown) {
            var ticker=countdown_tickers[countdown.id];
            delete countdown_tickers[countdown.id];
            if (ticker) clearInterval(ticker);
            fdjtDOM.remove(countdown);}}

    function close_dialog_handler(evt){
        evt=evt||event;
        fdjtUI.cancel(evt);
        close_dialog(evt);}

    function stop_countdown_onclick(evt){
        evt=evt||event;
        var target=fdjtUI.T(evt);
        var box=fdjtDOM.getParent(target,".fdjtdialog");
        clear_countdown(box);
        box.style[fdjtDOM.transitionDelay]="";
        box.style[fdjtDOM.transitionDuration]="";
        fdjtDOM.dropClass(box,"countdown");
        fdjtDOM.dropClass(box,"closing");
        fdjtUI.cancel(evt);}

    function alertBox(){
        var args=fdjtDOM.toArray(arguments);
        var box=Dialog.apply(null,[{}].concat(args));
        addToClass(box,"fdjtalert");}
    Dialog.alertBox=alertBox;
    fdjtUI.alertBox=alertBox;

    function alertfn(){
        var curbox=fdjtID("FDJTALERT");
        if (curbox) {
            curbox.id="";
            fdjtDOM.dropClass(curbox,"closing");
            remove_dialog(curbox);}
        var args=fdjtDOM.toArray(arguments);
        var box=Dialog.apply(null,[{}].concat(args));
        box.id="FDJTALERT"; fdjtDOM.prepend(document.body,box);
        return box;}
    Dialog.alert=alertfn;
    fdjtUI.alert=alertfn;
    fdjt.alert=alertfn;

    function setCountdown(box,timeout,whendone){
        var countdown=fdjtDOM.getChild(box,".countdown");
        countdown.innerHTML="…"+timeout+"…";
        var n=timeout;
        box.style[fdjtDOM.transitionDelay]=(n/2)+"s";
        box.style[fdjtDOM.transitionDuration]=(n/2)+"s";
        var ticker=setInterval(function(){
            if (n<=0) {
                clearInterval(ticker); ticker=false;
                delete countdown_tickers[countdown.id];
                if (whendone) whendone();
                fdjtDOM.remove(box);}
            else countdown.innerHTML="…"+(n--)+"…";},
                               1000);
        countdown_tickers[countdown.id]=ticker;
        fdjtDOM.addListener(box,"click",stop_countdown_onclick);
        setTimeout(function(){fdjtDOM.addClass(box,"closing");},10);
        return box;}
    Dialog.setCountdown=setCountdown;
    fdjtUI.setCountdown=setCountdown;

    function alertFor(timeout){
        var curbox=fdjtID("FDJTALERT");
        if (curbox) {
            curbox.id="";
            fdjtDOM.dropClass(curbox,"closing");
            remove_dialog(curbox);}
        var args=[{timeout: timeout}].concat(fdjtDOM.slice(arguments,1));
        var box=Dialog.apply(null,args);
        box.id="FDJTALERT"; fdjtDOM.prepend(document.body,box);
        setCountdown(box,timeout);
        return box;}
    Dialog.alertFor=alertFor;
    fdjtUI.alertFor=alertFor;

    function makeChoice(spec,close_choice,i){
        var dom=spec.dom||
            ((spec.label)&&(fdjtDOM("button",spec.label)))||
            fdjtDOM("button","Choice "+i);
        dom.onmousedown=fdjtUI.cancel;
        dom.onmouseup=fdjtUI.cancel;
        dom.tabIndex=i;
        dom.onclick=function(evt){
            evt=evt||event;
            var target=fdjtUI.T(evt);
            var choices=fdjtDOM.getParent(target,".choices");
            var cursel=fdjtDOM.getChild(choices,".selected");
            if (cursel===dom) {}
            else {
                if (cursel) {
                    fdjtDOM.dropClass(cursel,"selected");
                    cursel.blur();}
                fdjtDOM.addClass(dom,"selected");
                dom.focus();}
            if (spec.handler) spec.handler();
            fdjtUI.cancel(evt);
            close_choice();};
        return dom;}

    function choose(spec){
        var box=false; var selection=-1, buttons=[], choices;
        var close_button=false;
        function close_choice(){
            var i=0, lim=buttons.length;
            while (i<lim) {
                buttons[i].onclick=null;
                buttons[i].onmousedown=null;
                buttons[i].onmouseup=null;
                i++;}
            if (close_button) close_button.onclick=null;
            if (box) box.onclick=null;
            if (box) box.onkeydown=null;
            if (box) {
                var timeout=setTimeout(function(){
                    remove_dialog(box); clearTimeout(timeout); timeout=false;},
                                       500);}}
        if (typeof spec === "function") 
            choices=[{label: "Cancel"},
                     {label: "OK",handler: spec,isdefault: true}];
        else if (spec.constructor === Array) choices=spec;
        else if (spec.choices) choices=spec.choices;
        else if ((spec.label)&&(spec.handler)) 
            choices=[{label: "Cancel"},spec];
        else if (spec.handler) 
            choices=[{label: "Cancel"},
                     {label: "OK", handler: spec.handler,
                      isdefault: spec.isdefault}];
        else if (choices.length) choices=spec;
        else {
            fdjtLog.warn("Bad spec %o to fdjtUI.choose");
            return;}
        var i=0, lim=choices.length;
        while (i<lim) {
            var choice=choices[i];
            var button=makeChoice(choice,close_choice,i);
            buttons.push(button);
            if ((selection<0)&&(choice.isdefault)) {
                button.setAttribute("autofocus","autofocus");
                fdjtDOM.addClass(button,"selected");
                selection=i;}
            i++;}
        if (selection<0) selection=0; 
        box=makeDialog(
            {},fdjtDOM("div.message",fdjtDOM.slice(arguments,1)),
            fdjtDOM("div.choices",buttons));
        close_button=fdjtDOM.getChild(box,".closebutton");
        if (spec.cancel) close_button.onclick=close_choice;
        else fdjtDOM.remove(close_button);
        
        var cancel=(spec.cancel)||false;
        
        // For accessibility, handle tab/enter
        box.onkeydown=function(evt){
            evt=evt||event;
            var kc=evt.keyCode;
            if (kc===9) {
                if (evt.shiftKey) selection--; else selection++;
                if (selection<0) selection=buttons.length-1;
                else if (selection>=buttons.length) selection=0;
                buttons[selection].focus();
                fdjtUI.cancel(evt);}
            else if (kc===13) {
                if (choices[selection].handler)
                    (choices[selection].handler)();
                close_choice();
                fdjtUI.cancel(evt);}
            else if ((cancel)&&(kc===27)) {
                close_choice();
                fdjtUI.cancel(evt);}};
        fdjtDOM.addClass(box,"fdjtconfirm"); box.id="FDJTDIALOG";
        fdjtDOM.prepend(document.body,box);
        if (spec.timeout)
            setCountdown(box,spec.timeout,function(){
                if (choices[selection].handler) choices[selection].handler();});
        buttons[selection].focus();
        return box;}
    Dialog.Choice=choose;
    Dialog.choose=choose;
    fdjtUI.choose=choose;
    fdjt.Choice=choose;

    fdjt.UI.Dialog=Dialog;
    return Dialog;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/

