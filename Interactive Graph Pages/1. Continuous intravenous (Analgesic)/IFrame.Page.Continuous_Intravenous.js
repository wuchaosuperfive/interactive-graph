//Global parameters defined here
var BodyWeight = 47;
var VolumnDistribution = {mean: 4, std: 1};
var Dose = 1.5;
var InfusionRate = 1.0;
var Clearance = {mean: 40, std: 6};
var hMax = 20;
var vMax = 0;
var clearance, actualKe;
var ActivePatient, DefaultPatient;
var firstPopulation = true;
var onePopulation = true;

//Calculation parameters defined here
var _K0, _Ke, _Vd;
var _First20Patients = {};

//Message repository variables
var messageRepository = {
    SwitchPatient: "switch patient",
    ChangePopulation: "change population",
    ShowPatientData: "show patient data",
    BackToFirstPatient: "back to first patient",
    Yes: "yes button clicked",
    FrequencySelection: "selected new frequency",
    DosageInput: "user input new new dosage",
    OptimizeCondition: "apply changes to infusion rate and frequency"
}

//Page Logic define here
document.getElementById("close_single").addEventListener("click", function() {
    $("#SinglePatientData")[0].classList.add('w3-animate-show');
    window.parent.postMessage("Close", "*");
});

document.getElementById("close_all_pop").addEventListener("click", function() {
    $("#PopulationModal")[0].classList.add('w3-animate-show');
    window.parent.postMessage("Close", "*");
});

document.getElementById("SinglePatientData").addEventListener('animationend', function() {
    if (this.classList.contains('w3-animate-show')) {
        this.style.display = 'none';
        this.classList.remove('w3-animate-show')
    }
});

document.getElementById("PopulationModal").addEventListener('animationend', function() {
    if (this.classList.contains('w3-animate-show')) {
          this.style.display = 'none';
          this.classList.remove('w3-animate-show')
    }
});

$(document).ready(function () {
    window.addEventListener("message", ReceiveMessage, false);
    InitVariables();
    SaveDefault();
    google.charts.load('current', {'packages':['line', 'corechart']});
    google.charts.setOnLoadCallback(SetGraphData);
});

//Behavioural functions define below
function ReceiveMessage(e) {
    var message = e.data.Message;
    if (message == undefined) 
    {
        alert("Unrecognized message received.");
        return;
    }

    var single = document.getElementById("SinglePatientData").style.display == "block";
    var all = document.getElementById("PopulationModal").style.display == "block";
    if (single || all) return;

    switch(message) {
        case messageRepository.SwitchPatient: SwitchPatient(); break;
        case messageRepository.ChangePopulation: ChangePopulation(); break;
        case messageRepository.ShowPatientData: ShowPatientData(); break;
        case messageRepository.Yes: YesButtonClick(); break;
        case messageRepository.BackToFirstPatient: BackToFirstPatient(); break;
        case messageRepository.OptimizeCondition: 
            OptimizeCondition({
                Dosage: e.data.Dosage,
                InfusionRate: e.data.InfusionRate
            }); break;
        case messageRepository.FrequencySelection: alert("Not in use."); break;
        case messageRepository.DosageInput: alert("Not in use."); break;
        default:
            alert("Invalid message posted, I am not reacting to it!");
            break;
    }
}

function InitVariables() {
    ActivePatient = Math.floor(Math.random()*20);

    _K0 = new Array(20);
    _Ke = new Array(20);
    _Vd = new Array(20);
    clearance = new Array(20);
    actualKe = new Array(20);

    Get20Patients();
}

function SaveDefault() {
    _First20Patients["_K0"] = _K0.slice();
    _First20Patients["_Ke"] = _Ke.slice();
    _First20Patients["_Vd"] = _Vd.slice();
    _First20Patients["clearance"] = clearance.slice();
    _First20Patients["actualKe"] = actualKe.slice();
    DefaultPatient = ActivePatient;
}

function RestoreDefault() {
   _K0 = _First20Patients._K0.slice();
   _Ke = _First20Patients._Ke.slice();
   _Vd = _First20Patients._Vd.slice();
   clearance = _First20Patients.clearance.slice();
   actualKe = _First20Patients.actualKe.slice();
   ActivePatient = DefaultPatient;
}

