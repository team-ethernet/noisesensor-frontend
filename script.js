
		
			
			
			//SORT ARRAY, GROUP BY ID
			const groupBy = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});


	
		
		$.getJSON("http://localhost:8080/data.json").then(function(data) {
			var json = data;
			
			const groupById = groupBy('noiseSensorId');
			var sortedarray = groupById(json);
	
			
			
//FORMAT TO BE USED BY GRAPH
var timeFormat = 'DD/MM/YYYY HH:mm:ss';


//GRAPH INITIAL CONFIG
var config = {
    type: 'line',
    data: {
        datasets: []
    },
    options: {
        legendCallback: function(chart) {
            console.log(chart);
            var legendHtml = [];
            legendHtml.push('<table>');
            legendHtml.push('<tr>');
            for (var i = 0; i < chart.data.datasets.length; i++) {
                legendHtml.push('<div class="chart-legend" style="background-color:' + chart.data.datasets[i].backgroundColor + '"></div>');
                if (chart.data.datasets[i].label) {
                    legendHtml.push('<input id="' + chart.data.datasets[i].label + '" type="checkbox" class="' + chart.data.datasets[i].label + '" onclick="updateDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\')"> <label for="' + chart.data.datasets[i].label + '">' + chart.data.datasets[i].label + '<span style="background-color: ' + chart.data.datasets[i].borderColor + '"></span></label>');
                }
            }
            return legendHtml.join("");
        },
        legend: {
            display: false
        },
        responsive: true,
        title: {
            display: false
        },
        scales: {
            xAxes: [{
                type: "time",
                time: {
                    format: timeFormat,
                    tooltipFormat: timeFormat
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'dB'
                }
            }]
        }
    }
};
			
			
			
			//LOOP THROUGH SORTED ARRAY AND INSERT INTO DATASETS
			for (var key in sortedarray) {
				var color = intToRGB(hashCode(key));
				var datasetdata = {
					label: key,
					data: [],
					fill: false,
					borderColor: '#' + color,
					lineTension: 0.2,
					hidden: true
				};
				var i;
				for (i = 0; i < sortedarray[key].length; i++) {
					datasetdata.data.push({
						x: moment(sortedarray[key][i].date).format(timeFormat),
						y: sortedarray[key][i].value
					});
				}
				config.data.datasets.push(datasetdata);
			}

			//DRAW GRAPH
			var ctx = document.getElementById("canvas1").getContext("2d");
			chart = new Chart(ctx, config);

			//GENERATE LEGENDS
			document.getElementById('sensorselectbox').innerHTML = chart.generateLegend();
			
		});
		


						





//UPDATE GRAPH
updateDataset = function(e, datasetIndex) {
    var index = datasetIndex;
    var ci = e.view.chart;
    var meta = ci.getDatasetMeta(index);
	var checkboxclass = chart.config.data.datasets[index]["label"];
    if ($("." + checkboxclass).is(":checked"))
        meta.hidden = false;
    else
        meta.hidden = null;

    ci.update();
};

//HASHCODE TO BE USED BY INT TO RGB
function hashCode(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

//GET UNIQUE COLOR FROM EVERY ID
function intToRGB(i) {
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}



//DATERANGEPICKER
$(function() {
    $('input[name="datetimes"]').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: moment().subtract(7, 'd').format('YYYY-MM-DD HH:mm'),
        endDate: moment().add(7, 'd').format('YYYY-MM-DD HH:mm'),
        locale: {
            format: 'YYYY-MM-DD HH:mm'
        }
    });
});