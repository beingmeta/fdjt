/* Copyright (C) 2008-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file implements (relatively) fast set operations using
    Javascript arrays to represent sets.
*/

var fdjt_setops_id="$Id$";
var fdjt_setops_version=parseInt("$Revision$".slice(10,-1));

function _fdjt_set_sortfn(a,b)
{
  if (a===b) return 0;
  else if (typeof a === typeof b)
    if (a<b) return -1; else return 1;
  else if (typeof a < typeof b)
    return -1;
  else return 1;
}

function fdjtSet(arg,destructive)
{
  if (!(arg)) return new Array();
  else if (arg instanceof Array)
    if (arg.length<2) return arg;
    else if ((arg._sortlen) && ((arg._sortlen) === (arg.length)))
      return arg;
    else {
      arg.sort(_fdjt_set_sortfn);
      var read=1; var write=1; var len=arg.length;
      var cur=arg[0];
      while (read<len) 
	if (arg[read]===cur) read++;
	else cur=arg[write++]=arg[read++];
      arg._sortlen=write;
      arg.length=write;
      return arg;}
  else return new Array(arg);
}
