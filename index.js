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
last_cat_hotel_clicked = null ;
last_cat_clicked = null ;
full_hotels_info = null ;
inserted_cat_list = false 

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

var lista_categorias = {}

// Codigo que se ejecuta cuando se carga el DOM
$(function() {

	var madrid_coords = [40.433333, -3.683333]
	var map = L.map('map').setView( madrid_coords, 13);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

	var current = "#mapa" // Inicializo la primera pestana
	$(current).addClass("active")

	// Evento para las animaciones cuando se hace click sobre la pestana colecciones.
	$("#colecciones").click( function() {

		// Click hecho estando en la pestaña de mapa
		if( current == "#mapa" ){
			inserted_cat_list  = collection_click_from_map(inserted_cat_list) 
		}

    		// Click hecho estando en a pestaña de alojados
    		if ( current == "#alojados" ){
    			collection_click_from_hotel_info(inserted_cat_list)
    		}

		$(current).removeClass("active") 
		current = "#colecciones"
		$(current).addClass("active")
	})

	// Evento para las animaciones cuando se hace click sobre la pestana de mapa
	$("#mapa").click( function() {

		// Click hecho estando en la pestaña de colecciones
		if( current == "#colecciones" )
			map_click_from_collection() 

	    	// Click estando en la pestaña de alojados.
	    	if( current == "#alojados" )
	    		map_click_from_hotel_info()

		$(current).removeClass("active") 
		current = "#mapa"
		$(current).addClass("active")
	})

	$("#alojados").click( function() {

		if ( current == "#colecciones" )
			alojados_click_from_collection()

		if (current == "#mapa")
			alojados_click_from_map()

		$(current).removeClass("active") 
		current = "#alojados"
		$(current).addClass("active")
	})

	full_hotels_info  = insertHotels(map) // Una vez cargado el DOM inserta los hoteles.

	// Eventos para cambiar el boton de crear categoria.
	$("#cat_input").focusin(function() {
		$("#cat_button").addClass("btn-primary").addClass("button_focused").removeClass("btn-default")
	})

	$("#cat_input").focusout(function() {
		$("#cat_button").addClass("btn-default").removeClass("button_focused").removeClass("btn-primary");

	})

	$('#cat_input').keyup( function (e) {
		if (e.keyCode === 13) {
			crear_categoria()
		}
	})

	$("#cat_button").click(crear_categoria)

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
				aux_hotel_list += "<div class=' hotel ' value='" + i + "'" 
				aux_hotel_list += "name='" +  hotel_list[i].basicData.name  + " '>"
				aux_hotel_list += "<p>" + hotel_list[i].basicData.name + "</p></div>"
				hotel_list[i].index = i 
			}
			dom_hotel_list.append(aux_hotel_list)
			hotel_list = insertHotels_Markers(hotel_list, map)

			// Programa el evento click sobre los div.hotel ( antes no podia porque no estaban creados)
			$(".hotel").draggable({
				helper: "clone"
			}).click( function() {
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


// Funcion que realiza las animaciones para pasar a la pestana de colecciones
// desde la pestana de mapa.
var collection_click_from_map = function (inserted_cat_list) {

	$("#map").animate({
	    	height: "0px"
    	}, 250 )

	$("#hotel_list").animate({
		height : "800px"
	}, 250 )

	$("#categories_index").animate({
		height : "800px"
	}, 250 )

	if (!inserted_cat_list) { // La primera vez compirmira los dos div iniciales
				  // e insertara el de categorie_hotels

	$("#hotel_list").animate({
		width : "32%"  
	}, 250, "linear" , function() {

	$("#categories_index").animate({
		left : $("#categories_index").width(),
		width : "32%"
	}, 250, "linear" , function() {

	cat_hotels = "<div id='categorie_hotels' style='height : 800px ; margin-top : 20px;'></div>" 
	$("#collections").append(cat_hotels)

	$("#categorie_hotels").animate({
		width: "32%"
	}, 250 )

	})})

	}

	$("#categorie_hotels").animate({
		height : "800px"
	}, 250 )

	return true ; // Devuelve una afirmacion de que ha sido llamado.

}

var collection_click_from_hotel_info = function(aux_var, to_map, to_hotel) {

    	$("#hotel_info").animate({
    		height : "0px"  
    	}, 250 , "linear" , function() { 

		$("#hotel_list").animate({
			height : "800px"
		}, 250 )

		if(inserted_cat_list){
			$("#categorie_hotels").animate({
				height : "800px"
			}, 250 )
		}

		$("#categories_index").animate({
			height : "800px"
		}, 250, "linear", function() {
			if(to_map){
				map_click_from_collection()
			}
		} )
	}) 
}

// Funcion que realiza las animaciones para pasar a la pestana de mapa
// desde la pestana de colleciones.
var map_click_from_collection = function() {

	$("#categorie_hotels").animate({
		marginTop: "20px",
		height : "294px"
	}, 250 )

	$("#categories_index").animate({
		marginTop: "20px",
		height : "294px"
	}, 250 )

	$("#hotel_list").animate({
		marginTop: "20px",
		height : "294px"
	}, 250 )
	
	$("#map").animate({
	    	height: "500px"
    	}, 250)
}

// Funcion quie realiza las animaciones para pasar a la pestana de mapa 
// desde la pestana de alojados.
var map_click_from_hotel_info = function () {
	collection_click_from_hotel_info(true , true)
}

// Funcion que realiza las animaciones para pasar a la pestaña de alojados
// desde la pestaña de colecciones
var alojados_click_from_collection = function() {

    	$("#hotel_info").animate({
    		marginTop: "20px",
    		height : "800px"  
    	}, 250 )

    	$("#map").animate({
		height : "0px" 
    	},250 )

	$("#categorie_hotels").animate({
		height : "0px"
	}, 250 )

	$("#categories_index").animate({
		height : "0px"
	}, 250 )

	$("#hotel_list").animate({
		height : "0px"
	}, 250 )
}

var alojados_click_from_map = function() {
	alojados_click_from_collection()
}

// Funcion para crear una categoria nueva
// Añade todas las opciones para que le puedan ser añadidos hoteles.
var crear_categoria = function(that,new_cat_name) {

	if(!new_cat_name){
		new_cat_name = $("#cat_input").val()
		$("#cat_input").val("") 
	}

	new_cat = "<div class='categoria' value='" + new_cat_name + "'><p>" + new_cat_name + "</p></div>"

	$("#categories_index").append(new_cat)

	lista_categorias[new_cat_name] = new Array()  

	// Programa los eventos de droppable para que puedan ser arrastrados elementos en la categoria
	$( ".categoria[value='" + new_cat_name + "']" ).droppable({
		hoverClass: "active_hover",
		accept : ".hotel",
		drop: function( event, ui ) {
			lista_categorias[event.target.textContent].push(ui.draggable.text())
			insert_cat_hotels(event.target.textContent)
			$(".categoria[value='" + event.target.textContent + "']").addClass("active")

			if (last_cat_clicked)
				last_cat_clicked.removeClass("active")
			$(this).addClass("active")
			last_cat_clicked = $(this)

		}
	// Programa el evento click sobre la categoria
	}).click( function() {

		if (last_cat_clicked)
			last_cat_clicked.removeClass("active")
		$(this).addClass("active")
		last_cat_clicked = $(this)

		cat = $(this)[0].textContent
		insert_cat_hotels(cat)

	})
 
	return new_cat_name

}

// Inserta los hoteles pertenecientes a la categoria dada en el ultimo div categorie_hotels
var insert_cat_hotels = function(cat) {

	// Inserta los hoteles de la categoria
	hotels_in_cat = ""
	for (var i = 0 ; i < lista_categorias[cat].length ; i++) {
		hotels_in_cat += "<div class='categorie_hotel' value='" + lista_categorias[cat][i] + "'>"
		hotels_in_cat += "<p>" + lista_categorias[cat][i] + "</p> </div>"

	}

	$("#categorie_hotels").empty().append(hotels_in_cat)

	// Programa los eventos de clicks sobre los hoteles de la categoria
	for (var i = 0 ; i < lista_categorias[cat].length ; i++) {
		$( ".categorie_hotel[value='" + lista_categorias[cat][i] + "']" ).click( function () {
			if(last_cat_hotel_clicked)
				last_cat_hotel_clicked.removeClass("active")
			$(this).addClass("active")
			last_cat_hotel_clicked = $(this)
			$(".hotel[name='" + $(this)[0].textContent + "']").trigger("click")
		})
	}
}

var show_hotel = function(hotel) {


}
