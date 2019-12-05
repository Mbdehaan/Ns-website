
$(function() { // Menu is closed!
    $('.menu_closed').click(function() {
        $('.menu_closed').toggle();
        $('.menu_open').toggle();

        $('.header').addClass("header--active");

        $('.navigation').delay(600).fadeToggle(200);

    });
});




$(function() { //menu is open!
    $('.menu_open').click(function() {
        $('.menu_open').toggle();
        $('.menu_closed').toggle();

        $('.navigation').fadeToggle(200);

        $('.header').removeClass("header--active");

    });
});



$(document).ready(function(){

	$('ul.tabs li a').click(function(){
		var tab_id = $(this).attr('data-tab');

		$('ul.tabs li a').removeClass('current');
		$('.sub_menu').removeClass('current');

		$(this).addClass('current');
		$("#"+tab_id).addClass('current');
	});

});

















$(document).ready(function(){


 //$('.toggle_show', '.navigation').hide();
 //$('.toggle_hide').show();
 //$('.header').toggleClass("header_active");

});


/**
$(function() {
    $(".menu_control>a").click(function(){

        $('.menu_closed',this).toggle();
        $('.menu_open',this).toggle();

        $('.header').toggleClass("header_active");

        $('.navigation').delay(300).fadeToggle(500);


    });
});
*/
