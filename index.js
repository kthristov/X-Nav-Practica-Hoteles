// Funciones auxiliares para el scroll
$.fn.scrollTo = function( target, options, callback ){
  	if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
	  	var settings = $.extend({
		    	scrollTarget  : target,
		    	offsetTop     : 50,
		    	duration      : 500,
		    	seasing        : 'swing'
  	}, options);
	return this.each(function(){
	    	var scrollPane = $(this);
	    	var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
	    	var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
	    	scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function(){
		      	if (typeof callback == 'function') { callback.call(this); }
	    	});
	});
};

last_scroll = 0 ;
last_clicked = null ;

// Hace scroll y selecciona el campo.
// Se le pasa la casilla que se quiere seleccionar del div.
scroll_and_check = function(number) {
    	$('#hotel_list').scrollTo( (number - 2) * 42);
    	last_scroll = number ;

    	if(last_clicked)
		last_clicked.removeClass("active") ;
    	
    	var ind = number + 1  ;
    	var hotel = ".hotel:nth-child(" + ind + ")"
    	$( hotel ).addClass("active") ;
    	last_clicked = $( hotel ) ;
}


// Codigo que se ejecuta cuando se carga el DOM
$(function() {

	var madrid_coords = [40.433333, -3.683333] ;
	var map = L.map('map').setView( madrid_coords, 13);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

	var inserted_cat_list = false 

	var current = $("#mapa") ; // Inicializo la primera pestana
	current.addClass("active")

	// Evento para las animaciones cuando se hace click sobre la pestana colecciones.
	$("#colecciones").click( function() {
		current.removeClass("active") 
		current = $("#colecciones")
		current.addClass("active")

		// Click hecho estando en la pestaña de mapa
		$("#map").animate({
		    	left: "-1100px"
	    	}, 250 , "linear" , function() {

    		$("#hotel_list").animate({
    			marginTop: -$("#map").height(),
    			height : "800px"
    		}, 250 , "linear" , function() {

    		$("#categories_index").animate({
    			marginTop: -$("#map").height(),
    			height : "800px"
    		}, 250, "linear" , function() {

    		if (inserted_cat_list) {
    			$("#categorie_hotels").animate({
	    			marginTop: -$("#map").height(),
    				height : "800px"
	    		}, 250 )
    		}else { // La primera vez compirmira los dos div iniciales e insertara el de categorie_hotels

	 		$("#hotel_list").animate({
				width : "32%" 
	    		}, 250, "linear" , function() {

			$("#categories_index").animate({
				left : $("#categories_index").width(),
				width : "32%"
	    		}, 250, "linear" , function() {

			if (!inserted_cat_list) {
				margin_top = -$("#map").height()
				cat_hotels = "<div id='categorie_hotels' style='height : 800px ; margin-top : " + margin_top + "px;'></div>" 
				$("#content").append(cat_hotels)

		    		$("#categorie_hotels").animate({
		    			width: "32%"
		    		}, 250 )
		    		inserted_cat_list = true 
		    	}

    			})})
    		}

    		})})})

    		// Click hecho estando en la pestaña de alojados

    		// TODO


	});

	// Evento para las animaciones cuando se hace click sobre la pestana de mapa
	$("#mapa").click( function() {
		current.removeClass("active") 
		current = $("#mapa")
		current.addClass("active")

		// Click hecho estando en la pestaña de colecciones 
		$("#categorie_hotels").animate({
    			marginTop: "20px",
    			height : "294px"
    		}, 250 , "linear" , function() {

    		$("#categories_index").animate({
    			marginTop: "20px",
    			height : "294px"
    		}, 250 , "linear" , function() {

    		$("#hotel_list").animate({
    			marginTop: "20px",
    			height : "294px"
		}, 250 , "linear" , function() {
		
		$("#map").animate({
		    	left: "0px"
	    	}, 250)})})})
	});

	var hotel_list = insertHotels(map) // Una vez cargado el DOM inserta los hoteles.



});


// Funcion que me inserta la lista de hoteles desde el json.
// Ademas dado el mapa me los muestra en este.
// Una vez insertados los hoteles devuelve la lista de estos por si hacen falta 
// y asi no tener que pedirlos otra vez.
var insertHotels = function(map) {
	var hotel_list
	$.ajax({
		dataType: "json",
		method: "GET",
		url: "https://raw.githubusercontent.com/CursosWeb/Code/master/JS-APIs/misc/alojamientos/alojamientos.json",
	})
		.done(function( msg ) {
			hotel_list = msg.serviceList.service 
			dom_hotel_list = $("#hotel_list")
			aux_hotel_list = ""
			for (var i = 0 ; i < hotel_list.length ; i++){
				aux_hotel_list += ("<div class=' hotel ' value='" + i + "'><p>" + hotel_list[i].basicData.name + "</p></div>")
				hotel_list[i].index = i 
			}
			dom_hotel_list.append(aux_hotel_list)
			hotel_list = insertHotels_Markers(hotel_list, map)

			// Programa el evento click sobre los div.hotel ( antes no podia porque no estaban creados)
			$(".hotel").on("click", function() {
				var i = parseInt($(this).attr("value"))
				hotel_list[i].marker.openPopup()
				scroll_and_check(i)
				map.setView( [hotel_list[i].geoData.latitude , hotel_list[i].geoData.longitude ], 18)

			});
	});

	return hotel_list 
}

// Dada la lista de hoteles y el mapa, crea los markers ( con sus respectivos
// pop ups ) de hoteles colocandolos
// en el mapa y ademas los añade como un campo mas a la lista.
var insertHotels_Markers = function(list , map) {
	for (var i = 0 ; i < list.length ; i++){
		list[i].marker = L.marker( [list[i].geoData.latitude , list[i].geoData.longitude ] )

		var elto = "<p>" + list[i].basicData.name + "<br>" 
		elto += "<b>Address: </b> " + list[i].geoData.address + "</p>"

		list[i].marker.addTo(map).bindPopup(elto)
		list[i].marker.index = i
		list[i].marker.on("click" , function() {
			scroll_and_check(this.index)
		})
	}

	return list 
}




/*

$(function() {

    $("#source li").draggable({
        connectToSortable: '#destination',
        helper: 'clone'
    })

    $("#destination").sortable();

  });


*/
