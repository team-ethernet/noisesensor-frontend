let startDate = moment().subtract(7, 'd');
let endDate =  moment();


//SORT ARRAY, GROUP BY ID
const groupBy = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});

    
function load(json) {
    const groupById = groupBy('bn');
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
            legendCallback: function (chart) {
                var legendHtml = [];
                legendHtml.push('<table>');
                legendHtml.push('<tr>');
                for (var i = 0; i < chart.data.datasets.length; i++) {
                    legendHtml.push('<div class="chart-legend" style="background-color:' + chart.data.datasets[i].backgroundColor + '"></div>');
                    if (chart.data.datasets[i].label) {
                        legendHtml.push('<input id="sen'+i+'" type="checkbox" class="sen' + i + '" onclick="updateDataset(event, ' + '\'' + chart.legend.legendItems[i].datasetIndex + '\')"> <label for="sen' + i + '">' + chart.data.datasets[i].label + '<span style="background-color: ' + chart.data.datasets[i].borderColor + '"></span></label>');
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
                x: moment(sortedarray[key][i].t).format(timeFormat),
                y: sortedarray[key][i].v
            });
        }
        
        config.data.datasets.push(datasetdata);
    }

    //DRAW GRAPH
    var ctx = document.getElementById("canvas1").getContext("2d");
    chart = new Chart(ctx, config);

    //GENERATE LEGENDS
    document.getElementById('sensorselectbox').innerHTML = chart.generateLegend();

}

//UPDATE GRAPH
updateDataset = function (e, datasetIndex) {
    var meta = chart.getDatasetMeta(datasetIndex);
    if ($(".sen" + datasetIndex).is(":checked"))
        meta.hidden = false;
    else
        meta.hidden = null;

    chart.update();
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
$(function () {
    $('input[name="datetimes"]').daterangepicker({
        timePicker: true,
        timePicker24Hour: true,
        startDate: startDate.format('YYYY-MM-DD HH:mm'),
        endDate: endDate.format('YYYY-MM-DD HH:mm'),
        locale: {
            format: 'YYYY-MM-DD HH:mm'
        }
    }, function(start, end, label) {
        startDate = start;
        endDate = end;
      });
});

$("#submit-button").on("click", function() {
    let startTimestamp = startDate.toDate().getTime();
    let endTimestamp = endDate.toDate().getTime();
    let mindB = $("#mindBInput").val();
    let maxdB = $("#maxdBInput").val();
    update(startTimestamp, endTimestamp, mindB, maxdB);
});

function update(startTimestamp, endTimestamp, mindB, maxdB) {
    $.getJSON(`http://localhost:8080/data?startDate=${startTimestamp}&endDate=${endTimestamp}&minNoiseLevel=${mindB}&maxNoiseLevel=${maxdB}`)
    .then(function(json) {
        load(json);
    });
}