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

// Variables globales. Para evitar pasar los datos como parametros a las funciones.
last_scroll = 0 ;
last_clicked = null ;
last_cat_hotel_clicked = null ;
last_cat_clicked = null ;
full_hotels_info = null ;  // service array
inserted_cat_list = false ;
selected_hotel = 0 ;
selected_hotel_name = "" ;
current = "" ;
inserted_repo_info_form = false ;
got_git_file = false ;
github = null ;
git_info = {}
data_to_save = false ;

lista_alojados = {} 
lista_categorias = {}

// Codigo que se ejecuta cuando se carga el DOM
$(function() {
	// Inserta mapa
	var madrid_coords = [40.433333, -3.683333]
	var map = L.map('map').setView( madrid_coords, 13);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {}).addTo(map);

	current = "#mapa" // Inicializo la primera pestana
	$(current).addClass("active")

	full_hotels_info  = insertHotels(map) // Una vez cargado el DOM inserta los hoteles.

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
		show_hotel()

		if ( current == "#colecciones" )
			alojados_click_from_collection()

		if (current == "#mapa")
			alojados_click_from_map()

		$(current).removeClass("active") 
		current = "#alojados"
		$(current).addClass("active")
	})

	// Eventos para cambiar el boton de crear categoria.
	$("#cat_git_input").focusin(function() {
		$("#cat_git_button").addClass("btn-primary").addClass("button_focused").removeClass("btn-default")
	})

	$("#cat_git_input").focusout(function() {
		$("#cat_git_button").addClass("btn-default").removeClass("button_focused").removeClass("btn-primary");

	})

	// Creando las categorias.
	$('#cat_git_input').keyup( function (e) {
		if (e.keyCode === 13) {
			get_token()
		}
	})

	$("#cat_git_button").click(get_token)
});

// Funcion que me inserta la lista de hoteles desde el json.
// Ademas dado el mapa me los muestra en este.
// Una vez insertados los hoteles devuelve la lista de estos por si hacen falta 
// y asi no tener que pedirlos otra vez.
var insertHotels = function(map) {
	var hotel_list
	var result 
	$.ajax({
		dataType: "json",
		method: "GET",
		async: false,
		url: "https://raw.githubusercontent.com/CursosWeb/Code/master/JS-APIs/misc/alojamientos/alojamientos.json",
            	success: function(data) {
                	result = data;
            	}
	})
		.done(function( msg ) {
			hotel_list = msg.serviceList.service 
			selected_hotel_name = hotel_list[selected_hotel].basicData.name
			dom_hotel_list = $("#hotel_list")
			aux_hotel_list = ""
			for (var i = 0 ; i < hotel_list.length ; i++){
				aux_hotel_list += "<div class=' hotel ' value='" + i + "'" 
				aux_hotel_list += "name='" +  hotel_list[i].basicData.name  + " '>"
				aux_hotel_list += "<p>" + hotel_list[i].basicData.name + "</p></div>"
				hotel_list[i].index = i // hotels index, para poder localizarlo.
			}
			dom_hotel_list.append(aux_hotel_list)
			hotel_list = insertHotels_Markers(hotel_list, map)

			// Programa el evento click sobre los div.hotel ( antes no podia porque no estaban creados)
			$(".hotel").draggable({
				helper: "clone"
			}).click( function() {

				var i = parseInt($(this).attr("value")) // hotels index

				selected_hotel = i
				selected_hotel_name = $(this).attr("name")
				
				hotel_list[i].marker.openPopup()
				scroll_and_check(i)
				map.setView( [hotel_list[i].geoData.latitude , hotel_list[i].geoData.longitude ], 18)

			})

		})

	return result.serviceList.service
}

// Dada la lista de hoteles y el mapa, crea los markers ( con sus respectivos
// pop ups ) de hoteles colocandolos
// en el mapa y ademas los añade como un campo mas a la lista.
var insertHotels_Markers = function(list , map) {
	for (var i = 0 ; i < list.length ; i++){
		list[i].marker = L.marker( [list[i].geoData.latitude , list[i].geoData.longitude ] )

		var elto = "<p> <a onclick='trigger_alojados(this)' href='#'>" + list[i].basicData.name + "</a><br>" 
		elto += "<b>Address: </b> " + list[i].geoData.address + "</p>"

		list[i].marker.addTo(map).bindPopup(elto)
		list[i].marker.index = i
		list[i].marker.on("click" , function() {
			selected_hotel = this.index 
			scroll_and_check(this.index)
		})
	}

	return list 
}

