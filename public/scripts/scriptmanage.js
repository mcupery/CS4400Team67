$(document).ready(function() {
    var listAnimals = $("#dd_animal");
    var listFarmCrops = $('#dd_farmcrop');
    var listGardenCrops = $('#dd_gardencrop');
    var listOrchardCrops = $('#dd_orchardcrop');
    var farmOptions = $('#dd_farmtypes');
    var gardenOptions = $('#dd_gardentypes');
    var orchardOptions = $('#dd_orchardtypes');
    var proptype = $('#proptype').text();

    
    
    var showListDefaults = function() {
        listAnimals.show();
        listFarmCrops.show();
        listGardenCrops.hide();
        listOrchardCrops.hide();    
    }

    var showOptionDefaults = function() {
        farmOptions.show();
        gardenOptions.hide();
        orchardOptions.hide();
    }

    var showGardenLists = function() {
        listAnimals.hide();
        listFarmCrops.hide();
        listGardenCrops.show();
        listOrchardCrops.hide();
    }

    var showGardenOptions = function() {
        farmOptions.hide();
        gardenOptions.show();
        orchardOptions.hide();
    }

    var showOrchardLists = function() {
        listAnimals.hide();
        listFarmCrops.hide();
        listGardenCrops.hide();
        listOrchardCrops.show();
    }

    var showOrchardOptions = function() {
        farmOptions.hide();
        gardenOptions.hide();
        orchardOptions.show();
    }

    switch(proptype) {
        case "Garden":
            showGardenLists();
            showGardenOptions();
            break;
        case "Orchard":
            showOrchardLists();
            showOrchardOptions();
            break;
        default:
            showListDefaults();
            showOptionDefaults();
            break;
    }

    $('#ownerForm').validate( {
        highlight: function(element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);
            
          },
          unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

          }
    });

});