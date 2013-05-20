var dataset = [];
var rawdata = [];
var dicionario = [];
var cidade = "";

//Recebe uma cidade e pinta os botoes
function getMenuOption(selection) {
    cidade = selection.options[selection.selectedIndex].value;
	plotSeries(cidade);
	rawdata = dataset.filter(function(i){return i.NOME_MUNICIPIO == cidade;})	
	
	dicionario.sort(function (a, b) {
    			return getDesvio(a.desvio) - getDesvio(b.desvio);
	});
	d3.selectAll(".indicador")
	.data(dicionario)
	.attr("class", function(d) {
          return "indicador " + getButtonColor(d.desvio);
    })
	.attr("value", function (d){return d.name;})
	.attr("id", function (d, i){return d.id;})
	.transition().delay(function(d, i) {
		return i * 50;
	}).duration(1000)
    .on("click", function(d) {
		//plotNome(d.name); TODO
		plotIndicadores(d.id);
		plotSeries(cidade,d.id);
	});	
	
   // plotIndicadores("");
   // plotSeries(""); 
   // plotSeries(value); 
   // plotIndicadores(value);   
    
};

Array.prototype.unique = function() {
    var o = {}, i, l = this.length, r = [];
    for(i=0; i<l;i+=1) o[this[i]] = this[i];
    for(i in o) r.push(o[i]);
    return r;
};

//Retorna o valor do desvio
function getDesvio(colunaDesvio) {
	valor = getRecentValueIndicadorColuna(colunaDesvio);
	if (valor == "NA" ) {
		return 10;
	}else{
		return parseFloat(valor);
	}
}


//Carrega arquivo inicial e os botoes
function loadData() {
	d3.csv("data/tabela_com_todos_os_indicadores_selecionados_e_desvios.csv" , function (data){
		
		dataset = data;
		
		//compara unicode characters
		function sortComparer(a,b){
			return a.localeCompare(b);
		};
		
		var cities = data.map(function(d){return d.NOME_MUNICIPIO;}).unique().sort(sortComparer);
		//adiciona um vazio dentro do array
		cities.unshift("");
		
		var myList = d3.selectAll("#myList");
		
		myList.selectAll("option").data(cities).enter().append("option")
		.attr("value",function(d){return d;})
		.attr("label",function(d){return d;});
	
	});
	loadUpButtons();
};


//Carrega os botoes da parte de cima
function loadUpButtons() {
	d3.csv("data/dicionario.csv" , function (data){
		dicionario = data;
		var div_buttons = d3.select("#div_indicador_options");	
		
		div_buttons.selectAll("input")
		.data(data)
		.enter()
		.append("input")
		.attr("type","button")
		.attr("value", function (d){return d.name;})
		.attr("id", function (d, i){return d.id;})
        .attr("class", "indicador indicador_cinza")
		.on("click", function(d) {
			plotIndicadores(d.id);
			plotSeries(cidade,d.id);
		});	
	});
}

//Pode retornar NA se não houver nenhum ano disponivel para o Indicador
function getRecentValueIndicadorColuna(colunaDesvio) {
	var maxYear = rawdata.filter(function(d){return d[colunaDesvio] != "NA";}).map(function(d){return parseInt(d.ANO)});
	if (maxYear.length == 0) {
		return "NA";
	}
	else {
		maxYear = d3.max(maxYear);
		var currentYearData = rawdata.filter(function(d){return d.ANO == maxYear;})[0];
		return currentYearData[colunaDesvio];
	}
}

//Retorna a cor do Botao
function getButtonColor(colunaDesvio) {
	valor = getRecentValueIndicadorColuna(colunaDesvio);
	if (valor == "NA" ) {
        return "indicador_cinza";
//		return "gray";
	}
	else if (parseFloat(valor) == -2) {
        return "indicador_amarelo";
        //return "#FFCC00";
	}
	else if (parseFloat(valor) == -3) {
		return "indicador_laranja";
        //return "#FF6600";
	}
	else if (parseFloat(valor) <= -4) {
		return "indicador_vermelho";
        //return "#FF0000";
	}
	else if (parseFloat(valor) >= 3) {
        return "indicador_verde";
//		return "green";
	}
	else {
        return "indicador_branco";
		//return "#E0E0E0";
	}
}

