/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/kb.js ###################### */

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

/*
  _fdjtid: unique integer assigned to objects
  fdjtKB.register (assigns unique ID)
  fdjtKB.Pool (creates a pool of named objects)
  fdjtKB.Set (creates a sorted array for set operations)
  fdjtKB.Ref (objects created within a pool)
*/

var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

if (!(fdjt.RefDB)) {
    fdjt.RefDB=(function(){
        "use strict";
        var fdjtState=fdjt.State;
        var fdjtTime=fdjt.Time;
        var fdjtLog=fdjt.Log;
        var fdjtDOM=fdjt.DOM;
        var JSON=(window.JSON)||(fdjt.JSON);
        var warn=fdjt.Log.warn;
        var log=fdjt.Log;

        var refdbs={}, all_refdbs[];
        var aliases={}, atmaps={};

        function refDB(name,init){
            var db=this;
            if (refdbs[name]) {
                db=refdbs[name];
                if ((init)&&(db.init)) {
                    if (db.xinits) db.xinits.push(init);
                    else db.xinits=[init];}
                else if (init) db.init=init;
                else init={}}
            else if ((init)&&(init.aliases)&&(checkAliases(init.aliases))) {
                db=checkAliases(init.aliases);
                if (db.aliases.indexOf(db.name)>=0) db.name=name;
                if ((init)&&(db.init)) {
                    if (db.xinits) db.xinits.push(init);
                    else db.xinits=[init];}
                else if (init) db.init=init;
                else init={}}
            else {
                if (!(init)) init={};
                this.name=name; this.indices={};
                refdbs[name]=this; all_refdbs.push(this);
                this.refs={}; this.all_refs=[]; this.refclass=false;
                this.aliases=[];
                this.storage=init.storage||false;
                this.absrefs=init.absrefs||false;
                this.onload=init.onload||[];
                this.onloadnames={};}
            if (init.hasOwnProperty("absrefs")) db.absrefs=init.absrefs;
            if (init.aliases) {
                var aliases=init.aliases;
                var i=0, lim=aliases.length; while (i<lim) {
                    var alias=aliases[i++];
                    if (aliases[alias]) {
                        if (aliases[alias]!==db)
                            warn("Alias %s for %o already associated with %o",
                                 alias,db,aliases[alias]);}
                    else {
                        aliases[alias]=db;
                        db.aliases.push(alias);}}}
            if (init.onload) {
                var onload=init.onload;
                for (var methname in onload) {
                    if (onload.hasOwnProperty(methname)) 
                        db.onLoader(oload[methname],methname);}}
            
            return this;}

        function checkAliases(aliases){
            var i=0, lim=aliases.length;
            while (i<lim) {
                var alias=aliases[i++];
                var db=refdbs[alias];
                if (db) return db;}
            return false;}

        refDB.open=function refDBOpen(name){
            return refdbs[name]||aliases[name]||(new refDB(name));};

        refDB.prototype.ref=function DBref(id){
            return (this.refs[id])||
                ((this.refclass)&&(new (this.refclass)(id)))||
                (new Ref(id,this));};
        refDB.prototype.probe=function DBprobe(id){return (this.refs[id]);};
        refDB.prototype.addAlias=function DBaddAlias(alias){
            if (aliases[alias]) {
                if (aliases[alias]!==this) 
                    warn("Alias %s for %o already associated with %o",
                         alias,this,aliases[alias]);}
            else {
                aliases[alias]=this;
                this.aliases.push(alias);}};

        refDB.prototype.onLoader=function(method,name,noupdate){
            if ((name)&&(this.onloadnames[name])) {
                var cur=this.onloadnames[name];
                if (cur===method) return;
                var pos=this.onload.indexOf(cur);
                if (cur<0) {
                    warn("Couldn't replace named onload method %s for <refDB %s>",
                         name,this.name);
                    return;}
                else {
                    this.onload[pos]=method;
                    newmeths.push(method);}}
            else this.onload.push(method);
            if (name) this.onloadnames[name]=method;
            var loaded=[].concat(db.all_loaded);
            fdjtTime.slowMap(function(ref){
                var methn=0, methlim=newmeths.length; while (methn<methlim) {
                    if (ref._live) newmeths[methn](ref);}},
                             loaded);};
        
        var uuid_pat=/^((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})$/;
        var xuuid_pat=/^((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}t[0-9a-zA-Z]+)$/;
        var refpat=/^(((:|)@(([0-9a-fA-F]+\/[0-9a-fA-F]+)|(\/\w+\/.*)))|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}t[0-9a-zA-Z]+))$/;
        function resolveRef(arg,db,force){
            if (arg instanceOf Ref) return ref;
            else if ((db)&&(db.refs[arg])) return db.refs[arg];
            else if ((typeof arg === "string")&&(refpat.exec(string))) {
                var at=arg.indexOf('@');
                if ((at===1)&&(at[0]===':')) {arg=arg.slice(1); at=0;}
                if (at>0) db=refDB.open(arg.slice(at+1));
                else if (at<0) {
                    var uuid;
                    if (arg.search(":#U")===0) uuid=arg.slice(3);
                    else if (arg.search("#U")===0) uuid=arg.slice(2);
                    else if (arg.search("U")===0) uuid=arg.slice(1);
                    else uuid=arg;
                    var type=uuid.indexOf('t'), tail=uuid.rindexOf('-');
                    if (type>0) type="UUID"+uuid.slice(type); else type=false;
                    if (tail>0) tail="UUID"+uuid.slice(tail); else tail=false;
                    var known_db=((type)&&(refdbs[type]||aliases[type]))||
                        ((tail)&&(refdbs[tail]||aliases[tail]));
                    if (known_db) db=known_db;
                    else if ((force)&&(tail)) {
                        db=new refDB(type||tail);
                        if (type) db.addAlias(tail);}
                    else db=false;}
                else {
                    var atprefix, slash;
                    if (arg[1]==='/') {
                        slash=arg.slice(2).indexOf('/');
                        if (slash>0) slash=slash+2;}
                    else slash=arg.indexOf('/');
                    atprefix=arg.slice(at,slash+1);
                    db=refdbs[atprefix]||aliases[atprefix]||((force)&&(new refDB(atprefix)));}}
            else {}
            if (!(db)) return false;
            if (db.refs[arg]) return (db.refs[arg])
            else if (force) return db.ref(arg);
            else return false;}
        refDB.resolve=resolveRef;

        function Ref(id,db,instance){
            if (db.refs[id]) return db.refs[id];
            else if (instance) {
                instance._id=id; instance._db=db;
                if (!(db.absrefs)) instance._domain=db.name;
                db.refs[id]=instance;
                db.all_refs.push(instance);
                return instance;}
            else if (db.refclass)
                return new (db.refclass)(id,db);
            else {
                this._id=id; this._db=db;
                if (!(db.absrefs)) this._domain=db.name;
                db.refs[id]=this;
                db.all_refs.push(this);
                return this;}}

        Ref.prototype.Import=function refImport(data,index){
            var indices=this._db.indices;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var value=data[key];
                    if ((typeof value === "number")||
                        ((typeof value === "string")&&
                         (!(refpat.exec(value))))) 
                        this[key]=value;
                    else this[key]=value=importValue(value,this._db);
                    if ((index)&&(indices[key])) 
                        indexRef(this,key,indices[key]);}}
            this._live=fdjtTime();};
        function importValue(value,db,index){
            if (value instanceof Ref) return value;
            else if ((typeof value === "object")&&(value._id)) {
                var ref;
                if (value._domain) ref=refDB(value._domain).ref(value._id);
                else ref=refDB.resolve(value._id,db,true);
                for (var slot in value) {
                    if (value.hasOwnProperty(slot))
                        ref[slot]=importValue(value[slot],db);}
                return ref;}
            else if (value instanceof Array) {
                var i=0, lim=value.length; var imports=false;
                while (i<lim) {
                    var elt=value[i++];
                    var imported=importValue(elt,db);
                    if (elt!==imported) {
                        if (imports) imports.push(imported);
                        else {
                            imports=value.slice(0,i);
                            imports.push(imported);}}
                    else if (imports) imports.push(elt);
                    else {}}
                if (imports) {
                    if (imports.length===1) return imports[0];
                    else return fdjtSet(imports);}
                else if (value.length===1) return value[1];
                else return fdjtSet(value);}
            else if (typeof value === "object") {
                var copied=false, fields=[];
                for (var field in value) {
                    if (value.hasOwnProperty(field)) {
                        var fieldval=value[field];
                        var importval=importValue(fieldval,db);
                        if (fieldval!==importval) {
                            if (!(copied)) {
                                copied={};
                                if (fields.length) {
                                    var j=0, jlim=fields.length;
                                    while (j<jlim) { var f=fields[j++]; copied[f]=value[f];}}}
                            copied[field]=importval;}
                        else if (copied) copied[name]=fieldval;
                        else fields.push(field);}}
                return copied||value;}
            else return value;}
        Ref.importValue=importValue;
        refDB.prototype.importValue=function(val){return importValue(val,this);};
        
        Ref.prototype.Export=function refImport(){
            var exported={};
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    var value=data[key];
                    if ((typeof value === "number")||(typeof value === "string"))
                        exported[key]=value;
                    else if (value instanceof Ref) {
                        if (ref.db.absrefs)
                            exported[key]={_id: ref._id};
                        else exported[key]={_id: ref._id, _domain: ref._domain||ref.db.name};}
                    else exported[key]=exportValue(value,this._db);}}
            return exported;};
        function exportValue(value,db){
            if (value instanceof Ref) {
                if (ref._db===db) return {_id: ref._id};
                else if (ref._db.absrefs) return {_id: ref._id};
                else return {_id: ref._id, _domain: ref._domain||ref._db.name};}
            else if (value instanceof Array) {
                var i=0, lim=value.length; var exports=false;
                while (i<lim) {
                    var elt=value[i++];
                    var exported=exportValue(elt,db);
                    if (elt!==imported) {
                        if (exports) exports.push(exported);
                        else {
                            exports=value.slice(0,i);
                            exprots.push(exported);}}
                    else if (exports) exports.push(elt);
                    else {}}
                if (typeof value._sortlen === "number")
                    return exports||value;
                else return [exports||value];}
            else if (typeof value === "object") {
                var copied=false, fields=[];
                for (var field in value) {
                    if (value.hasOwnProperty(field)) {
                        var fieldval=value[field];
                        var exportval=exportValue(fieldval,db);
                        if (fieldval!==exportval) {
                            if (!(copied)) {
                                copied={};
                                if (fields.length) {
                                    var j=0, jlim=fields.length;
                                    while (j<jlim) { var f=fields[j++]; copied[f]=value[f];}}}
                            copied[field]=exportval;}
                        else if (copied) copied[name]=fieldval;
                        else fields.push(field);}}
                return copied||value;}
            else return value;}
        Ref.exportValue=exportValue;
        refDB.prototype.exportValue=function(val){return exportValue(val,this);};
        
        refDB.prototype.load=function loadRefs(refs,callback){
            if (!(this.storage)) return;
            else if (this.storage instanceof window.Storage) {
                var storage=this.storage;
                var i=0, lim=refs.length; while (i<lim) {
                    var ref=refs[i++];
                    if (typeof ref === "string") ref=this.ref(ref);
                    if (ref._live) continue;
                    var key=((this.absrefs)?(ref._id):(ref._id+"@"+this.name));
                    var stringval=this.storage[key];
                    ref.Import(JSON.parse(stringval));}
                if (callback) callback();}
            else if (window.IndexedDB) {}
            else {}};
        refDB.prototype.save=function saveRefs(refs,callback){
            if (!(this.storage)) return;
            else if (this.storage instanceof window.Storage) {
                var storage.this.storage;
                var i=0, lim=refs.length; while (i<lim) {
                    var ref=refs[i++];
                    if (typeof ref === "string") ref=this.ref(ref);
                    if (!(ref._live)) continue;
                    var key=((this.absrefs)?(ref._id):(ref._id+"@"+this.name));
                    this.storage.setItem(key,JSON.stringify(ref.Export()));}
                if (callback) callback();}
            else if (window.IndexedDB) {}
            else {}};

        function getKeystring(val,db){
            if (val instanceof Ref) {
                if (val._db===db) return val._id;
                else if (val._domain) return val._id+"@"+val._domain;
                else return val._id;}
            else if (typeof val === "number") 
                return "\u00ad"+val;
            else if (typeof val === "string")
                else return val;
            else return val.toString();}

        function indexRef(ref,key,val,index){
            var keystrings=[];
            if (val instanceof Ref) {
                if (ref._db===val._db) keystrings=[val._id];
                else if (val._domain) keystrings=[val._id+"@"+val._domain];
                else else keystrings=[val._id];}
            else if (val instanceof Array) {
                var db=ref._db;
                var i=0, lim=val.length; while (i<lim) {
                    var elt=val[i++];
                    var ks=getKeystring(elt,db);
                    if (ks) keystrings.push(ks);}}
            else if (typeof val === "number") 
                keystrings=["\u00ad"+val];
            else if (typeof val === "string")
                keystrings=[val];
            else {}
            if (keystrings.length) {
                var j=0, jlim=keystrings.length; while (j<jlim) {
                    var keystring=keystrings[j++]; var refs=index[keystring];
                    if (refs) refs.push(ref); else index[keystring]=[ref];}}}

        refDB.prototype.find=function findRefs(key,value){
            var indices=this.indices[key];
            if (indices) return indices[getKeystring(value,this)];
            else return [];}
        
        // Array utility functions
        function arr_contains(arr,val,start){
            return (arr.indexOf(val,start||0)>=0);}
        function arr_position(arr,val,start){
            return arr.indexOf(val,start||0);}

        var id_counter=1;

        /* Fast sets */
        function set_sortfn(a,b) {
            if (a===b) return 0;
            else if (typeof a === typeof b) {
                if (typeof a === "number")
                    return a-b;
                else if (typeof a === "string") {
                    if (a<b) return -1;
                    else return 1;}
                else if (a._sortkey<b._sortkey) return -1;
                else return 1;}
            else if (typeof a < typeof b) return -1;
            else return 1;}

        function intersection(set1,set2){
            if (typeof set1 === 'string') set1=[set1];
            if (typeof set2 === 'string') set2=[set2];
            if ((!(set1))||(set1.length===0)) return [];
            if ((!(set2))||(set2.length===0)) return [];
            if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
            if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
            var results=[];
            var i=0; var j=0; var len1=set1.length; var len2=set2.length;
            var allstrings=set1._allstrings&&set2._allstrings;
            var new_allstrings=true;
            while ((i<len1) && (j<len2))
                if (set1[i]===set2[j]) {
                    if ((new_allstrings)&&(typeof set1[i] !== 'string'))
                        new_allstrings=false;
                    results.push(set1[i]);
                    i++; j++;}
            else if ((allstrings)?
                     (set1[i]<set2[j]):
                     (set_sortfn(set1[i],set2[j])<0)) i++;
            else j++;
            results._allstrings=new_allstrings;
            results._sortlen=results.length;
            return results;}
        fdjtKB.intersection=intersection;

        function difference(set1,set2){
            if (typeof set1 === 'string') set1=[set1];
            if (typeof set2 === 'string') set2=[set2];
            if ((!(set1))||(set1.length===0)) return [];
            if ((!(set2))||(set2.length===0)) return set1;
            if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
            if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
            var results=[];
            var i=0; var j=0; var len1=set1.length; var len2=set2.length;
            var allstrings=set1._allstrings&&set2._allstrings;
            var new_allstrings=true;
            while ((i<len1) && (j<len2)) {
                if (set1[i]===set2[j]) {
                    i++; j++;}
                else if ((allstrings)?
                         (set1[i]<set2[j]):
                         (set_sortfn(set1[i],set2[j])<0)) {
                    if ((new_allstrings)&&(typeof set1[i] !== 'string'))
                        new_allstrings=false;
                    results.push(set1[i]);
                    i++;}
                else j++;}
            results._allstrings=new_allstrings;
            results._sortlen=results.length;
            return results;}
        fdjtKB.difference=difference;
        
        function union(set1,set2){
            if (typeof set1 === 'string') set1=[set1];
            if (typeof set2 === 'string') set2=[set2];
            if ((!(set1))||(set1.length===0)) return set2;
            if ((!(set2))||(set2.length===0)) return set1;
            if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
            if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
            var results=[];
            var i=0; var j=0; var len1=set1.length; var len2=set2.length;
            var allstrings=set1._allstrings&&set2._allstrings;
            while ((i<len1) && (j<len2))
                if (set1[i]===set2[j]) {
                    results.push(set1[i]); i++; j++;}
            else if ((allstrings)?
                     (set1[i]<set2[j]):
                     (set_sortfn(set1[i],set2[j])<0))
                results.push(set1[i++]);
            else results.push(set2[j++]);
            while (i<len1) results.push(set1[i++]);
            while (j<len2) results.push(set2[j++]);
            results._allstrings=allstrings;
            results._sortlen=results.length;
            return results;}
        fdjtKB.union=union;

        function merge(set1,set2){
            if (typeof set1 === 'string') set1=[set1];
            if (typeof set2 === 'string') set2=[set2];
            if ((!(set1))||(set1.length===0)) {
                set1.concat(set2);
                set1._sortlen=set2._sortlen;
                set1._allstrings=set2._allstrings;
                return set1;}
            if ((!(set2))||(set2.length===0)) return set1;
            var results=set1;
            set1=[].concat(results);
            var i=0; var j=0; var len1=set1.length; var len2=set2.length;
            var allstrings=set1._allstrings&&set2._allstrings;
            while ((i<len1) && (j<len2))
                if (set1[i]===set2[j]) {
                    results.push(set1[i]); i++; j++;}
            else if ((allstrings)?
                     (set1[i]<set2[j]):
                     (set_sortfn(set1[i],set2[j])<0))
                results.push(set1[i++]);
            else results.push(set2[j++]);
            while (i<len1) results.push(set1[i++]);
            while (j<len2) results.push(set2[j++]);
            results._allstrings=allstrings;
            results._sortlen=results.length;
            return results;}
        fdjtKB.merge=merge;

        function overlaps(set1,set2){
            if (typeof set1 === 'string') set1=[set1];
            if (typeof set2 === 'string') set2=[set2];
            if ((!(set1))||(set1.length===0)) return false;
            if ((!(set2))||(set2.length===0)) return false;
            if (set1._sortlen!==set1.length) set1=fdjtSet(set1);
            if (set2._sortlen!==set2.length) set2=fdjtSet(set2);
            var i=0; var j=0; var len1=set1.length; var len2=set2.length;
            var allstrings=set1._allstrings&&set2._allstrings;
            while ((i<len1) && (j<len2))
                if (set1[i]===set2[j]) return true;
            else if ((allstrings)?
                     (set1[i]<set2[j]):
                     (set_sortfn(set1[i],set2[j])<0)) i++;
            else j++;
            return false;}
        fdjtKB.overlaps=overlaps;

        /* Sets */
        /* sets are really arrays that are sorted to simplify set operations.
           the ._sortlen property tells how much of the array is sorted */
        function fdjtSet(arg){
            var result;
            if (arguments.length===0) return [];
            else if (arguments.length===1) {
                if (!(arg)) return [];
                else if (arg instanceof Array) {
                    if ((!(arg.length))||(arg._sortlen===arg.length))
                        return arg;
                    else if (arg._sortlen) return setify(arg);
                    else return setify([].concat(arg));}
                else {
                    result=[arg]; 
                    if (typeof arg === 'string') result._allstrings=true;
                    result._sortlen=1;
                    return result;}}
            else {
                result=[];
                for (arg in arguments)
                    if (!(arg)) {}
                else if (arg instanceof Array) result.concat(arg);
                else result.push(arg);
                return setify(result);}}
        fdjtKB.Set=fdjtSet;
        fdjt.Set=fdjtSet;

        function setify(array) {
            var len;
            if (array._sortlen===(len=array.length)) return array;
            // else if ((array._sortlen)&&(array._sortlen>1))
            else if (len===0) return array;
            else if (len===1) {
                var elt=array[0];
                array._sortlen=1;
                array._allstrings=(typeof elt === 'string');
                if (typeof elt === "object") {
                    if (elt._sortkey) return array;
                    var sortkey=((elt._id)&&(elt._db)&&
                                 ((elt._db.absrefs)?(elt._id):(elt._id+"@"+elt._db.name)))||
                        elt._fdjtid||(elt._fdjtid=++id_counter);
                    elt._sortkey=sortkey;}
                return array;}
            else {
                var allstrings=true;
                var i=0, lim=array.length;
                while (i<lim) {
                    var elt=array[i++];
                    if ((allstrings)&&(typeof elt !== 'string')) allstrings=false;
                    if (typeof elt === "object") {
                        if (elt._sortkey) continue;
                        var sortkey=((elt._id)&&(elt._db)&&
                                     ((elt._db.absrefs)?(elt._id):(elt._id+"@"+elt._db.name)))||
                            elt._fdjtid||(elt._fdjtid=++id_counter);
                        elt._sortkey=sortkey;}}
                array._allstrings=allstrings;
                if (lim===1) return array;
                if (allstrings) array.sort();
                else array.sort(set_sortfn);
                // Now remove duplicates
                var read=1; var write=1; var readlim=array.length;
                var cur=array[0];
                while (read<readlim) {
                    if (array[read]!==cur) {
                        array[write++]=cur=array[read++];}
                    else read++;}
                array._sortlen=array.length=write;
                return array;}}
        
        function set_add(set,val) {
            if (val instanceof Array) {
                var changed=false;
                for (var elt in val) 
                    if (set_add(set,elt)) changed=true;
                return changed;}
            else if (set.indexOf) {
                var pos=set.indexOf(val);
                if (pos>=0) return false;
                else set.push(val);
                return true;}
            else {
                var i=0; var lim=set.length;
                while (i<lim)
                    if (set[i]===val) return false; else i++;
                if (typeof val !== 'string') set._allstrings=false;
                set.push(val);
                return true;}}
        
        function set_drop(set,val) {
            if (val instanceof Array) {
                var changed=false;
                for (var elt in val)
                    if (set_drop(set,elt)) changed=true;
                return changed;}
            else if (set.indexOf) {
                var pos=set.indexOf(val);
                if (pos<0) return false;
                else set.splice(pos,1);
                return true;}
            else {
                var i=0; var lim=set.length;
                while (i<lim)
                    if (set[i]===val) {
                        set.splice(i,1);
                        return true;}
                else i++;
                return false;}}
        
        /* Maps */
        function Map() {
            this.scalar_map={}; this.object_map={};
            return this;}
        Map.prototype.get=function(key) {
            if (isobject(key))
                return this.object_map
            [key._id||key.oid||key.uuid||key._fdjtid||register(key)];
            else return this.scalar_map[key];};
        Map.prototype.set=function(key,val) {
            if (isobject(key))
                this.object_map
            [key._id||key.oid||key.uuid||key._fdjtid||register(key)]=val;
            else this.scalar_map[key]=val;};
        Map.prototype.add=function(key,val) {
            var cur;
            if (isobject(key)) {
                var objkey=key._id||key.oid||key.uuid||key._fdjtid||
                    register(key);
                cur=this.object_map[objkey];
                if (!(cur)) {
                    this.object_map[objkey]=[val];
                    return true;}
                else if (!(cur instanceof Array)) {
                    if (cur===val) return false;
                    else {
                        this.object_map[objkey]=[cur,val];
                        return true;}}
                else if (arr_contains(cur,val)) return false;
                else {
                    cur.push(val); return true;}}
            else  {
                cur=this.scalar_map[key];
                if (!(cur)) {
                    this.scalar_map[key]=[val];
                    return true;}
                else if (!(cur instanceof Array)) {
                    if (cur===val) return false;
                    else {
                        this.scalar_map[key]=[cur,val];
                        return true;}}
                else if (arr_contains(cur,val)) return false;
                else {
                    cur.push(val); return true;}}};
        Map.prototype.drop=function(key,val) {
            var cur;
            if (!(val)) {
                if (isobject(key))
                    delete this.object_map
                [key._id||key.oid||key.uuid||key._fdjtid||register(key)];
                else delete this.scalar_map[key];}
            else if (isobject(key)) {
                var objkey=key._id||key.oid||key.uuid||key._fdjtid||
                    register(key);
                cur=this.object_map[key];
                if (!(cur)) return false;
                else if (!(cur instanceof Array)) {
                    if (cur===val) {
                        delete this.object_map[objkey];
                        return true;}
                    else return false;}
                else if ((pos=arr_position(val,cur))>=0) {
                    if (cur.length===1) delete this.object_map[objkey];
                    else cur.splice(pos);
                    return true;}
                else return false;}
            else {
                cur=this.scalar_map[key]; var pos=-1;
                if (!(cur)) return false;
                else if (!(cur instanceof Array)) {
                    if (cur===val) {
                        delete this.scalar_map[key];
                        return true;}
                    else return false;}
                else if ((pos=arr_position(val,cur))>=0) {
                    if (cur.length===1)
                        delete this.scalar_map[key];
                    else cur.splice(pos);
                    return true;}
                else return false;}};
        fdjtKB.Map=Map;

        /* Indices */

        function Index() {
            var scalar_indices={};
            var object_indices={};
            var dontindex=false;
            var index=function(item,prop,val,add){
                var valkey; var indices=scalar_indices;
                if (!(prop))
                    return {
                        scalars: scalar_indices,
                        objects: object_indices};
                else if ((dontindex)?(dontindex[prop]):(prop[0]==='_'))
                    return false;
                else if (!(val))
                    return {
                        scalars: scalar_indices[prop],
                        objects: object_indices[prop]};
                else if (isobject(val)) {
                    valkey=val._id||val.uuid||val.oid||val._fdjtid||
                        register(val);
                    indices=object_indices;}
                else valkey=val;
                var index=indices[prop];
                if (!(item))
                    if (!(index)) return [];
                else return fdjtSet(index[valkey]);
                var itemkey=
                    ((isobject(item))?
                     (item._id||item.uuid||item.oid||
                      item._fdjtid||register(item)):
                     (item));
                if (!(index))
                    if (add) {
                        indices[prop]=index={};
                        index[valkey]=[itemkey];
                        return true;}
                else return false;
                var curvals=index[valkey];
                if (curvals) {
                    var pos=arr_position(curvals,itemkey);
                    if (pos<0) {
                        if (add) {
                            curvals.push(itemkey);
                            return true;}
                        else return false;}
                    else if (add) return false;
                    else {
                        var sortlen=curvals._sortlen;
                        curvals.splice(pos,1);
                        if (pos<sortlen) curvals._sortlen--;
                        return true;}}
                else if (add) {
                    index[valkey]=fdjtSet(itemkey);
                    return true;}
                else return false;};
            return index;}
        fdjtKB.Index=Index;

        /* Refs */

        function Ref(pool,qid) {
            if (pool) this.pool=pool;
            if (qid) this._id=qid;
            return this;}
        fdjtKB.Ref=Ref;
        Pool.prototype.cons=function(qid){
            return new Ref(this,qid);};

        Ref.prototype.load=function(){
            if (this._init) return this;
            else if (this.pool.storage) 
                return this.pool.storage.load(this);
            else return undefined;};
        Ref.prototype.get=function(prop){
            if (this.hasOwnProperty(prop)) return this[prop];
            else if (this.pool.storage) {
                var fetched=this.pool.storage.get(this,prop);
                if (typeof fetched !== 'undefined') {
                    this[prop]=fetched;
                    return fetched;}
                else if (this.hasOwnProperty(prop))
                    return this[prop];
                else return fetched;}
            else return undefined;};
        Ref.prototype.getSet=function(prop){
            if (this.hasOwnProperty(prop)) {
                var val=this[prop];
                if (val instanceof Array) {
                    if (val._sortlen===val.length) return val;
                    else return setify(val);}
                else return [val];}
            else if (this.pool.storage) {
                var fetched=this.pool.storage.get(this,prop);
                if (typeof fetched !== 'undefined')
                    this[prop]=fetched;
                else fetched=this[prop]||[];
                return setify(fetched);}
            else return [];};
        Ref.prototype.getArray=function(prop){
            if (this.hasOwnProperty(prop)) {
                var val=this[prop];
                if (val instanceof Array) return val;
                else return [val];}
            else if (this.pool.storage) {
                var fetched=this.pool.storage.get(this,prop);
                if (typeof fetched !== 'undefined')
                    this[prop]=fetched;
                return [fetched];}
            else return [];};
        Ref.prototype.add=function(prop,val,restore){
            if (this.pool.xforms[prop])
                val=this.pool.xforms[prop](val)||val;
            if (this.hasOwnProperty(prop)) {
                var cur=this[prop];
                if (cur===val) return false;
                else if (cur instanceof Array)
                    if (!(set_add(cur,val))) return false;
                else {}
                else this[prop]=fdjtSet([cur,val]);}
            else this[prop]=val;
            if ((this.pool.storage)&&(!(restore)))
                this.pool.storage.add(this,prop,val);
            if ((this.pool.effects)&&(this.pool.effects[prop]))
                this.pool.effects[prop](this,prop,val);
            if (this.pool.index)
                this.pool.index(this,prop,val,true);
            return true;};
        Ref.prototype.drop=function(prop,val){
            if (typeof val === 'undefined') val=this[prop];
            if (this.pool.xforms[prop])
                val=this.pool.xforms[prop](val)||val;
            if (prop==='_id') {}
            else if (this.hasOwnProperty(prop)) {
                var cur=this[prop];
                if (cur===val) delete this[prop];
                else if (cur instanceof Array) {
                    if (!(set_drop(cur,val))) return false;
                    if (cur.length===0) delete this[prop];}
                else return false;
                if (this.pool.storage)
                    this.pool.storage.drop(this,prop,val);
                if (this.pool.index)
                    this.pool.index(this,prop,val,false);
                return true;}
            else return false;};
        Ref.prototype.test=function(prop,val){
            if (this.pool.xforms[prop])
                val=this.pool.xforms[prop](val)||val;
            if (this.hasOwnProperty(prop)) {
                if (typeof val === 'undefined') return true;
                var cur=this[prop];
                if (cur===val) return true;
                else if (cur instanceof Array)
                    if (arr_contains(cur,val)) return true;
                else return false;
                else return false;}
            else if (this.pool.storage) {
                var fetched=this.pool.storage.get(this,prop);
                if (typeof fetched !== 'undefined')
                    this[prop]=fetched;
                else return false;
                if (typeof val === 'undefined') return true;
                else return this.test(prop,val);}
            else return false;};
        Ref.prototype.store=function(prop,val,restore){
            var toadd=[], todrop=[];
            if (this.hasOwnProperty(prop)) {
                var cur=this[prop];
                if (cur===val) return false;
                else {
                    toadd=difference(val,cur);
                    todrop=difference(cur,val);}}
            else if (val instanceof Array)
                toadd=val;
            else toadd=[val];
            var i=0, lim=todrop.length;
            while (i<lim) this.drop(prop,todrop[i++]);
            i=0, lim=toadd.length; while (i<lim) this.add(prop,toadd[i++]);
            return true;};
        Ref.prototype.ondrop=function(){
            for (var prop in this)
                if ((prop!=='pool')&&(prop!=='qid'))
                    this.drop(prop,this[prop]);};
        function init_ref(data){
            // If it's already been initialized, we're updating
            if (this._init) return this.update(data);
            // This is called initialize a reference the first time we
            //  get data for it
            var pool=this.pool; var map=pool.map; var value, i, lim;
            this._init=fdjtTime();
            if (((debug)&&(pool.traceref))||(debug>1))
                log("Initial reference to %o <== %o @%d",
                    this,data,this._init);
            for (var key in data) {
                // We assume that data doesn't inherit anything,
                //  so we don't need a 'hasOwnProperty' check
                if ((key==='qid')||(key==='pool')) {}
                else if ((key==='_id')||(key==='oid')||(key==='oid')) {
                    value=data[key];
                    if (!(map[value])) map[value]=this;
                    else if (map[value]!==this)
                        warn("identifier conflict %o=%o for %o and %o",
                             key,value,map[value],this);
                    else {}}
                else if (key[0]==='_') {}
                else {
                    // We use the .add method to get any side effects
                    value=data[key]; var qid;
                    if (typeof value === "undefined") {
                        this.drop(key);}
                    else if (value instanceof Array) {
                        i=0, lim=value.length;
                        while (i<lim) {
                            var v=value[i++]; /* back to here */
                            if ((!(v))&&(v!==false)&&(v!==0)) {}
                            else if ((qid=((v._qid)||(v._id)))) {
                                pool=getPool(qid);
                                if (pool) this.add(key,pool.Import(v),true);
                                else this.store(key,v,true);}
                            else this.store(key,v,true);}}
                    else if ((qid=((value._qid)||(value._id)))) {
                        pool=getPool(qid);
                        if (pool) this.store(key,pool.Import(value),true);
                        else this.store(key,value,true);}
                    else this.store(key,value,true);}}
            // Now we run the init procedures for the pool
            var inits=pool.inits;
            if (inits) {
                if (((debug)&&(pool.traceinit))||(debug>2))
                    log("Running pool inits for %o: %o",this,inits);
                i=0, lim=inits.length;
                while (i<lim) inits[i++](this);}
            // We now run local delayed inits
            inits=this._inits; delete this._inits;
            if (inits) {
                if (((debug)&&(pool.traceinit))||(debug>2))
                    log("Running delayed inits for %o: %o",this,inits);
                delete this._inits;
                i=0, lim=inits.length;
                while (i<lim) inits[i++](this);}
            return this;}
        Ref.prototype.init=init_ref;

        function update_ref(data){
            var i, lim;
            if (!(this._init)) return this.init(data);
            if ((this._modified)&&(data._modified)&&
                (this._modified>data._modified))
                return this;
            for (var key in data)
                if (data.hasOwnProperty(key)) {
                    if ((key==="pool")||(key==="init")) continue;
                    var val=data[key], cur=this[key];
                    if (val===cur) continue;
                    else if (!(cur)) {
                        if (val instanceof Array) {
                            i=0, lim=val.length;
                            while (i<lim) this.add(key,val[i++],true);}
                        else this.add(key,val);}
                    else if ((val instanceof Array)||
                             (cur instanceof Array)) {
                        var toadd=difference(val,cur);
                        var todrop=difference(cur,val);
                        i=0, lim=todrop.length;
                        while (i<lim) this.drop(key,todrop[i++],true);
                        i=0, lim=toadd.length;
                        while (i<lim) this.add(key,toadd[i++],true);}
                    else {
                        this.drop(key,cur,true);
                        this.add(key,val,true);}}
            return this;}
        Ref.prototype.update=update_ref;
        Ref.prototype.oninit=function(fcn,name){
            var pool=this.pool;
            var debugging=(((debug)&&(pool.traceinit))||(debug>2));
            if (this._init) {
                // If it's already been initialized, just call the function
                if (debugging) {
                    if (name) 
                        log("Init/%s current %o with %o",name,this,fcn);
                    else log("Init current %o with %o",this,fcn);}
                fcn(this);
                return true;}
            else if (this._inits) {
                // Save up the init functions
                if (!(name)) {
                    if (this._inits.indexOf(fcn)<0) {
                        if (debugging) log("Delay init on %o: %o",this,fcn);
                        this._inits.push(fcn);}}
                // Don't do anything if the named init has already been added
                    /* Note that name can't be anything that an array object
                       might inherit (like 'length'). */ 
                else if (this._inits[name]===fcn) {
                    if (debugging)
                        log("Already added %s init on %o: %o",this,fcn);}
                else if (this._inits[name]) {
                    var oldfcn=this._inits[name];
                    var oldpos=this._inits.indexOf(oldfcn);
                    warn("Replacing existing %s init on %o with %o, old=%o",
                         name,this,fcn,oldfcn);
                    this._inits[name]=fcn;
                    if (oldpos<0) this._inits.push(fcn);
                    else this._inits[oldpos]=fcn;}
                else {
                    if (debugging)
                        fdjtLog("Delay %s init on %o: %o",name,this,fcn);
                    this._inits[name]=fcn;
                    this._inits.push(fcn);}}
            else if (name) {
                if (debugging)
                    fdjtLog("Delay %s init on %o: %o",name,this,fcn);
                this._inits=[fcn];
                this._inits[name]=fcn;}
            else {
                fdjtLog("Delay init on %o: %o",this,fcn);
                this._inits=[fcn];}
            return false;};

        Ref.prototype.toHTML=function(){
            var dom=false;
            return ((this.pool.forHTML)&&(this.pool.forHTML(this)))||
                ((this.pool.forDOM)&&(dom=this.pool.forDOM(this))&&
                 (dom.outerHTML))||
                this._id||this.oid||this.uuid;};
        Ref.prototype.toDOM=function(){
            return ((this.pool.forDOM)&&(this.pool.forDOM(this)))||
                ((this.pool.forHTML)&&(fdjtDOM(this.pool.forHTML(this))))||
                (fdjtDOM("span.fdjtref",this._id||this.oid||this.uuid));};


        /* Using offline storage to back up pools
           In the simplest model, the QID is just used as a key
           in local storage to store a JSON version of the object. */

        var getLocal=fdjtState.getLocal;
        var setLocal=fdjtState.setLocal;
        var dropLocal=fdjtState.dropLocal;
        var jsonString=JSON.stringify;

        function OfflineKB(pool){
            this.pool=pool; var map=pool.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    var obj=map[key];
                    var qid=obj._qid||obj.uuid||obj.oid||obj._id;
                    if (qid) {
                        var objpool=obj.pool;
                        obj.pool="@@"+(objpool.absref||objpool.name);
                        setLocal(qid,jsonString(obj));
                        obj.pool=objpool;}}}
            return this;}
        function offline_get(obj,prop){
            var qid=obj._qid||obj.uuid||obj.oid||obj._id;
            var data=getLocal(qid);
            if (data) obj.init(data);
            return obj[prop];}
        OfflineKB.prototype.load=function(obj){
            var qid=obj._qid||obj.uuid||obj.oid||obj._id;
            var data=getLocal(qid,true);
            if (data) return obj.init(data);
            else return undefined;};
        OfflineKB.prototype.probe=function(qid){
            return getLocal(qid,true);};
        OfflineKB.prototype.get=offline_get;
        OfflineKB.prototype.add=function(obj,slotid,val){
            var qid=obj._qid||obj.uuid||obj.oid||obj._id;
            if ((slotid)&&(val))
                setLocal(qid,jsonString(obj));};
        OfflineKB.prototype.drop=function(obj,slotid,val){
            var qid=obj._qid||obj.uuid||obj.oid||obj._id;
            if (!(slotid)) dropLocal(qid);
            else setLocal(qid,jsonString(obj));};
        OfflineKB.prototype.Import=function(obj){
            var qid=obj._qid||obj.uuid||obj.oid||obj._id;
            setLocal(qid,obj,true);};
        fdjtKB.OfflineKB=OfflineKB;
        
        /* Miscellaneous array and table functions */

        fdjtKB.add=function(obj,field,val,nodup){
            if (arguments.length===2)
                return set_add(obj,field);
            else if (obj instanceof Ref)
                return obj.add.apply(obj,arguments);
            else if (nodup) 
                if (obj.hasOwnProperty(field)) {
                    var vals=obj[field];
                    if (!(arr_contains(vals,val))) obj[field].push(val);
                    else {}}
            else obj[field]=new Array(val);
            else if (obj.hasOwnProperty(field))
                obj[field].push(val);
            else obj[field]=new Array(val);
            if ((obj._all) && (!(arr_contains(obj._all,field))))
                obj._all.push(field);};

        fdjtKB.drop=function(obj,field,val){
            if (arguments.length===2)
                return set_drop(obj,field);
            else if (obj instanceof Ref)
                return obj.drop.apply(obj,arguments);
            else if (!(val))
                /* Drop all vals */
                obj[field]=[];
            else if (obj.hasOwnProperty(field)) {
                var vals=obj[field];
                var pos=arr_position(vals,val);
                if (pos<0) return;
                else vals.splice(pos,1);}
            else {}};

        fdjtKB.test=function(obj,field,val){
            if (arguments.length===2)
                return arr_contains(obj,field);
            else if (obj instanceof Ref)
                return obj.test.apply(obj,arguments);
            else if (typeof val === "undefined")
                return (((obj.hasOwnProperty) ?
                         (obj.hasOwnProperty(field)) : (obj[field])) &&
                        ((obj[field].length)>0));
            else if (obj.hasOwnProperty(field)) { 
                if (arr_position(obj[field],val)<0)
                    return false;
                else return true;}
            else return false;};

        fdjtKB.insert=function(array,value){
            if (arr_position(array,value)<0) array.push(value);};

        fdjtKB.remove=function(array,value,count){
            var pos=arr_position(array,value);
            if (pos<0) return array;
            array.splice(pos,1);
            if (count) {
                count--;
                while ((count>0) &&
                       ((pos=arr_position(array,value,pos))>=0)) {
                    array.splice(pos,1); count--;}}
            return array;};

        fdjtKB.indexOf=function(array,elt,pos){
            if (pos) return array.indexOf(elt,pos);
            else return array.indexOf(elt);};

        fdjtKB.contains=arr_contains;
        fdjtKB.position=arr_position;

        return fdjtKB;})();}

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
