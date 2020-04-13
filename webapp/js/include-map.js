var fileref = document.createElement('script');
fileref.setAttribute("type","text/javascript");
fileref.setAttribute("src", "https://maps.googleapis.com/maps/api/js?libraries=visualization,places&key=AIzaSyA1uxqsy0qTkn6CyU4eAtjS-MDW7axkfWY");
fileref.async = false;
document.getElementsByTagName("head")[0].appendChild(fileref);
window.google = jQuery.extend(window.google,{
	maps:{}
});