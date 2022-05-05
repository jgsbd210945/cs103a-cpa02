'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

var userSchema = Schema( {
  money: String,
  steel: Number,
  aluminum: Number,
  gasoline: Number,
  munitions: Number,
  uranium: Number,
  food: Number,
} );

module.exports = mongoose.model( 'Resources', userSchema );