trigger_alojados = function(ev) {
	$("#alojados").trigger("click")
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

	if (!inserted_cat_list && got_git_file  ) { // La primera vez compirmira los dos div iniciales
				  // e insertara el de categorie_hotels

		$("#hotel_list").parent().removeClass("col-lg-6")	
		$("#hotel_list").parent().addClass("col-lg-4")
		$("#hotel_list").parent().removeClass("col-md-6")
		$("#hotel_list").parent().addClass("col-md-4")
		$("#hotel_list").parent().removeClass("col-sm-6")
		$("#hotel_list").parent().addClass("col-sm-4")

		$("#categories_index").parent().removeClass("col-lg-6")
		$("#categories_index").parent().addClass("col-lg-4")
		$("#categories_index").parent().removeClass("col-md-6")
		$("#categories_index").parent().addClass("col-md-4")
		$("#categories_index").parent().removeClass("col-sm-6")
		$("#categories_index").parent().addClass("col-sm-4")

		cat_hotels = "<div class='col-lg-4 col-md-4 col-sm-4 col-xs-12' ><div id='categorie_hotels'  style='height : 800px ; margin-top : 20px;'></div></div>" 
		$("#collections").append(cat_hotels)

	}else {

	}

	$("#categorie_hotels").animate({
		height : "800px"
	}, 250 )

	return true ; // Devuelve una afirmacion de que ha sido llamado.
}

