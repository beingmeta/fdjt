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

        /* Whether exported representations may include strings
           referring to Refs */
        var string_refs=true;

        var refdbs={}, all_refdbs=[];
        var aliases={}, atmaps={};

        function RefDB(name,init){
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
                this.name=name; refdbs[name]=this; all_refdbs.push(this);
                this.aliases=[]; this.refclass=false;
                this.refs={}; this.altrefs={};
                this.allrefs=[]; this.changed=[]; this.loaded=[];
                this.storage=init.storage||false;
                this.absrefs=init.absrefs||false;
                this.onload=[]; this.onloadnames={};
                this.onadd=[]; this.onaddnames={};
                this.ondrop=[]; this.ondropnames={};
                this.indices={};}
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
                        db.onLoad(oload[methname],methname);}}
            if (init.indices) {
                var index_specs=init.indices;
                var j=0, jlim=index_specs.length; while (j<jlim) {
                    var ix=index_specs[j++];
                    if (typeof ix !== "string") 
                        warn("Complex indices not yet handled!");
                    else this.indices[ix]={};}}
            
            return db;}

        function checkAliases(aliases){
            var i=0, lim=aliases.length;
            while (i<lim) {
                var alias=aliases[i++];
                var db=refdbs[alias];
                if (db) return db;}
            return false;}

        RefDB.open=function RefDBOpen(name){
            return refdbs[name]||aliases[name]||(new RefDB(name));};
        RefDB.prototype.addAlias=function DBaddAlias(alias){
            if (aliases[alias]) {
                if (aliases[alias]!==this) 
                    warn("Alias %s for %o already associated with %o",
                         alias,this,aliases[alias]);}
            else {
                aliases[alias]=this;
                this.aliases.push(alias);}};

        RefDB.prototype.toString=function (){
            return "RefDB("+this.name+")";};

        RefDB.prototype.ref=function DBref(id){
            if ((id[0]===":")&&(id[1]==="@")) id=id.slice(1);
            return (this.refs[id])||
                ((this.refclass)&&(new (this.refclass)(id)))||
                (new Ref(id,this));};
        RefDB.prototype.probe=function DBprobe(id){
            if ((id[0]===":")&&(id[1]==="@")) id=id.slice(1);
            return (this.refs[id]);};

        RefDB.prototype.onLoad=function(method,name,noupdate){
            if ((name)&&(this.onloadnames[name])) {
                var cur=this.onloadnames[name];
                if (cur===method) return;
                var pos=this.onload.indexOf(cur);
                if (cur<0) {
                    warn("Couldn't replace named onload method %s for <RefDB %s>",
                         name,this.name);
                    return;}
                else {
                    this.onload[pos]=method;}}
            else this.onload.push(method);
            if (name) this.onloadnames[name]=method;
            if (!(noupdate)) {
                var loaded=[].concat(this.loaded);
                fdjtTime.slowmap(method,loaded);}};

        RefDB.prototype.onAdd=function(method,name,noupdate){
            if ((name)&&(this.onaddnames[name])) {
                var cur=this.onaddnames[name];
                if (cur===method) return;
                var pos=this.onadd.indexOf(cur);
                if (cur<0) {
                    warn("Couldn't replace named onadd method %s for <RefDB %s>",
                         name,this.name);
                    return;}
                else this.onadd[pos]=method;}
            else this.onadd.push(method);
            if (name) this.onaddnames[name]=method;};

        RefDB.prototype.onDrop=function(method,name,noupdate){
            if ((name)&&(this.ondropnames[name])) {
                var cur=this.ondropnames[name];
                if (cur===method) return;
                var pos=this.ondrop.indexOf(cur);
                if (cur<0) {
                    warn("Couldn't replace named ondrop method %s for <RefDB %s>",
                         name,this.name);
                    return;}
                else this.ondrop[pos]=method;}
            else this.ondrop.push(method);
            if (name) this.ondropnames[name]=method;};
        
        var uuid_pat=/^((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})$/;
        var xuuid_pat=/^((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}t[0-9a-zA-Z]+)$/;
        var refpat=/^(((:|)@(([0-9a-fA-F]+\/[0-9a-fA-F]+)|(\/\w+\/.*)|(@\d+\/.*)))|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})|((U|#U|:#U|)[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}t[0-9a-zA-Z]+)|([^@]+@.+))$/;
    
        function resolveRef(arg,db,force){
            if (arg instanceof Ref) return arg;
            else if ((db)&&(db.refs[arg])) return db.refs[arg];
            // These are generally the same but don't have to be 
            else if ((db)&&(db.probe(arg))) return db.probe(arg);
            else if ((typeof arg === "string")&&(refpat.exec(arg))) {
                var at=arg.indexOf('@');
                if ((at===1)&&(at[0]===':')) {arg=arg.slice(1); at=0;}
                if (at>0) {
                    db=RefDB.open(arg.slice(at+1));
                    arg=arg.slice(0,at);}
                else if (at<0) {
                    var uuid;
                    if (arg.search(":#U")===0) uuid=arg.slice(3);
                    else if (arg.search("#U")===0) uuid=arg.slice(2);
                    else if (arg.search("U")===0) uuid=arg.slice(1);
                    else uuid=arg;
                    var type=uuid.indexOf('t'), tail=arg.length-2;
                    if (type>0) type="UUID"+uuid.slice(type); else type=false;
                    if (tail>0) tail="-UUIDTYPE="+uuid.slice(tail);
                    else tail=false;
                    var known_db=((type)&&(refdbs[type]||aliases[type]))||
                        ((tail)&&(refdbs[tail]||aliases[tail]));
                    if (known_db) db=known_db;
                    else if ((force)&&(type)) {
                        db=new RefDB(type);
                        if (type) db.addAlias(type);}
                    else db=false;}
                else if (arg[1]==='@') {
                    // Double at is a "local ref"
                    var idstart=art.indexOf('/');
                    var atid=arg.slice(0,idstart);
                    var atdb=aliases[atid];
                    if (atdb) db=atdb;
                    else {
                        var domain=getLocal(arg.slice(0,idstart),true);
                        if (!(domain)) {
                            db=new RefDB(domain,{aliases: [atid]});}
                        else return false;}}
                else {
                    var atprefix, slash;
                    if (arg[1]==='/') {
                        slash=arg.slice(2).indexOf('/');
                        if (slash>0) slash=slash+2;}
                    else slash=arg.indexOf('/');
                    atprefix=arg.slice(at,slash+1);
                    db=refdbs[atprefix]||aliases[atprefix]||((force)&&(new RefDB(atprefix)));}}
            else {}
            if (!(db)) return false;
            if (db.refs[arg]) return (db.refs[arg])
            else if (force) return db.ref(arg);
            else return false;}
        RefDB.resolve=resolveRef;
        RefDB.ref=resolveRef;

        function Ref(id,db,instance){
            // Just called for the prototype
            if (arguments.length===0) return this;
            if (db.refs[id]) return db.refs[id];
            else if (instance) {
                instance._id=id; instance._db=db;
                if (!(db.absrefs)) instance._domain=db.name;
                db.refs[id]=instance;
                db.allrefs.push(instance);
                return instance;}
            else if ((db.refclass)&&(!(this instanceof db.refclass)))
                return new (db.refclass)(id,db);
            else {
                this._id=id; this._db=db;
                if (!(db.absrefs)) this._domain=db.name;
                db.refs[id]=this;
                db.allrefs.push(this);
                return this;}}
        fdjt.Ref=RefDB.Ref=Ref;

        Ref.prototype.toString=function(){
            if (this._qid) return this._qid;
            else if (this._domain) return this._id+"@"+this._domain;
            else if (this._db.absrefs) return this._id;
            else return this._id+"@"+this._db.name;}
        Ref.prototype.getQID=function getQID(){
            if (this._qid) return this._qid;
            else if (this._domain)
                return (this._qid=(this._id+"@"+this._domain));
            else if (this._db.absrefs)
                return (this._qid=this._id);
            else return (this._qid=(this._id+"@"+this._db.name));};
        
        function getQID(obj){
            if (obj._qid) return obj._qid;
            else if (obj._domain)
                return (obj._qid=(obj._id+"@"+obj._domain));
            else if (obj._db.absrefs)
                return (obj._qid=obj._id);
            else return (obj._qid=(obj._id+"@"+obj._db.name));}

        Ref.prototype.addAlias=function addRefAlias(term){
            if (this._db.refs[term]) {
                if (this._db.refs[term]===this) return false;
                else throw {error: "Ref alias conflict"};}
            else if (this._db.altrefs[term]) {
                if (this._db.altrefs[term]===this) return false;
                else throw {error: "Ref alias conflict"};}
            else {
                this._db.altrefs[term]=this;
                return true;}};

        Ref.prototype.Import=function refImport(data,dontindex){
            var db=this._db;
            var indices=db.indices; var onload=db.onload;
            var aliases=data.aliases;
            if (aliases) {
                var ai=0, alim=aliases.length; while (ai<alim) {
                    var alias=aliases[ai++];
                    var cur=db.refs[alias]||db.altrefs[alias];
                    if ((cur)&&(!(cur===this)))
                        warn("Ambiguous %s in %s refers to both %o and %o",
                             alias,db.name,cur.name,this.name);
                    else aliases[alias]=this;}}
            for (var key in data) {
                if (key==="aliases") {}
                else if (data.hasOwnProperty(key)) {
                    var value=data[key];
                    if ((typeof value === "number")||
                        ((typeof value === "string")&&
                         ((!(string_refs))||(!(refpat.exec(value))))))
                        this[key]=value;
                    else this[key]=value=importValue(value,this._db,dontindex);
                    if ((!(dontindex))&&(indices[key])) 
                        indexRef(this,key,this[key],indices[key],db);}}
            if (!(this._live)) {
                this._live=fdjtTime();
                if (onload) {
                    var i=0, lim=onload.length; while (i<lim) {
                        onload[i++](this);}}};
            if (this._onload) {
                var inits=this._onload;
                var j=0, jlim=inits.length; while (j<jlim) {
                    inits[j++](this);}
                delete this._onload;}};
        function importValue(value,db,dontindex){
            if (value instanceof Ref) return value;
            else if ((typeof value === "object")&&(value._id)) {
                var ref;
                if (value._domain) ref=RefDB(value._domain).ref(value._id);
                else ref=RefDB.resolve(value._id,db,true);
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
                            imports=value.slice(0,i-1);
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
        RefDB.prototype.importValue=function(val){
            return importValue(val,this);};
        RefDB.prototype.Import=function refDBImport(data){
            var refs=[];
            if (!(data instanceof Array)) data=[data];
            var i=0, lim=data.length; while (i<lim) {
                var item=data[i++];
                var ref=resolveRef(item._id,item._domain,true);
                if (!(ref)) warn("Couldn't resolve ref %o",item._id);
                else {
                    refs.push(ref);
                    ref.Import(item);};}
            if (data.length===1) return refs[0];
            else return refs;};

        Ref.prototype.Export=function refExport(){
            var exported={_id: this._id};
            if (!(this._db.absrefs)) this._domain=this._db.name;
            for (var key in this) {
                if (key[0]==="_") continue;
                else if (this.hasOwnProperty(key)) {
                    var value=this[key];
                    if ((typeof value === "number")||
                        (typeof value === "string"))
                        exported[key]=value;
                    else if (value instanceof Ref) {
                        if (value._db.absrefs)
                            exported[key]={_id: value._id};
                        else exported[key]={
                            _id: value._id,
                            _domain: value._domain||value._db.name};}
                    else exported[key]=exportValue(value,this._db);}}
            return exported;};
        function exportValue(value,db){
            if (value instanceof Ref) {
                if (value._db===db) return {_id: value._id};
                else if (value._db.absrefs) return {_id: value._id};
                else return {
                    _id: value._id,
                    _domain: value._domain||value._db.name};}
            else if (value instanceof Array) {
                var i=0, lim=value.length; var exports=false;
                while (i<lim) {
                    var elt=value[i++];
                    var exported=exportValue(elt,db);
                    if (elt!==exported) {
                        if (exports) exports.push(exported);
                        else {
                            exports=value.slice(0,i-1);
                            exports.push(exported);}}
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
                                    while (j<jlim) {
                                        var f=fields[j++];
                                        copied[f]=value[f];}}}
                            copied[field]=exportval;}
                        else if (copied) copied[name]=fieldval;
                        else fields.push(field);}}
                return copied||value;}
            else return value;}
        Ref.exportValue=exportValue;
        RefDB.prototype.exportValue=function(val){
            return exportValue(val,this);};
        
        RefDB.prototype.load=function loadRefs(refs,callback){
            if (!(this.storage)) return;
            else if (this.storage instanceof window.Storage) {
                if (!(refs)) refs=[].concat(this.allrefs);
                else if (refs===true) {
                    var all=this.storage["allids("+this.name+")"];
                    if (all) refs=JSON.parse(all).concat(this.allrefs);
                    else refs=[].concat(this.allrefs);}
                else if (refs instanceof Ref) refs=[refs];
                else if (typeof refs === "string") refs=[refs];
                else if (typeof refs.length === "undefined") refs=[refs];
                else {}
                var storage=this.storage; var loaded=this.loaded;
                var atid=false;
                var i=0, lim=refs.length; while (i<lim) {
                    var arg=refs[i++], ref=arg, content;
                    if (typeof ref === "string")
                        ref=this.ref(ref,false,true);
                    if (!(ref)) {
                        warn("Couldn't resolve ref to %s",arg);
                        continue;}
                    else if (ref._live) continue;
                    loaded.push(ref);
                    if (this.absrefs) content=storage[ref._id];
                    else if (atid)
                        content=storage[atid+"("+ref._id+")"];
                    else {
                        if (this.atid) atid=this.atid;
                        else atid=this.atid=getatid(storage,this);
                        content=storage[atid+"("+ref._id+")"];}
                    if (!(content))
                        warn("No item stored for %s",ref._id);
                    else ref.Import(JSON.parse(content));}
                if (callback) callback();}
            else if (window.IndexedDB) {}
            else {}};
        Ref.prototype.load=function loadRef() {
            if (this._live) return this;
            else {
                this._db.load(this);
                return this;}};
        RefDB.load=function RefDBload(spec){
            if (typeof spec === "string") {
                var ref=RefDB.ref(spec,false,true);
                if (ref) return ref.load();
                else throw {error: "Couldn't resolve "+spec};}
            else if (spec instanceof Ref)
                return ref.load();
            else if (spec instanceof Array) {
                var loads=[]; var i=0, lim=spec.length;
                while (i<lim) {
                    var s=spec[i++]; var r;
                    if (typeof s === "string") r=RefDB.ref(s,false,true);
                    else if (s instanceof Ref) r=s;
                    else s=false;
                    if (r) loads.push(r.load());
                    else loads.push(false);}
                return loads;}};
        
        RefDB.prototype.save=function saveRefs(refs,callback){
            if (!(this.storage)) return;
            else if (!(refs))
                return this.save(this.changed,function(){
                    this.changed=[]; callback();});
            else if (this.storage instanceof window.Storage) {
                var storage=this.storage;
                var atid=this.atid;
                var ids=[];
                var i=0, lim=refs.length; while (i<lim) {
                    var ref=refs[i++];
                    if (typeof ref === "string") ref=this.ref(ref);
                    if (!(ref._live)) continue;
                    if (!(ref._changed)) continue;
                    if (this.absrefs) {
                        ids.push(this._id);
                        storage.setItem(this._id,JSON.stringify(ref.Export()));}
                    else {
                        if (atid) {}
                        else if (this.atid) atid=this.atid;
                        else atid=this.atid=getatid(storage,this);
                        var id=atid+"("+this._id+")";
                        ids.push(id);
                        storage.setItem(id,JSON.stringify(ref.Export()));}}
                var allids=storage["allids("+this.name+")"];
                if (allids) allids=JSON.parse(allids); else allids=[];
                var n=allids.length;
                allids=merge(allids,ids)
                if (allids.length!==n) 
                    storage.setItem("allids("+this.name+")",
                                    JSON.stringify(allids));
                if (callback) callback();}
            else if (window.IndexedDB) {}
            else {}};
        Ref.prototype.save=function(callback){
            if (!(this._changed)) return this;
            else this._db.save([this],callback);}

        function getatid(storage,db){
            if (db.atid) return db.atid;
            var atid=storage["atid("+db.name+")"];
            if (atid) return (db.atid=atid);
            else {
                var count=storage["atid.count"];
                if (!(count)) {
                    atid=count=1; storage["atid.count"]="2";}
                else {
                    count=parseInt(count);
                    atid=db.atid="@@"+count;
                    storage["atid("+db.name+")"]=atid;
                    storage["atid.count"]=count+1;}}}
        
        function getKeyString(val,db){
            if (val instanceof Ref) {
                if (val._db===db) return "@"+val._id;
                else if (val._domain) return "@"+val._id+"@"+val._domain;
                else return "@"+val._id;}
            else if (typeof val === "number") 
                return "#"+val;
            else if (typeof val === "string")
                return "\""+val;
            else if (val.toJSON)
                return "{"+val.toJSON();
            else return "&"+val.toString();}
        RefDB.getKeyString=getKeyString;
        
        function indexRef(ref,key,val,index,db){
            var keystrings=[];
            var refstring=
                (((!(db))||(ref._db===db)||(ref._db.absrefs))?(ref._id):
                 ((ref._qid)||((ref.getQID)&&(ref.getQID()))));
            if (val instanceof Ref) {
                if (ref._db===val._db) keystrings=["@"+val._id];
                else keystrings=["@"+(val._qid||val.getQID())];}
            else if (val instanceof Array) {
                var db=ref._db;
                var i=0, lim=val.length; while (i<lim) {
                    var elt=val[i++];
                    if (elt instanceof Ref) 
                        keystrings.push("@"+(elt._qid||elt.getQID()));
                    else if (typeof elt === "number") 
                        keystrings=["#"+val];
                    else if (typeof elt === "string")
                        keystrings=["\""+val];
                    else if (elt._qid)
                        keystrings.push("@"+(elt._qid||elt.getQID()));
                    else if (elt.getQID)
                        keystrings.push("@"+(elt.getQID()));
                    else {}}}
            else if (typeof val === "number") 
                keystrings=["#"+val];
            else if (typeof val === "string")
                keystrings=["\""+val];
            else {}
            if (keystrings.length) {
                var j=0, jlim=keystrings.length; while (j<jlim) {
                    var keystring=keystrings[j++]; var refs=index[keystring];
                    if (refs) refs.push(refstring);
                    else index[keystring]=[refstring];}}}

        function indexRefdrop(ref,key,val,index,db){
            var keystrings=[];
            var refstring=(((!(db))||(ref._db===db))?(ref._id):
                           ((ref._domain)?(ref._id+"@"+ref._domain):(ref._id)));
            if (val instanceof Ref) {
                if (ref._db===val._db) keystrings=[val._id];
                else if (val._domain) keystrings=[val._id+"@"+val._domain];
                else keystrings=[val._id];}
            else if (val instanceof Array) {
                var db=ref._db;
                var i=0, lim=val.length; while (i<lim) {
                    var elt=val[i++];
                    var ks=getKeyString(elt,db);
                    if (ks) keystrings.push(ks);}}
            else if (typeof val === "number") 
                keystrings=["\u00ad"+val];
            else if (typeof val === "string")
                keystrings=[val];
            else {}
            if (keystrings.length) {
                var j=0, jlim=keystrings.length; while (j<jlim) {
                    var keystring=keystrings[j++]; var refs=index[keystring];
                    if (refs) refs.push(refstring);
                    else index[keystring]=[refstring];}}}

        RefDB.prototype.find=function findRefs(key,value){
            var indices=this.indices[key];
            if (indices) {
                var keystring=getKeyString(value,this);
                if (keystring) return indices[keystring]||[];
                else return [];}
            else return [];}
        RefDB.prototype.count=function countRefs(key,value){
            var indices=this.indices[key];
            if (indices)
                return indices[getKeyString(value,this)].length;
            else return 0;}
        
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
                else if (a._qid) {
                    if (b._qid) {
                        if (a._qid<b._qid) return -1;
                        else return 1;}
                    else return -1;}
                else if (b._qid) return 1;
                else if ((a._fdjtid)&&(b._fdjtid)) {
                    if ((a._fdjtid)<(b._fdjtid)) return -1;
                    else return 1;}
                else return 0;}
            else if (typeof a < typeof b) return -1;
            else return 1;}
        RefDB.compare=set_sortfn;

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
        RefDB.intersection=intersection;

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
        RefDB.difference=difference;
        
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
        RefDB.union=union;

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
        RefDB.merge=merge;

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
        RefDB.overlaps=overlaps;

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
        RefDB.Set=fdjtSet;
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
                    if ((elt._qid)||(elt._fdjtid)) {}
                    else if (elt.getQID) elt._qid=elt.getQID();
                    else elt._fdjtid=++id_counter;}
                return array;}
            else {
                var allstrings=true;
                var i=0, lim=array.length;
                while (i<lim) {
                    var elt=array[i++];
                    if ((allstrings)&&(typeof elt !== 'string')) {
                        allstrings=false;
                        if (typeof elt === "object") {
                            if ((elt._qid)||(elt._fdjtid)) {}
                            else if (elt.getQID) elt._qid=elt.getQID();
                            else elt._fdjtid=++id_counter;}}}
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
        
        /* Refs */

        Ref.prototype.get=function refGet(prop){
            if (this.hasOwnProperty(prop)) return this[prop];
            else if (this._live) return false;
            else return undefined;};
        Ref.prototype.getSet=function refGetSet(prop){
            if (this.hasOwnProperty(prop)) {
                var val=this[prop];
                if (val instanceof Array) {
                    if (val._sortlen===val.length) return val;
                    else return setify(val);}
                else return setify([val]);}
            else if (this._live) return [];
            else return undefined;};
        Ref.prototype.getArray=function refGetArray(prop){
            if (this.hasOwnProperty(prop)) {
                var val=this[prop];
                if (val instanceof Array) return val;
                else return [val];}
            else if (this._live) return [];
            else return undefined;};
        Ref.prototype.add=function refAdd(prop,val,dontindex){
            if ((!(this._live))&&(this._db.storage)) {
                if (this._db.storage instanceof window.Storage) {
                    this.load(); return this.add(prop,val);}
                else {
                    return undefined;}}
            else if (prop==="aliases") {
                var db=this._db;
                if (db.refs[val]===this) return false;
                else if (db.altrefs[val]===this) return false;
                else {
                    db.altrefs[val]=this;
                    if (this.aliases) this.aliases.push(val);
                    else this.aliases=[val];}}
            else if (this.hasOwnProperty(prop)) {
                var cur=this[prop];
                if (cur===val) return false;
                else if (cur instanceof Array) {
                    if (val instanceof Array) {
                        if (!(set_add(cur,[val]))) return false;}
                    else if (!(set_add(cur,val))) return false;
                    else {}}
                else if (val instanceof Array)
                    this[prop]=fdjtSet([cur,[val]]);
                else this[prop]=fdjtSet([cur,val]);}
            else if (val instanceof Array)
                this[prop]=[val];
            else this[prop]=val;
            if (!(this._changed)) {
                this._changed=fdjtTime();
                this._db.changed.push(this);}
            if (this._db.onadd.hasOwnProperty(prop))
                (this._db.onadd[prop])(this,prop,val);
            if ((!(dontindex))&&(this._db.indices[prop])) 
                indexRef(this,prop,this[prop],this._db.indices[prop]);
            return true;};
        Ref.prototype.drop=function refDrop(prop,val,leaveindex){
            if (prop==='_id') return false;
            else if ((!(this._live))&&(this._db.storage)) {
                if (this._db.storage instanceof window.Storage) {
                    this.load(); return this.drop(prop,val);}
                else {
                    return undefined;}}
            else if (this.hasOwnProperty(prop)) {
                var cur=this[prop];
                if (cur===val) delete this[prop];
                else if (cur instanceof Array) {
                    if (!(set_drop(cur,val))) return false;
                    if (cur.length===0) delete this[prop];}
                else return false;
                if (this._db.ondrop.hasOwnProperty(prop)) 
                    this._db.ondrop[prop](this,prop,val);
                if ((!(leaveindex))&&(this._db.indices[prop])) 
                    indexRefdrop(this,prop,this._db.indices[prop]);
                return true;}
            else return false;};
        Ref.prototype.test=function(prop,val){
            if (this.hasOwnProperty(prop)) {
                if (typeof val === 'undefined') return true;
                var cur=this[prop];
                if (cur===val) return true;
                else if (cur instanceof Array) {
                    if (arr_contains(cur,val)) return true;
                    else if (this._live) return false;
                    else return undefined;}
                else if (this._live) return false;
                else return undefined;}
            else if (this._live) return false;
            else return undefined;};
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

        Ref.prototype.toHTML=function(){
            var dom=false;
            return ((this._db.forHTML)&&(this._db.forHTML(this)))||
                ((this._db.forDOM)&&(dom=this._db.forDOM(this))&&
                 (dom.outerHTML))||
                this._id||this.oid||this.uuid;};
        Ref.prototype.toDOM=function(){
            return ((this._db.forDOM)&&(this._db.forDOM(this)))||
                ((this._db.forHTML)&&(fdjtDOM(this._db.forHTML(this))))||
                (fdjtDOM("span.fdjtref",this._id||this.oid||this.uuid));};

        /* Maps */
        function fdjtMap() {
            this.mapping={};
            return this;}
        fdjtMap.prototype.get=function fdjtMapGet(key) {
            var keystring=getKeyString(key); var mapping=this.mapping;
            if (mapping.hasOwnProperty(keystring))
                return mapping[keystring];
            else return undefined;};
        fdjtMap.prototype.getItem=fdjtMap.prototype.get;
        fdjtMap.prototype.set=function(key,val) {
            var keystring=getKeyString(key);
            if (val instanceof Array)
                this.mapping[keystring]=[val];
            else this.mapping[keystring]=val;};
        fdjtMap.prototype.setItem=fdjtMap.prototype.set;
        fdjtMap.prototype.add=function(key,val) {
            var keystring=getKeyString(key);
            var mapping=this.mapping;
            if (mapping.hasOwnProperty(keystring)) {
                var cur=mapping[keystring];
                if (cur===val) return false;
                else if (cur instanceof Array) {
                    if (arr_contains(cur,val)) return false;
                    else {cur.push(val); return true;}}
                else if (val instanceof Array) {
                    mapping[keystring]=setify([cur,val]);
                    return true;}
                else {
                    mapping[keystring]=setify([cur,val]);
                    return true;}}
            else if (val instanceof Array) 
                mapping[keystring]=setify([val]);
            else mapping[keystring]=val;};
        fdjtMap.prototype.drop=function(key,val) {
            var mapping=this.mapping;
            var keystring=getKeyString(key);
            if (mapping.hasOwnProperty(keystring)) {
                var cur=mapping[keystring];
                if (cur===val) {
                    delete mapping[keystring];
                    return true;}
                else if (cur instanceof Array) {
                    var pos=cur.indexOf(val);
                    if (pos<0) return false;
                    cur.splice(pos); if (cur._sortlen) cur._sortlen--;
                    if (cur.length===1) {
                        if (!(cur[0] instanceof Array))
                            mapping[keystring]=cur[0];}
                    return true;}
                else return false;}
            else return false;};
        fdjt.Map=fdjtMap;
        RefDB.fdjtMap=fdjtMap;

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
        RefDB.Index=Index;

        /* Miscellaneous array and table functions */

        RefDB.add=function(obj,field,val,nodup){
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

        RefDB.drop=function(obj,field,val){
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

        RefDB.test=function(obj,field,val){
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

        RefDB.insert=function(array,value){
            if (arr_position(array,value)<0) array.push(value);};

        RefDB.remove=function(array,value,count){
            var pos=arr_position(array,value);
            if (pos<0) return array;
            array.splice(pos,1);
            if (count) {
                count--;
                while ((count>0) &&
                       ((pos=arr_position(array,value,pos))>=0)) {
                    array.splice(pos,1); count--;}}
            return array;};

        RefDB.indexOf=function(array,elt,pos){
            if (pos) return array.indexOf(elt,pos);
            else return array.indexOf(elt);};

        RefDB.contains=arr_contains;
        RefDB.position=arr_position;

        function Query(dbs,pattern,weights){
            if (arguments.length===0) return this;
            if (dbs) this.dbs=dbs;
            if (pattern) this.pattern=pattern;
            if (weights) this.weights=weights||false;

            return this;}
        RefDB.Query=Query;
        Query.prototype.ambigrefs=true;

        Query.prototype.execute=function executeQuery(){
            if (this.scores) return this;
            var dbs=this.dbs;
            var pattern=this.pattern;
            if (!(pattern)) {
                warn("No pattern for query %o!",this);
                return false;}
            if (!(dbs)) {
                warn("No dbs for query %o!",this);
                return false;}
            var weights=this.weights;
            var ambigrefs=((dbs.length>1)&&(this.ambigrefs));
            var scores=this.scores={};
            var results=this.results=[];
            var scored=this.scored=[];
            var freqs=this.freqs;
            var allfreqs=this.allfreqs;
            for (var field in pattern) {
                if (!(pattern.hasOwnProperty(field))) continue;
                var vfreqs=((freqs)&&(freqs[field]||(freqs[field]={})));
                var values=pattern[field];
                if (!(values instanceof Array)) values=[values];
                var weight=((weights)&&(weights[field]));
                var score=weight||1;
                var i=0, lim=dbs.length;
                while (i<lim) {
                    var db=dbs[i++];
                    var vi=0, vlim=values.length; while (vi<vlim) {
                        var val=values[vi++];
                        var items=db.find(field,val);
                        if ((this.tracelevel)&&
                            ((items.length)||(this.tracelevel>2)))
                            fdjtLog("Got %d items for %s=%o from %o",
                                    items.length,field,val,db);
                        var valstring=((vfreqs)||(allfreqs))&&
                            ((val._qid)||(val._fdjtid)||
                             (getKeyString(val)));
                        if ((items)&&(items.length)) {
                            if (vfreqs) {
                                if (vfreqs[valstring])
                                    vfreqs[valstring]+=items.length;
                                else vfreqs[valstring]=items.length;}
                            if (allfreqs) {
                                if (allfreqs[valstring])
                                    allfreqs[valstring]+=items.length;
                                else allfreqs[valstring]+=allfreqs.length;}
                            var itemi=0, nitems=items.length;
                            if (ambigrefs) {
                                while (itemi<nitems) {
                                    var item=items[itemi++];
                                    var ref=db.ref(item);
                                    var id=ref._qid||
                                        ((ref.getQID)&&(ref.getQID()));
                                    if (!(id)) {}
                                    else if (scores[id]) scores[id]+=weight;
                                    else {
                                        if (weight) scored.push(ref);
                                        results.push(ref);
                                        scores[id]=weight;}}}
                            else while (itemi<nitems) {
                                var item=items[itemi++];
                                if (scores[item]) scores[item]+=weight;
                                else {
                                    var ref=db.ref(item);
                                    if (weight) scored.push(ref);
                                    results.push(ref);
                                    scores[item]=weight;}}}}}}
        
            return this;};

        return RefDB;})();}

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
