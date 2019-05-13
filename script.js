let startDate = moment().subtract(7, 'd');
let endDate =  moment();
let latestDataTimestamp = 0;
let JSON_DATA = {};
let visible = {};
const liveUpdateTimeInterval = 5000;
const APIURL = "http://localhost:8080";
//FORMAT TO BE USED BY GRAPH
    const timeFormat = 'DD/MM/YYYY HH:mm:ss';

    //GRAPH INITIAL CONFIG
    const initialConfig = {

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
                    legendHtml.push(`<div class="chart-legend" style="background-color: ${chart.data.datasets[i].backgroundColor}"></div>`);
                    if (chart.data.datasets[i].label) {
                        legendHtml.push(`<input id="sen${i}" type="checkbox" class="sen${i}" onclick="updateDataset(event, ${chart.legend.legendItems[i].datasetIndex}, '${chart.data.datasets[i].label}')"> <label for="sen${i}"> ${chart.data.datasets[i].label} <span style="background-color: ${chart.data.datasets[i].borderColor}"></span></label>`);
                    }
                }

                //If no data was loaded selectallcheckbox & downloadbox is disabled, otherwise enabled
                if(chart.data.datasets.length == 0){
                    document.getElementById('selectallcheckbox').disabled = true;
                    document.getElementById('download-button').disabled = true;
                    document.getElementById('download-data').disabled=true;
                }
                else{
                    document.getElementById('selectallcheckbox').disabled = false;
                    document.getElementById('download-button').disabled = false;
                    document.getElementById('download-data').disabled=false;
                }
                return legendHtml.join("");
        },
        legend: {
            display: false
        },
        animation: {
            duration: 0
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


//SORT ARRAY, GROUP BY ID
const groupBy = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});

function load(json) {
    //DRAW GRAPH
    var ctx = document.getElementById("canvas1").getContext("2d");
	if(typeof chart !== "undefined")
		chart.destroy();
    chart = new Chart(ctx, initialConfig);

    insertData(json);
    //GENERATE LEGENDS
    document.getElementById('sensorselectbox').innerHTML = chart.generateLegend();
}

function insertData(json) {
    chart.data.datasets = [];
    JSON_DATA = json;
    const groupById = groupBy('bn');
    var sortedarray = groupById(json);
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
            if(latestDataTimestamp<sortedarray[key][i].t){
                latestDataTimestamp = sortedarray[key][i].t;
            }
            datasetdata.data.push({
                x: moment(sortedarray[key][i].t).format(timeFormat),
                y: sortedarray[key][i].v
            });
        }
        if (visible[key]) {
            datasetdata.hidden = false;
        }

        chart.data.datasets.push(datasetdata);
    }
	chart.update();
}

//Select all boxes.
//If selectallcheckbox is checked, loop through data checkboxes, enable them and update graph.
//Same for unchecking.

function selectall()
{
  if(document.getElementById('selectallcheckbox').checked){
    for(var j = 0; j < chart.data.datasets.length; j++)
    {
      document.getElementById("sen" + j).checked = true;
      updateDataset(event, chart.legend.legendItems[j].datasetIndex, chart.data.datasets[j].label);
      //document.getElementById('selectallcheckbox').checked = false;
    }
  }
  else {
    for(var j = 0; j < chart.data.datasets.length; j++)
    {
      document.getElementById("sen" + j).checked = false;
      updateDataset(event, chart.legend.legendItems[j].datasetIndex, chart.data.datasets[j].label);
    }
  }
}

//UPDATE GRAPH
updateDataset = function (e, datasetIndex, label) {
    var meta = chart.getDatasetMeta(datasetIndex);
    if ($(".sen" + datasetIndex).is(":checked")) {
        meta.hidden = false;
		visible[label] = true;
    }
    else {
        meta.hidden = true;
        visible[label] = false;
    }

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
//DOWNLOAD DATA
//When the download button is pressed this function will run
//It will go through all the data that is currently loaded and if it is marked as visible
//it will add it to dataStr. This variable is a string of all the data that is currently
//being showed and will then become a json file which will be downloaded by the user.
function downloadObjectAsJson(){
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(JSON_DATA.filter((item) => visible[item.bn])));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href",     dataStr);
  downloadAnchorNode.setAttribute("download", "data.json");
  document.body.appendChild(downloadAnchorNode); //required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
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
    window.clearInterval();
    visible = {};
    let startTimestamp = startDate.toDate().getTime();
    let endTimestamp = endDate.toDate().getTime();
    let mindB = $("#mindBInput").val();
    let maxdB = $("#maxdBInput").val();
    update(startTimestamp, endTimestamp, mindB, maxdB);
    if($("#liveUpdateCheckbox")[0].checked){
        window.setInterval(function(){
            addData();
            /// Call every 5 seconds. Stop using clearInterval()
        }, liveUpdateTimeInterval);
    }
    document.getElementById('selectallcheckbox').checked = false;
    selectall();
});

//DOWNLOAD CHART
//Uses Filesaver.js & canvas-toBlob.js
$("#download-button").click(function() {
 	    $("#canvas1").get(0).toBlob(function(blob) {
    		saveAs(blob, "chart.png");
		});
});

function addData() {
    let startTimestamp = latestDataTimestamp + 1;
    let endTimestamp = moment().toDate().getTime();
    let mindB = $("#mindBInput").val();
    let maxdB = $("#maxdBInput").val();

    $.getJSON(`${APIURL}/data?startDate=${startTimestamp}&endDate=${endTimestamp}&minNoiseLevel=${mindB}&maxNoiseLevel=${maxdB}`)
    .then(function(json) {
      JSON = json.concat(JSON);
      insertData(JSON);
    });
}

function update(startTimestamp, endTimestamp, mindB, maxdB){
    $.getJSON(`${APIURL}/data?startDate=${startTimestamp}&endDate=${endTimestamp}&minNoiseLevel=${mindB}&maxNoiseLevel=${maxdB}`)
    .then(function(json) {
        load(json);
    });
}
