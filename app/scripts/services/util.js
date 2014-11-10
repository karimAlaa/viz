'use strict';

angular.module('customVisulizationApp')
.service('util', function () {
  return {

  	getKeys: function( obj ) {
    return Object.keys ? Object.keys( obj ) : (function( obj ) {
      var item,
          list = [];

      for ( item in obj ) {
        if ( hasOwn.call( obj, item ) ) {
          list.push( item );
        }
      }
      return list;
    })( obj );
  }
}

});