//Plota grafico
function plotIndicadores(indicador) {
// e se todos forem NAs?
	
	//Width and height
	var w = 800;
	var h = 350;
	
	if(rawdata.length != 0){
		
		var max_estado, min_estado, max_meso, min_meso,max_micro, min_micro;
	
		var maxYear = d3.max(rawdata.filter(function(d){return d[indicador] != "NA";}).map(function(d){return parseInt(d.ANO)}));
		var currentYearData = rawdata.filter(function(d){return d.ANO == maxYear;})[0];
		var subset = [10, parseFloat(currentYearData[indicador])];

		var margin = {top: 30, right: 120, bottom: 40, left: 60},
			width = w - margin.left - margin.right,
			height = h - margin.top - margin.bottom;
		
		//Create SVG element
		var svg = d3.select("#div_indicador").select("svg");

		var x = d3.time.scale()
			.range([0, width]);

		var y = d3.scale.linear()
			.range([height, 0]);
		
		//create line element
		var line = d3.svg.line()
			.x(function(d) { return d.x})
			.y(function(d) { return d.y});
	
		var estado = dataset.filter(function(d){return d[indicador] != "NA" & d.ANO == currentYearData.ANO;});
			
		var meso = dataset.filter(function(d){return d[indicador] != "NA" & d.NOME_MESO == currentYearData.NOME_MESO & d.ANO == currentYearData.ANO;});
		
		var micro = dataset.filter(function(d){return d[indicador] != "NA" & d.NOME_MICRO == currentYearData.NOME_MICRO & d.ANO == currentYearData.ANO;});
		
		//pegando valores unicos
		max_estado = d3.max(estado, function(d){return parseFloat(d[indicador])});
		min_estado = d3.min(estado, function(d){return parseFloat(d[indicador])});
		max_meso = d3.max(meso, function(d){return parseFloat(d[indicador])});
		min_meso = d3.min(meso, function(d){return parseFloat(d[indicador])});
		max_micro = d3.max(micro, function(d){return parseFloat(d[indicador])});
		min_micro = d3.min(micro, function(d){return parseFloat(d[indicador])});
		
		var linedata = [{'x' : min_estado , 'y' : 100}, {'x': (width) - max_estado, 'y' : 100}];
					
		var line_meso =[{'x' : min_meso , 'y' : 185}, {'x': (width) - min_meso, 'y' : 185}];
		
		var line_micro = [{'x' : min_micro , 'y' : 270}, {'x': (width) - min_micro, 'y' : 270}];
		
		if (svg[0][0] == null){
			//filtrando as tabelas de acordo com os dados
			var svg = d3.select("#div_indicador").append("svg").attr("width", w).attr("height", h);

			x.domain([min_estado,width]);
			y.domain([0,height]);

				
		    svg.append("linearGradient")
			  .attr("id", "temperature-gradient")
			  .attr("gradientUnits", "userSpaceOnUse")
			  .attr("x1", x(min_estado)).attr("y1", y(100))
			  .attr("x2", x((width) - max_estado)).attr("y2", y(100))
			.selectAll("stop")
			  .data([
				{offset: "0%", color: "red"},
			//	{offset: "25%", color: "orange"},
				{offset: "60%", color: "yellow"},
				{offset: "100%", color: "green"}
			  ])
			.enter().append("stop")
			  .attr("offset", function(d) { return d.offset; })
			  .attr("stop-color", function(d) { return d.color; });

		    svg.append("path")
			  .datum(linedata)
			  .transition().delay(50)
			  .attr("class", "line")
			  .attr("d", line)
			  .style("stroke-width", 5);
		
			// var path = svg.append("path")
				// .transition().delay(50)
				// .attr("class", "line_estado")
				// .attr("d", line(linedata))
				// .style("stroke-width", 5);
			
			svg.append("path")
				.transition().delay(50)
				.attr("class", "line")
				.attr("d", line(line_meso))
				.style("stroke","grey")
				.style("stroke-width", 5);
			
			svg.append("path")
				.transition().delay(50)
				.attr("class", "line")
				.attr("d", line(line_micro))
				.style("stroke","grey")
				.style("stroke-width", 5);

		}else{
			svg.selectAll("path")
				.transition().delay(50)
				.remove();
				
			svg.append("path")
				  .datum(linedata)
				  .transition().delay(50)
				  .attr("class", "line")
				  .attr("d", line)
				  .style("stroke-width", 5);
			
			svg.append("path")
				.transition().delay(50)
				.attr("class", "line")
				.attr("d", line(line_meso))
				.style("stroke","grey")
				.style("stroke-width", 5);

			svg.append("path")
				.transition().delay(50)
				.attr("class", "line")
				.attr("d", line(line_micro))
				.style("stroke","grey")
				.style("stroke-width", 5);
			
			// var bars = d3.select("#div_indicador").select("svg").selectAll("rect")
			// .data(subset)
			// .transition()
			// .attr("y", function(d) {
				// return h - yScale(d);
			// });
		}
	
		
		//Define sort order flag
		// var sortOrder = false;
	
		// //Define sort function
		// var sortBars = function() {
	
			// //Flip value of sortOrder
			// sortOrder = !sortOrder;
	
			// svgBar.selectAll("rect").sort(function(a, b) {
				// if (sortOrder) {
					// return d3.ascending(a, b);
				// } else {
					// return d3.descending(a, b);
				// }
			// }).transition().delay(function(d, i) {
				// return i * 50;
			// }).duration(1000).attr("x", function(d, i) {
				// return xScale(i);
			// });
	
		// };		
	}else{
		d3.select("svg").remove();
	}
	
};