function SwitchPatient() {
    if (!firstPopulation) return;
    ActivePatient++;
    ActivePatient %= 20;
    SetGraphData();
}

function ShowPatientData() {
    var target = onePopulation? $("#SinglePatientData") : $("#PopulationModal");
    target.css("display", "block");
}

function ChangePopulation() {
    firstPopulation = false;
    Get20Patients();
    SetGraphData();
}

function YesButtonClick() {
    onePopulation = !onePopulation;
    SetGraphData();
}

function BackToFirstPatient() {
    RestoreDefault();
    firstPopulation = true;
    SetGraphData();
}

function OptimizeCondition(e) {
    RestoreDefault();
    var dose = e.Dosage;
    var rate = e.InfusionRate;
    if (dose == undefined)
    {
        alert("No dosage input!");
        return;
    }
    if (rate == undefined) 
    {
        alert("No infusion rate input!");
        return;
    }
    Dose = parseFloat(dose);
    InfusionRate = parseFloat(rate);
    for(var i = 0; i < 20; i++)
    {
        _K0[i] = Dose * InfusionRate;
    }
    onePopulation = true;
    firstPopulation = true;
    SetGraphData();
}

function Get20Patients() {
    for(var i = 0; i < 20; i++)
    {
        PrepareParameters(i);
    }
}

//Calculation function define below		
function CalculateMean(m, s)
{
    var a1 = m * m;
    var a2 = Math.sqrt(m * m + s * s);
    return Math.log(a1/a2);
}

function CalculateStd(m, s)
{
    var a1 = m * m;
    var a2 = a1 + s * s;
    return Math.sqrt(Math.log(a2/a1));
}

function PrepareParameters(i) {
    vMax = 0.00;
    
    _K0[i] = Dose * InfusionRate;
    _Vd[i] = jStat.lognormal.inv(Math.random(), 
                              CalculateMean(VolumnDistribution.mean, VolumnDistribution.std),
                              CalculateStd(VolumnDistribution.mean, VolumnDistribution.std)) * BodyWeight;
                              
    clearance[i] = jStat.lognormal.inv(Math.random(), 
                                    CalculateMean(Clearance.mean, Clearance.std),
                                    CalculateStd(Clearance.mean, Clearance.std));
                                    
    actualKe[i] = Math.min(0.9999, (clearance[i]*60)/(_Vd[i]*1000)*BodyWeight);
    _Ke[i] = Math.log(1) - Math.log(1 - actualKe[i]);
}

function AmountAtTime(t, i) {
    var a1 = _K0[i];
    var a2 = _Ke[i] * _Vd[i];
    var a3 = 1 - Math.exp(-_Ke[i]*t);
    return a1*a3/a2;
}

function Round2Decimal(val) {
    return Math.round(val*100)/100;
}

function Round4Decimal(val) {
    return Math.round(val*10000)/10000;
}

function OnePopulation() {
    var dataArray = new Array();
    var t = 0;
    while (t <= hMax)
    {
        var a = AmountAtTime(t, ActivePatient)
        dataArray.push([t, a]);
        t += 0.25;

        if (a > vMax) vMax = a;
    }
                            
    $("#SinglePatient_Vd").text(Round2Decimal(_Vd[ActivePatient]).toString());
    $("#SinglePatient_Cl").text(Round2Decimal(clearance[ActivePatient]).toString());
    $("#SinglePatient_THalf").text(Round2Decimal((Math.log(2)/_Ke[ActivePatient])).toString());
    $("#SinglePatient_Ka").text(Round2Decimal(actualKe[ActivePatient]).toString());
    $("#SinglePatient_CSS").text(Round4Decimal(dataArray[dataArray.length - 1][1]).toString());
    $("#SinglePatient_SteadyT").text(Round2Decimal((Math.log(2)/_Ke[ActivePatient]*4.5).toString()));
    
    vMax = Math.round(vMax*10000)/10000;
    return dataArray;
}

