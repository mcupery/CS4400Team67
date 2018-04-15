$(document).ready(function() {
    var listAnimals = $("#dd_animal");
    var listFarmCrops = $('#dd_farmcrop');
    var listGardenCrops = $('#dd_gardencrop');
    var listOrchardCrops = $('#dd_orchardcrop');

    var showListDefaults = function() {
        listAnimals.show();
        listFarmCrops.show();
        listGardenCrops.hide();
        listOrchardCrops.hide();    
    }

    var showGardenLists = function() {
        listAnimals.hide();
        listFarmCrops.hide();
        listGardenCrops.show();
        listOrchardCrops.hide();
    }

    var showOrchardLists = function() {
        listAnimals.hide();
        listFarmCrops.hide();
        listGardenCrops.hide();
        listOrchardCrops.show();
    }

    showListDefaults();

    $('#regOwnerForm').validate( {
        debug: true,
        highlight: function(element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);
            
          },
          unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

          }
    });

    $('#sel_proptype').on('change', function() {
       // console.log("proptype changed");
        var proptype = $('#sel_proptype option:selected').text();
        switch(proptype) {
            case "Garden":
                showGardenLists();
                break;
            case "Orchard":
                showOrchardLists();
                break;
            default:
                showListDefaults();
                break;
        }

    })

});