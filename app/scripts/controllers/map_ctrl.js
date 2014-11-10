'use strict';

angular.module('customVisulizationApp')
  .controller('mapCtrl', function ($scope, statistics, util, influxdb, $q, $interval) {

    var roads= {
        "216":{
            id:['174535959','50056142', '174538071','172993808', '174534397'], 
            name:"Me7war;Midan Juhayna To Da2ery", 
            direction:1
        },
        "217":{
            id:['79583092','5091223', '174546681', '161998368'], 
            name:"Me7war;Da2ery To Kobry 15 Mayo", 
            direction:1
        },
        "5":{
            id:['174550560','305790195'],
            name:"Kobry 15 Mayo;Mohandessin To West ElBalad",
            direction:1
        },
        "164":{
            id:['22948103','22948117'],
            name:"Kobry 6 October;Mohandesin To Ta7rir",
            direction:1
        },
        "113":{
            id:['10945548'],
            name:"Kornich ElNile;West ElBalad To Arcadia",
            direction:2
        },
        // "114":{
        //     id:[],
        //     name:"Kornich ElNile;Arcadia To West ElBalad",
        //     direction:0
        // },
        "115":{
            id:['50219744','48980326','24869131'],
            name:"Kornich Agouza;Sheraton To Imbaba",
            direction:2
        },
        // "116":{
        //     id:[],
        //     name:"Kornich Agouza;Imbaba To Sheraton",
        //     direction:1
        // },
    }
  	var road_osm_id = {}
	var p = 2,
        drawBuildings = false,
        drawLabels= false
    var width = Math.max(960, window.innerWidth),
        height = Math.max(500, window.innerHeight),
        prefix = prefixMatch(["webkit", "ms", "Moz", "O"]);

    var tile = d3.geo.tile()
        .size([width, height]);

    var projection = d3.geo.mercator()
        .scale((1 << 21) / p / Math.PI)
        .translate([-width / 2, -height / 2]); // just temporary

    var tileProjection = d3.geo.mercator();

    var tilePath = d3.geo.path()
        .projection(tileProjection);

    var zoom = d3.behavior.zoom()
        .scale(projection.scale() * p * Math.PI)
        .scaleExtent([1 << 20, 1 << 25])
        .translate(projection([31.2663, 30.0644]).map(function (x) {
            return -x;
        }))
        .on("zoom", zoomed);

    var map = d3.select("body").append("div")
        .attr("class", "map")
        .style("width", width + "px")
        .style("height", height + "px")
        .call(zoom)
        .on("mousemove", mousemoved);

    var layerWater = map.append("div")
        .attr("class", "layerWater");

    var layerRoads = map.append("div")
        .attr("class", "layerRoads");

    var layerLabels = map.append("div")
        .attr("class", "layerLabels");

    var layerBuildings = map.append("div")
        .attr("class", "layerBuildings");

    var info = map.append("div")
        .attr("class", "info");

    var date = map.append("div")
        .attr("class", "date");

    
    var start_date = '2013-06-20'
    var end_date = '2013-06-25'
    var group_by_time = 10
    var date_template = setDateTemplate(start_date, end_date, group_by_time)
    var date_template_length =Object.keys(date_template).length

    var time_index= 0
    var interval_running = false
    var interval_promise= null

    for(var road_id in roads){
       getData(road_id, start_date, end_date, group_by_time).then(function(data){
            roads[data[0]].data = data[1]
            console.log(roads[data[0]])
            roads[data[0]].id.forEach(function(id){
                $('.'+id).attr('class', function(index, classNames) {
                    return classNames + ' active';
                });
            })            
       })
    }

    shortcut.add("Enter",function() {
        if(interval_running){
            console.log("stop")
            $interval.cancel(interval_promise)
            interval_running = false
        }
        else{
            console.log("start")
            interval_running = true
            interval_promise= $interval(function(){
                animateRoads(roads, time_index)
                time_index++
                if(time_index>date_template_length-1){
                    console.log("done")
                    $interval.cancel(interval_promise)
                    interval_running = false
                    time_index = 0
                }
            },250)
        }
        
    },{"disable_in_input" : false, 'propagate':false});

    shortcut.add("w",function() {
        $('.tileRoad path:not(.active)').attr('class', function(index, classNames) {
            if (classNames.indexOf("white") == -1)
                return classNames + ' white'
        });
    })

    shortcut.add("c",function() {
        $('.tileRoad path.white').attr('class', function(index, classNames) {
            return  classNames.replace('white', '');
        });
    })

    shortcut.add("left",function() {
        if(!interval_running){
            time_index--
            animateRoads(roads, time_index)
        }
    })

    shortcut.add("right",function() {
        if(!interval_running){
            time_index++
            animateRoads(roads, time_index)
        }
    })

    zoomed()

    function zoomed() {
        var tiles = tile
            .scale(zoom.scale())
            .translate(zoom.translate())
            ();

        projection
            .scale(zoom.scale() / p / Math.PI)
            .translate(zoom.translate());

        var imageWater = layerWater
            .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
            .selectAll(".tileWater")
            .data(tiles, function (d) {
                return d;
            });

        imageWater.exit()
            .each(function (d) {
                this._xhr.abort();
            })
            .remove();

        imageWater.enter().append("svg")
            .attr("class", "tileWater")
            .style("left", function (d) {
                return d[0] * 256 + "px";
            })
            .style("top", function (d) {
                return d[1] * 256 + "px";
            })
            .each(function (d) {
                var svg = d3.select(this),
                    openStreetMapType = 'vectiles-water-areas', //'vectiles-land-usages', //'vectiles-buildings', //'vectiles-highroad'
                    //                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                    url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/" + openStreetMapType + "/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                this._xhr = d3.json(url, function (error, json) {
                    var k = Math.pow(2, d[2]) * 256; // size of the world in pixels

                    tilePath.projection()
                        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
                    .scale(k / 2 / Math.PI);

                    svg.selectAll("path")
                        .data(json.features.sort(function (a, b) {
                            return a.properties.sort_key - b.properties.sort_key;
                        }))
                        .enter().append("path")
                        .attr("class", function (d) {
                            return d.properties.kind;
                        })
                        .attr("d", tilePath);
                });
            });


        var imageRoads = layerRoads
            .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
            .selectAll(".tileRoad")
            .data(tiles, function (d) {
                return d;
            });

        imageRoads.exit()
            .each(function (d) {
                this._xhr.abort();
            })
            .remove();

        imageRoads.enter().append("svg")
            .attr("class", "tileRoad")
            .style("left", function (d) {
                return d[0] * 256 + "px";
            })
            .style("top", function (d) {
                return d[1] * 256 + "px";
            })
            .each(function (d) {
                var svg = d3.select(this),
                    openStreetMapType = 'vectiles-highroad',
                    //                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                    url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/" + openStreetMapType + "/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                this._xhr = d3.json(url, function (error, json) {
                    var k = Math.pow(2, d[2]) * 256; // size of the world in pixels

                    tilePath.projection()
                        .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
                    .scale(k / 2 / Math.PI);

                    svg.selectAll("path")
                        .data(json.features.sort(function (a, b) {
                            return a.properties.sort_key - b.properties.sort_key;
                        }))
                        .enter().append("path")
                        .attr("class", function (d) {
                        	var sub_id = d.id//.substr(0, 7)
                        	if(!road_osm_id[sub_id])
                        		road_osm_id[sub_id] = getRandomColor() 
                        	// return sub_id
                            return d.properties.kind+" "+sub_id;
                        })
                        // .attr('style',function(d){
                        // 	if(d.properties.kind == "major_road")
                        // 		return 'stroke:'+getRandomColor()+';'
                        // })
                        // .attr('id',function(d){
                        	
                        // })
                        //  .attr('style',function(d){
                        // 	if(d.properties.kind == "major_road")
                        // 		return 'stroke:'+road_osm_id[d.id.substr(0, 6)]+';'
                        // })
                        .attr("d", tilePath);

                });
            });

        if (drawBuildings) {
            var imageBuildings = layerBuildings
                .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
                .selectAll(".tileBuilding")
                .data(tiles, function (d) {
                    return d;
                });

            imageBuildings.exit()
                .each(function (d) {
                    this._xhr.abort();
                })
                .remove();

            imageBuildings.enter().append("svg")
                .attr("class", "tileBuilding")
                .style("left", function (d) {
                    return d[0] * 256 + "px";
                })
                .style("top", function (d) {
                    return d[1] * 256 + "px";
                })
                .each(function (d) {
                    var svg = d3.select(this),
                        openStreetMapType = 'vectiles-buildings',
                        //                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/" + openStreetMapType + "/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                    this._xhr = d3.json(url, function (error, json) {
                        var k = Math.pow(2, d[2]) * 256; // size of the world in pixels

                        tilePath.projection()
                            .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
                        .scale(k / 2 / Math.PI);

                        svg.selectAll("path")
                            .data(json.features.sort(function (a, b) {
                                return a.properties.sort_key - b.properties.sort_key;
                            }))
                            .enter().append("path")
                            .attr("class", function (d) {
                                return d.properties.kind;
                            })
                            .attr("d", tilePath);
                    });
                });
        }

        if (drawLabels) {
            var imageLabels = layerLabels
                .style(prefix + "transform", matrix3d(tiles.scale, tiles.translate))
                .selectAll(".tileLabel")
                .data(tiles, function (d) {
                    return d;
                });

            imageLabels.exit()
                .each(function (d) {
                    this._xhr.abort();
                })
                .remove();

            imageLabels.enter().append("svg")
                .attr("class", "tileLabel")
                .style("left", function (d) {
                    return d[0] * 256 + "px";
                })
                .style("top", function (d) {
                    return d[1] * 256 + "px";
                })
                .each(function (d) {
                    var svg = d3.select(this),
                        openStreetMapType = 'vectiles-skeletron',
                        //                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                        url = "http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/" + openStreetMapType + "/" + d[2] + "/" + d[0] + "/" + d[1] + ".json";
                    this._xhr = d3.json(url, function (error, json) {
                        var k = Math.pow(2, d[2]) * 256; // size of the world in pixels

                        tilePath.projection()
                            .translate([k / 2 - d[0] * 256, k / 2 - d[1] * 256]) // [0°,0°] in pixels
                        .scale(k / 2 / Math.PI);

                        svg.selectAll("path")
                            .data(json.features)
                            .enter().append("path")
                            .attr("d", tilePath);

                    });
                });
        }
        markActive(roads)
    }



    function mousemoved() {
        info.text(formatLocation(projection.invert(d3.mouse(this)), zoom.scale()));
    }

    function printDate(val){
        date.text(new Date(val))
    }

    function matrix3d(scale, translate) {
        var k = scale / 256,
            r = scale % 1 ? Number : Math.round;
        return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1] + ")";
    }

    function prefixMatch(p) {
        var i = -1,
            n = p.length,
            s = document.body.style;
        while (++i < n)
            if (p[i] + "Transform" in s) return "-" + p[i].toLowerCase() + "-";
        return "";
    }

    function formatLocation(p, k) {
        var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
        return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " " + (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function getData(id, start_date, end_date, group_by_time){
        var deferred = $q.defer();
        influxQuery("select count(status) from road_"+id+" where status=0 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(views){
            influxQuery("select mean(status) from road_"+id+" where status>0 and status<6 and time > '"+start_date+"' and time < '"+end_date+"' group by time("+group_by_time+"m)").then(function(status){
                deferred.resolve([id,merge(views,status, angular.copy(date_template))])
            })
        })
        return deferred.promise
    }    

    function influxQuery(query){
        var deferred = $q.defer();
        influxdb.query(query+"order asc").then(function(results){
            deferred.resolve(results[0].points)
        })
        return deferred.promise
    }

    function changeStrokeWidth(ids, val){
        console.log("width: "+val)
        var width = val == -1? 1.5 : val/2
        // if(val != -1){
        ids.forEach(function(id){
            $('.'+id).css('stroke-width',width)    
        })
        // }
    }

    function changeStrokeColor(ids, val){
        console.log("color: "+val)
        var color = (val == -1)? hsv2rgb(0,0,0) : hsv2rgb(Math.floor((4 - val) * 120 / 4), 1, 1);
        ids.forEach(function(id){
            $('.'+id).css('stroke', color)    
        })            
        
    }

    function animateRoads(roads, index){
        for(var road_id in roads){
            if(roads[road_id].data){
                printDate(roads[road_id].data[index][0])
                changeStrokeWidth(roads[road_id].id,roads[road_id].data[index][1])
                changeStrokeColor(roads[road_id].id,roads[road_id].data[index][2])
            }
        }
    }

    function merge(arr1, arr2, obj){
        arr1.forEach(function(a){
            obj[a[0]][1] = a[1]// [a[0], a[1], -1]
        })
        arr2.forEach(function(a){
            obj[a[0]][2] = a[1]-1
            // if(obj[a[0]].length)
            // else
            //     obj[a[0]] = [a[0], -1, a[1]-1]
        })

        var merged_arr = $.map(obj, function(value, index) {
            return [value];
        })
        return merged_arr.sort(function (a, b) {
            return a[0] - b[0];
        })
    }

    var hsv2rgb = function(h, s, v) {
      var rgb, i, data = [];
      if (s === 0) {
        rgb = [v,v,v];
      } else {
        h = h / 60;
        i = Math.floor(h);
        data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
        switch(i) {
          case 0:
            rgb = [v, data[2], data[0]];
            break;
          case 1:
            rgb = [data[1], v, data[0]];
            break;
          case 2:
            rgb = [data[0], v, data[2]];
            break;
          case 3:
            rgb = [data[0], data[1], v];
            break;
          case 4:
            rgb = [data[2], data[0], v];
            break;
          default:
            rgb = [v, data[0], data[1]];
            break;
        }
      }
      return '#' + rgb.map(function(x){
        return ("0" + Math.round(x*255).toString(16)).slice(-2);
      }).join('');
    }

    function setDateTemplate(start, end, diff){
        var obj = {}
        var d = new Date(start)
        var end_date = new Date(end)
        while(d<= end_date){
            var ms = d.getTime()
            obj[ms]=[ms, -1, -1]
            d.setMinutes(d.getMinutes()+diff)
        }
        return obj
    }

    function markActive(roads){
        for(var road_id in roads){
            roads[road_id].id.forEach(function(id){
                $('.'+id).attr('class', function(index, classNames) {
                    return classNames + ' active';
                });
            })
        }
    }


});