function AllPopulation() {						
    var population = new Array(hMax*4);
    var vd = 0, cl = 0, thalf = 0, ke = 0, cmin = 1000000, cmax = 0;
    
    for(var i = 0; i < hMax*4; i++)
    {
        population[i] = new Array(22);
        population[i][21] = 0;
    }

    for(var j = 0; j < 21; j++)
    {	
        PrepareParameters();
        vd += _Vd[j%20]/20*(j<20);
        cl += clearance[j%20]/20*(j<20);
        thalf += Math.log(2)/_Ke[j%20]/20*(j<20);
        ke += actualKe[j%20]/20*(j<20);
        for(var i = 0; i < hMax*4; i++)
        {
            var t = i * 0.25;
            if (j == 0) {
                population[i][j] = t;
            }
            else {
                population[i][j] = AmountAtTime(t, j-1);
                population[i][21] += population[i][j]/20;
            }
        }
        
        if (j == 0) continue;
    }

    $("#AllPatient_Vd").text(Round2Decimal(vd).toString());
    $("#AllPatient_Cl").text(Round2Decimal(cl).toString());
    $("#AllPatient_Ka").text(Round2Decimal(ke).toString());
    $("#AllPatient_THalf").text(Round2Decimal(thalf).toString());
    $("#AllPatient_CSS").text(Round4Decimal(population[population.length-1][21]).toString());
    $("#AllPatient_SteadyT").text(Round2Decimal(thalf*4.5).toString());
    
    
    vMax = Math.round(vMax*10)/10;
    return population;
}

function SetGraphData() {
    var data = onePopulation? OnePopulation() : AllPopulation();

    DrawGraph(data);
}

function DrawGraph(data) {
    var chart_styling = 
    chart_styling = 
    {
        legend: {
            textStyle: {
                color: "#14b4e0",
                fontSize: 12,
                bold: true
            }
        },
        hAxis: {
            title: "Hours",
            gridlines: {
                color: "#3a3a3a"
            },
            textStyle: {
                color: '#14b4e0',
                fontSize: 16,
                fontName: 'Arial',
                bold: true,
                italic: true
            },
            titleTextStyle: {
                color: '#14b4e0',
                fontSize: 16,
                fontName: 'Arial',
                bold: false,
                italic: true
            },
            ticks:[0, 5, 10, 15, 20]
        },
        vAxis: {
            title: "Concentration (mg/L)",
            gridlines: {
                color: "#3a3a3a"
            },
            textStyle: {
                color: '#14b4e0',
                fontSize: 16,
                fontName: 'Arial',
                bold: true,
                italic: true
            },
            titleTextStyle: {
                color: '#14b4e0',
                fontSize: 16,
                fontName: 'Arial',
                bold: false,
                italic: true
            },
            ticks: [0.01, 0.02, 0.03, 0.04]
        },
        chartArea: {
            top: 30,
            left: 80,
            width: '76%',
            height: '80%'
        },
        width: 890,
        height: 500,
        backgroundColor: '#000000',
        series: {}
    }
    var table = new google.visualization.DataTable();
    table.addColumn("number", "Time");
    if (onePopulation) {
        table.addColumn("number", "Patient-"+(ActivePatient+1).toString());
        chart_styling.series = {
            0: {color: '#00FF00'}
        }
    }
    else {
        for (var i = 1; i <= 20; i++)
        {
            table.addColumn("number", "Patient-"+i);
            if (!firstPopulation || i != ActivePatient+1) 
                chart_styling.series[i-1] = {
                    lineWidth: 1,
                    lineDashStyle: [4, 4],
                    color: "#1EB1EE",
                    visibleInLegend: false
                };
            else
                chart_styling.series[i-1] = {
                    lineWidth: 3,
                    color: "#00FF00",
                    visibleInLegend: true
                };
        }
        table.addColumn("number", "Average");
        chart_styling.series["20"] = {
            lineWidth: 3,
            color: "#FF0000",
            visibleInLegend: true
        }
    }
    table.addRows(data);
    var chart = new google.visualization.LineChart(document.getElementById("ChartArea"));
    chart.draw(table, chart_styling);
}