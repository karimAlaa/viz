'use strict';

angular.module('customVisulizationApp')
.service('statistics', function () {
  var x={
  	isArray: function (obj) {
		return Object.prototype.toString.call(obj) === "[object Array]";
	},
	getNumWithSetDec: function( num, numOfDec ){
		var pow10s = Math.pow( 10, numOfDec || 0 );
		return ( numOfDec ) ? Math.round( pow10s * num ) / pow10s : num;
	},
	getAverageFromNumArr: function( numArr, numOfDec ){
		if( !x.isArray( numArr ) ){ return false;	}
		var i = numArr.length, 
			sum = 0;
		while( i-- ){
			sum += numArr[ i ];
		}
		return x.getNumWithSetDec( (sum / numArr.length ), numOfDec );
	},
	getVariance: function( numArr, numOfDec ){
		if( !x.isArray(numArr) ){ return false; }
		var avg = x.getAverageFromNumArr( numArr, numOfDec ), 
			i = numArr.length,
			v = 0;
	 
		while( i-- ){
			v += Math.pow( (numArr[ i ] - avg), 2 );
		}
		v /= numArr.length;
		return x.getNumWithSetDec( v, numOfDec );
	},
	getStandardDeviation: function( numArr, numOfDec ){
		if( !x.isArray(numArr) ){ return false; }
		var stdDev = Math.sqrt( x.getVariance( numArr, numOfDec ) );
		return x.getNumWithSetDec( stdDev, numOfDec );
	}
  }

  return x
})