var collection_click_from_hotel_info = function(aux_var, to_map, to_hotel) {

    	$("#hotel_info").empty()

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

var insertar_categorias = function() {

	for (cat in lista_categorias ){
		crear_categoria(null , cat, lista_categorias[cat] )
	} 
}

// Funcion para crear una categoria nueva
// Añade todas las opciones para que le puedan ser añadidos hoteles.
var crear_categoria = function(that,new_cat_name , hotels) {

	if(!new_cat_name){
		new_cat_name = $("#cat_input").val()
		$("#cat_input").val("") 
	}

	new_cat = "<div class='categoria' value='" + new_cat_name + "'><p>" + new_cat_name + "</p></div>"

	$("#categories_index").append(new_cat)

	if(hotels){
		lista_categorias[new_cat_name] = hotels
	} else {
		lista_categorias[new_cat_name] = new Array()
	}

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
 
        if(!data_to_save)
        	insert_save_button()


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

// Dado el nombre del hotel devuelve la informacion completa del hotel.
var get_hotel_by_name = function(hotel) {

	for ( var i = 0 ; i < full_hotels_info.length ; i++ ) {
		if ( full_hotels_info[i].basicData.name == hotel  )
			return full_hotels_info[i]
	}

	return null
}

// Rellena la pestaña de alojados con la informacion de hotel seleccionado.
var show_hotel = function(hotel) {

	var my_hotel = full_hotels_info[selected_hotel]
	var media = my_hotel.multimedia

	// Titulo
	$("#hotel_info").append('<div id="title"></div>')
	$("#title").empty()
	$("#title").append("<h1><b>" + my_hotel.basicData.name +  "</b></h1>")

	// Carousel.	
	if (media)
		insert_carousel(media)

	// Descripcion
	var des = "<p>" + my_hotel.basicData.body + "</p>"
	des  += "<p> <b> Web: </b> <a href='" + my_hotel.basicData.web + "'>" + my_hotel.basicData.web + "</a></p>"
	des  += "<p> <b> Teléfono: </b> " + my_hotel.basicData.phone + "</p>"
	des  += "<p> <b> Dirección: </b> " + my_hotel.geoData.address +"  ("+ my_hotel.geoData.subAdministrativeArea  + ")"+ "</p>"

	$("#hotel_info").append('<div id="hotel_info_des"></div>')
	$("#hotel_info_des").empty()
	$("#hotel_info_des").append(des)


	if ( got_git_file) { // Inserta la lista de alojados solo si he cargado el fichero de github.
		// Lista de alojados.
		$("#hotel_info").append('<div id="hotel_info_users_list"></div>')

			// Formulario para añadir nuevos alojados.
		var form = "<h3 style='text-align: center '><b> Lista de Alojados </b></h3>"
	        form += '<div class="input-group" >'
	        form +=        '<input id="user_input" type="text" class="form-control" placeholder="Añadir nuevo alojado...">'
	        form +=        '<span class="input-group-btn">'
	        form +=                '<button id="alojado_button" class="btn btn-default" type="button"><b>Añadir</b></button>'
	        form +=        '</span>'
	        form +=  '</div><!-- /input-group -->'
	       // form +=		'<input id="comment_input" type="text" class="form-control" placeholder="Deje su comentario...">'

	        $("#hotel_info_users_list").append('<div id="hotel_info_user_form"></div> ')
	        $("#hotel_info_user_form").append(form)

		$("#user_input").focusin(function() {
			$("#alojado_button").addClass("btn-primary").addClass("button_focused").removeClass("btn-default")
		})

		$("#user_input").focusout(function() {
			$("#alojado_button").addClass("btn-default").removeClass("button_focused").removeClass("btn-primary");

		})

		gapi.client.setApiKey('AIzaSyA_cdGsOl0l_mciZRao_oQhE7lNtGX-4Cs');
		// INsertando los alojados
		var user_list = lista_alojados[selected_hotel_name]
		insert_user_list(user_list) 

		$('#user_input').keyup( function (e) {
			if (e.keyCode === 13) {
				insert_user($("#user_input").val())
				$("#user_input").val("") 
			}
		})

		$("#alojado_button").click( function() {
			insert_user( $("#user_input").val() )
			$("#user_input").val("") 
		})

	}

	// div para compsensar los margenes
	$("#hotel_info").append('<div style="height : 70px" ></div>')

	$("#hotel_info").show()

}

// Crea el carousel y lo inserta en el lugar donde tiene que ir.
var insert_carousel = function(media) {
	if(!media.media)
		return null 
	
	$("#hotel_info").append('<div id="hotel_info_galery"></div>')
	$("#hotel_info_galery").append('<div id="myCarousel" class="carousel slide" data-ride="carousel"></div>')
	$("#myCarousel").empty()
	$("#myCarousel").append('<div class="carousel-inner" role="listbox"> </div ')
	$("#myCarousel").append('<a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev"> ' +
                                        '<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' +
                                        '<span class="sr-only">Previous</span>' +
                                '</a>' +
                                '<a class="right carousel-control" href="#myCarousel" role="button" data-slide="next">' +
                                        '<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
                                        '<span class="sr-only">Next</span>' +
                                '</a>')

	if(!media.media.length){
		$(".carousel-inner").append("<div class='item active'>" +
						"<img src='" + media.media.url + "'>" +
						"</div")
		return
	}

	var photos = ("<div class='item active'>" +
				"<img src='" + media.media[0].url + "'>" +
			"</div>")
	for (var i = 1 ; i < media.media.length ; i++) {
		photos += ("<div class='item'>" +
				"<img src='" + media.media[i].url + "'>" +
			"</div>")
	}

	$(".carousel-inner").append(photos)
}

var insert_user_list = function(user_list) {
	// La api va a pelo, no debería, pero no se especifica nada en el enunciado.
	// Si no habria que pedirla como se hace con el token de github.
	if (!user_list)
		return

        for ( var i = 0 ; i < user_list.length ; i++) {
        	insert_user(user_list[i])
        }
}

var insert_user = function(user) {

	if(!user)
		return

	if(!lista_alojados[selected_hotel_name]){
		lista_alojados[selected_hotel_name] = new Array()
	}

	if(lista_alojados[selected_hotel_name].indexOf(user)==-1){
		lista_alojados[selected_hotel_name].push(user)
	}else if (current == "#alojados" ){
		return
	}

        gapi.client.load('plus', 'v1', function() {
        	var request = gapi.client.plus.people.get({
        		'userId': user 
        		// 'userId': '+GregorioRobles'
        	})
        	request.execute(function(resp) {
        		var heading = document.createElement('h4');
        		heading.setAttribute("value" , user)
        		var image = document.createElement('img');
        		image.src = resp.image.url;

        		var rem_image = document.createElement('img');
        		rem_image.src = ("images/recycle-bin.png")
        		rem_image.className = ("user_rem")

        		heading.appendChild(image);
        		heading.appendChild(document.createTextNode("   " + resp.displayName));
        		heading.appendChild(rem_image)

        		// Evento para poder borrar el alojado.
        		rem_image.addEventListener("click", function(){
        			var val =  $(this.parentNode)[0].attributes[0].value
        			for( var i = 0 ; i < lista_alojados[selected_hotel_name].length ; i++ ) {
        				if (lista_alojados[selected_hotel_name][i] == val ) {
        					delete lista_alojados[selected_hotel_name][i] 
        				}
        			}

    				$(this.parentNode).hide()
			});

        		document.getElementById('hotel_info_users_list').appendChild(heading);
        	})
        })

        if(!data_to_save)
        	insert_save_button()
}

var insert_cat_input = function(into_div) {

        var form = '<div class="input_form">'
        form +=         '<div class="input-group" style="height : 0px " >'
        form +=                        '<input id="cat_input" type="text" class="form-control" placeholder="Nueva colección...">'
        form +=                 '<span class="input-group-btn">'
        form +=                         '<button id="cat_button" class="btn btn-default" type="button"><b>Crear</b></button>'
        form +=                 '</span>'
        form +=         '</div><!-- /input-group -->'
        form += '</div>'

        $(into_div).append(form)

	// Eventos para cambiar el boton de crear categoria.
	$("#cat_input").focusin(function() {
		$("#cat_button").addClass("btn-primary").addClass("button_focused").removeClass("btn-default")
	})

	$("#cat_input").focusout(function() {
		$("#cat_button").addClass("btn-default").removeClass("button_focused").removeClass("btn-primary");

	})

	// Creando las categorias.
	$('#cat_input').keyup( function (e) {
		if (e.keyCode === 13) {
			crear_categoria()
		}
	})

	$("#cat_button").click(crear_categoria)
}

var get_token = function() {
	var token = $("#cat_git_input").val()
	github = new Github({
		token: token,
		auth: "oauth"
    	})

	insert_repo_info()
}

// Formulario para recoger los datos del fichero de github.
var insert_repo_info = function() {

	inserted_repo_info_form = true ;

        var form = '<div class="input_form" id="repo_info">'
        form +=         '<div class="input-group" >'
        form +=                 '<input id="cat_git_nick_input" type="text" class="form-control" placeholder="Github nick...">'
        form += 		'<input id="cat_git_repo_input" type="text" class="form-control" placeholder="Repo Name ...">'
        form += 		'<input id="cat_git_file_input" type="text" class="form-control" style="width : 34%" placeholder="File Name...">'
        form +=                 '<span class="input-group-btn">'
        form +=                         '<button id="cat_git2_button" class="btn btn-default" type="button" ><b>Leer</b></button>'
        form +=                 '</span>'
        form +=         '</div><!-- /input-group -->'
        form += '</div>'

        $("#categories_index").append(form)
        $("#token_form").hide() 

        $("#cat_git2_button").click(get_file_info)
}

var get_file_info = function() {

	var nick = $("#cat_git_nick_input").val() 
	var repo = $("#cat_git_repo_input").val()
	var file = $("#cat_git_file_input").val()

	git_info["nick"] = nick
	git_info["repo"] = repo
	git_info["file"] = file

	myrepo = github.getRepo(nick, repo)

	myrepo.read('master', file, function(err, data) {
		var info = JSON.parse(data)
		lista_categorias = info["categorias"]
		lista_alojados = info["alojados"]
		insertar_categorias()
    	});


	var into_div = $("#categories_index")
	into_div.empty()
	insert_cat_input(into_div)

	got_git_file = true ;
}

var insert_save_button = function() {
	data_to_save = true 
        var button =  '<button id="save_button" class="btn btn-primary" type="button" ><b>Guardar Cambios</b></button>'
        $("#header>.container>.navbar-header").append(button)

        $("#save_button").click(function() {

        	var info_to_save = { "categorias" : lista_categorias , "alojados" : lista_alojados }

        	myrepo.write(
        		'master',				// rama
        		git_info["file"], 			// fichero
			JSON.stringify ( info_to_save ),	// contenido a escribir
			"Updating data", function(err) {	// call back
			     console.log (err)
		});
        })
}