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
    money: String,
    steel: Number,
    aluminum: Number,
    gasoline: Number,
    munitions: Number,
    uranium: Number,
    food: Number,
    soldiers: Number,
    tanks: Number,
    planes: Number,
    ships: Number,
    missiles: Number,
    nukes: Number,
} );

module.exports = mongoose.model( 'Nation', userSchema );