'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var userSchema = Schema( {
  id: Number,
  name: String,
  leader: String,
  timezone: String,
  cities: Number,
  score: Number,
} );

module.exports = mongoose.model( 'BaseInfo', userSchema );