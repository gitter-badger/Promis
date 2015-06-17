$(function(){
    var w = $(window);
    var g = $('.graph');
    var t = $('.toolbox');

    g.width(w.width() - t.outerWidth() - 20); // @TODO: remove this magic number
    g.height(w.height());
    t.height(w.height());
}); 

angular.module('viewer-app', [], function ($interpolateProvider) {
    $interpolateProvider.startSymbol('[[');
    $interpolateProvider.endSymbol(']]');
});

function DataViewerCtrl($scope, $http) {
    $scope.data = {
        data_source: '',//'Variant',
        channels: {
            options: [],
            selected: '',
            //{
            //     device: {
            //         satellite: "Variant",
            //         title: "DC fluxgate magnetometer FZM",
            //     },
            //     title: "By quasiconstant",
            // },
        },
        time: {
            begin: '', //'2004-02-01T08:21:58Z',
            end: '' //2006-02-01T08:23:10Z'
        },
        data: []
    };

    $scope.requestConditionsCorrect = function () {
        return [
            $scope.data.channels.selected !== '',
            $scope.data.time.begin !== '',
            $scope.data.time.end !== '',
        ].every(Boolean);
    };

    $scope.downloadFileConditionCorrect = function () {
        return Boolean($scope.data.data.length)
    };

    $scope.loader = {
        messages: {},
        length: 0,
        push: function (code, msg) {
            if (!$scope.loader.messages[code]) {
                ++$scope.loader.length;
            }
            $scope.loader.messages[code] = msg;
        },
        pop: function (code) {
            if ($scope.loader.messages[code]) {
                --$scope.loader.length;
                delete $scope.loader.messages[code];
            }
        },
    };

    $scope.$watch('data.data_source', function(new_value, old_value) {
        if (!new_value) {
            return;
        };

        $scope.loader.push("channels-loading","Loading channels list for `" + $scope.data.data_source + "`. " + 
            "Be patient, it could takes a while, when it happens first time...");
        $http.get('/channels/', {
            params:{
                satellite: new_value,
                format: 'json'
            }
        }).then(function (res) {
                // $scope.data_structure = res.data.structure;
                $scope.data.channels.options = res.data;
                // $scope.data.channels.selected = $scope.data.channels.options[1];
                // $scope.channel_state = 'present';
                // $scope.loader_status = false;
                $scope.loader.pop("channels-loading");
                // document.data_structure = res.data.structure;
                // setTimeout(bind_hidable, 1);
                return res.data;
            });
    });

    $scope.loadData = function() {
        $scope.loader.push("data-loading","Loading measurement data for `" + $scope.data.channels.selected.title + 
            "` channel of `" + $scope.data.data_source + "`. " + 
            "Be patient, it could takes a while, when it happens first time...");
        return $http.get('/measurements/', {
            params:{
                satellite: $scope.data.data_source,
                channel: $scope.data.channels.selected.title,
                time_interval: $scope.data.time.begin + "_" + $scope.data.time.end,
                format: 'json'
            }
        }).then(function (res){
            $scope.data.data = res.data;
            // $scope.blob = new Blob([ '$scope.data.data' ], { type : 'text/plain' });
            // $scope.url = (window.URL || window.webkitURL).createObjectURL( $scope.blob );
            console.log(res.data);
            if ($scope.data.data.length){
                $scope.drawData(res.data);
            }
            $scope.loader.pop("data-loading");
            // $scope.loader.push("no-data", 'There are no data of this time period')
            return res.data;
        })
        // }).then(function (res) {
        //     // console.log(res);
        //     // $scope.drawData(res);
        //     return res;
        // });
    };

    // $scope.filename = $scope.data.channels.selected.title + $scope.data.time.begin + ".txt"

    $scope.downloadData = function () {
        filename = $scope.data.channels.selected.title + $scope.data.time.begin + ".txt"
        
        $scope.data.data.forEach(function(d) {
            d.line = String(d.measurement_point.time) + ' ' + String(d.measurement) + '\n'
        });

        // function join(previous, current, i) {
        //     current.line = previous.line + current.line;
        //     return current.line
        // }

        var text_to_file = '';
        for (var i=0; i<$scope.data.data.length; i++){
            text_to_file += $scope.data.data[i].line
        }

        // $scope.data.data.forEach(function(d) {
        //     String(d.measurement) + 
        // });

        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text_to_file));
        pom.setAttribute('download', filename);
        pom.click();
    }
        // // @TODO: remove this dirty fix
        // // probably: http://gurustop.net/blog/2014/01/28/common-problems-and-solutions-when-using-select-elements-with-angular-js-ng-options-initial-selection/
        // $scope.source_file_selected = $('[name="source_file_selected"]').val();

        // if (!parseInt($('[name="source_file_selected"] option:selected').val())) {
        //     return;
        // }

        // $scope.data_status = 'loading';

        // // Collect checkboxes (probably could be done in better way)
        // var args = [];
        // $('[name="data-selection-options"]')
        //     .find('[type="radio"]')
        //     .each(function() {
        //         var self = $(this);
        //         if (self.is(':checked')) {
        //             $scope.choosen_data_row = self.val();
        //             args.push(self.attr('name').replace(' ', '').replace(' ', '') + '=' + self.val());
        //         }
        // });

        // y_description = {name: '', units: ''}
        // for (i = 0; i < $scope.data_structure.data.length; ++i) {
        //     if ($scope.data_structure.data[i].name == $scope.choosen_data_row) {
        //         y_description = $scope.data_structure.data[i];
        //     }
        // }

        // $scope.loader_message = "Loading " + y_description.title + " [" + y_description.units + "] data for period " + 
        //     $('[name="source_file_selected"] option:selected').html() + ".";
        // $scope.loader_status = true;

        // args.push('data_source=' + $scope.data_source);
        // args.push('source_file=' + $scope.source_file_selected);

        // $http.get('/data?' + args.join('&'))
        //     .then(function(res) {
        //         document.parse_data = res.data;
        //         draw_data(res.data, y_description);
        //         $scope.data_status = 'present';
        //         $scope.loader_status = false;
        //     });
    // });

    $scope.drawData = function (data) {
        var g = $('.graph');

        g.html('');

        var margin = {top: 30, right: 20, bottom: 70, left: 150};
        var width = g.width() - margin.left - margin.right;
        var height = g.height() - margin.top - margin.bottom;


        var parseDateWithMs = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ").parse;
        var parseDate = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

                // drawing data
        data.forEach(function(d) {
            if (d.measurement_point.time.length == 20){
                d.x = parseDate(d.measurement_point.time);
            } else {
                d.x = parseDateWithMs(d.measurement_point.time);
            }
        });

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x).ticks(10)
            .orient("bottom")
            .tickFormat(d3.time.format('%X.%L'));

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function(d) { return x(d.x); })
            .y(function(d) { return y(d.measurement); });

        var svg = d3.select(".graph").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        x.domain(d3.extent(data, function(d) { return d.x; }));
        y.domain(d3.extent(data, function(d) { return d.measurement; }));

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")  
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", function(d) {
                    return "rotate(-30)" 
                })

         svg.append("text")
            .attr("transform", "translate(0," + height + ")")
            // .attr("transform", "rotate(-90)")
             //.attr("x", width - 150)
             .attr("y", -10)
             .attr("dx", ".71em")
            .style("text-anchor", "start")
            .text('Start Date: ' + data[0].measurement_point.time.slice(0,10));

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text($scope.data.channels.selected.title + ', '+ $scope.data.channels.selected.parameters[0].units);

        $scope.svg = svg;


        svg.append("path")
            .datum(data)
            .attr("cy", function (d) { return d.measurement; })
            .attr("class", "line")
            .attr("d", line);
    };

}
