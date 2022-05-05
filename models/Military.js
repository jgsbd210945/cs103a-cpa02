'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var userSchema = Schema( {
  soldiers: Number,
  tanks: Number,
  planes: Number,
  ships: Number,
  missiles: Number,
  nukes: Number,
} );

module.exports = mongoose.model( 'Military', userSchema );