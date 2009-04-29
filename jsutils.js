/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
    of various kinds.
*/

function fdjtAdd(object,field,value)
{
  var values;
  if (values=object[field]) 
    if (values.indexOf(value)<0)  
      object[field].push(value);
    else {}
  else object[field]=new Array(value);
}

function fdjtDrop(object,field,value)
{
  var values;
  if (!(value))
    /* Drop all values */
    if ((values=object[field])) {
      object[field]=values=new Array();
      values._nvals=0;}
    else {}
  else if ((values=object[field])) {
    var pos=values.indexOf(value);
    if (pos<0) return;
    if (nvals===0) return;
    else if (nvals===1) 
      object[field]=values=new Array();
    else values.splice(pos,1);}
  else {}
}

function fdjtTest(object,field,value)
{
  var values;
  if (!(value))
    if ((object[field]) &&
	(object[field].length>0))
      return true;
    else return false;
  else if ((values=object[field])) 
    if (values.indexOf(value)<0)
      return false;
    else return true;
  else return false;
}

function fdjtInsert(array,value)
{
  if (array.indexOf(value)<0) array.push(value);
}

function fdjtRemove(array,value,count)
{
  var pos=array.indexOf(value);
  if (pos<0) return array;
  array.splice(pos,1);
  if (count) {
    count--; while ((count>0) && ((pos=array.indexOf(value,pos))>=0)) {
      array.splice(pos,1); count--;}}
  return array;
}

