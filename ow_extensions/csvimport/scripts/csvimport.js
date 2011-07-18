var dimensions = {};
var uribase = '';

// RDFa
var attributeModel = "http://localhost/ontowiki/sdmx-attribute";
var conceptModel   = "http://localhost/ontowiki/sdmx-concept";
var dimensionModel = "http://localhost/ontowiki/sdmx-dimension";

$(document).ready(function () {
    if(typeof isTabular !== "undefined" && isTabular === true ) {return;}
    
    // load RDFa
    var rdf_script = document.createElement( 'script' );
    rdf_script.type = 'text/javascript';
    rdf_script.src = RDFAUTHOR_BASE+"src/rdfauthor.js";
    $('body').append( rdf_script );
        
    // on ready
    RDFAUTHOR_READY_CALLBACK = function () {
        // default graph
        RDFauthor.setInfoForGraph(RDFAUTHOR_DEFAULT_GRAPH, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(RDFAUTHOR_DEFAULT_GRAPH, "updateEndpoint", urlBase+"update");
      
        // attribute endpoint
        RDFauthor.setInfoForGraph(attributeModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(attributeModel, "updateEndpoint", urlBase+"update");
        
        // concept endpoint
        RDFauthor.setInfoForGraph(conceptModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(conceptModel, "updateEndpoint", urlBase+"update");
        
        // dim endpoint
        RDFauthor.setInfoForGraph(dimensionModel, "queryEndpoint", urlBase+"sparql");
        RDFauthor.setInfoForGraph(dimensionModel, "updateEndpoint", urlBase+"update");
    };
    
    // check for trailing slash
    var checkSlash = function(uri){        
        if( uri.charAt(uri.length - 1) !== "/" ){ 
            uri += '/';
        }
        return uri;
    };
        
    // set uribase value
    if( uribase.length < 1 && typeof salt !== 'undefined' ){
        uribase = RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/';    
    }
    $("#uribase").val(uribase);
    
    $("#uribase").keyup(function(){
        if( $(this).val().length < 3 ) {return;}
        var oldbase = uribase;
        uribase = $(this).val();
        
        // temp vars for new keys
        var newKey = '';
        var newEKey = '';
        var di, ele ;
        for (di in dimensions) {
	    if (dimensions.hasOwnProperty(di)) {
		newKey = checkSlash( di.replace(oldbase, uribase) );
		dimensions[newKey] = dimensions[di];
		
		for(ele in dimensions[di]["elements"]){
			if (dimensions[di]["elements"].hasOwnProperty(ele)) {
				newEKey = checkSlash( ele.replace(oldbase, uribase) );
				dimensions[newKey]["elements"][newEKey] = dimensions[di]["elements"][ele];
				
				// delete old elements
				delete dimensions[di]["elements"][ele];
			}
		}
            }
            // delete old stuff            
            delete dimensions[di];
        }
        
        dimensions.uribase = uribase;
    });
    
    /* functions */
    var _getColor = function () {
        var r = Math.round(Math.random() * (90 - 50) + 50);
        var g = Math.round(Math.random() * (90 - 50) + 50);
        var b = Math.round(Math.random() * (90 - 50) + 50);

        return 'rgb(' + r + '%,' + g + '%,' + b + '%)';
    };

    var _getURI = function (name) {
        var prefix = uribase;
        prefix = checkSlash(prefix);
        var URI = prefix + name.replace(/[^A-Za-z0-9_-]/, ''); //RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/' + name.replace(/[^A-Za-z0-9_-]/, '');
        return URI;
    };

    /* vars */
    var currentColor;
    var currentDimension;
    var selectionMode = 'dimension';
    var datarange = {};

    $('table.csvimport td').dblclick(function(){
        if (selectionMode !== 'dimension') {return;}

        var id = $(this).attr('id');
        var URI = _getURI(id);
        var ids = id.split('-');
        var row = ids[0].replace('r', '');
        var col = ids[1].replace('c', '');
        var selid = null;

        var select = prompt('(De)Select whole row (r) or column (c)?');
        if(select === "r" || select === "row"){
            selid = 'id*=r'+row+'-';
        }else if(select === "c" || select === "column"){
            selid = 'id$=c'+col;
        }

        $('table.csvimport td['+selid+']').each(function(){
            var id = $(this).attr('id');
            var URI = _getURI(id);
            var ids = id.split('-');
            var row = ids[0].replace('r', '');
            var col = ids[1].replace('c', '');

            if($.trim($(this).text()).length < 1) {return;}

            if (!$(this).hasClass('csv-highlighted')) {
                $(this).data('dimension', null);
                $(this).css('background-color', currentColor);
                $(this).addClass('csv-highlighted');

                dimensions[currentDimension]['elements'][URI] = {
                    'row': row,
                    'col': col,
                    'label': $.trim($(this).text())
                };
            } else {
                $(this).data('dimension', currentDimension);
                $(this).css('background-color', 'transparent');
                $(this).removeClass('csv-highlighted');

                // undefine
                delete dimensions[currentDimension]['elements'][URI];
            }
        });
    });

    $('table.csvimport td').click(function () {
        var id = $(this).attr('id');
        var URI = _getURI(id);
        var ids = id.split('-');
        var row = ids[0].replace('r', '');
        var col = ids[1].replace('c', '');

        if (selectionMode === 'dimension') {
            
            if ( dimensions[currentDimension].attribute ){
                // attributes stuff here
                if (!$(this).hasClass('csv-highlighted')) {
                    if(dimensions[currentDimension].selected){
                        // clear old stuff
                        $('td[about='+currentDimension+']').data('dimension', currentDimension);
                        $('td[about='+currentDimension+']').css('background-color', 'transparent');
                        $('td[about='+currentDimension+']').removeClass('csv-highlighted');
                        dimensions[currentDimension].value = '';
                        dimensions[currentDimension].selected = false;
                    }
                    
                    $(this).data('dimension', null);
                    $(this).css('background-color', currentColor);
                    $(this).addClass('csv-highlighted');
                    $(this).attr("about", currentDimension);

                    dimensions[currentDimension].row = row;
                    dimensions[currentDimension].col = col;
                    dimensions[currentDimension].value = $.trim($(this).text());
                    dimensions[currentDimension].selected = true;
                } else {
                    $(this).data('dimension', currentDimension);
                    $(this).css('background-color', 'transparent');
                    $(this).removeClass('csv-highlighted');

                    // undefine
                    dimensions[currentDimension].value = '';
                    dimensions[currentDimension].selected = false;
                }
            } else { 
                // dimensions stuff here
                if (!$(this).hasClass('csv-highlighted')) {
                    $(this).data('dimension', null);
                    $(this).css('background-color', currentColor);
                    $(this).addClass('csv-highlighted');

                    dimensions[currentDimension]['elements'][URI] = {
                        'row': row,
                        'col': col,
                        'label': $.trim($(this).text())
                    };
                } else {
                    $(this).data('dimension', currentDimension);
                    $(this).css('background-color', 'transparent');
                    $(this).removeClass('csv-highlighted');

                    // undefine
                    delete dimensions[currentDimension]['elements'][URI];
                }
            }
        } else {
            if (selectionMode === 'start') {
                datarange['start'] = {'row': row, 'col': col};
                selectionMode = 'end';
            } else if (selectionMode === 'end') {
                datarange['end'] = {'row': row, 'col': col};
                selectionMode = 'dimension';
                $('#csvimportDatarange').html(' (' +
                    datarange['start'].row + ',' +
                    datarange['start'].col + ') to (' +
                    datarange['end'].row + ',' +
                    datarange['end'].col + ')');
            }
        }
    });


    /*
     *  DIMENSIONS STUFF
     */
    $('#btn-add-dimension').click(function () {
        var name = prompt('Dimension name:');
        if ( typeof name === 'undefined' || name.length < 1) {return;}
        
        var eid = name.replace(" ","_");
        var dimensionInfo = {
            color: _getColor(),
            label: $.trim(name),
            elements: {}
        };
        var dimensionURI = _getURI(name);
        dimensions[dimensionURI] = dimensionInfo;
        currentDimension = dimensionURI;
        currentColor = dimensionInfo.color;
        var htmlText = '<tr style="background-color:' + currentColor + '"><td name="'+name+'">' + name; 
        htmlText += '<br/><sub>subPropertyOf:</sub><span id="dim_'+eid+'_0"></span>'+
                    '<sub>concept:</sub><span id="dim_'+eid+'_1"></span>';
        htmlText += '</td></tr>';
        var tr = $(htmlText).data('dimension', name);

        $('#csvimport-dimensions').append(tr);
        
        // property selector
        _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
        var input0 = $("#dim_"+eid+"_0");
        selectorOptions = {
            container: input0,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input0).val(uri);
                dimensions[dimensionURI].subproperty = uri;
            }
        };
        // FIXME: title hack        
        _propertySelector = new ObjectSelector(dimensionModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
        _propertySelector.presentInContainer();
        
        // property selector 2
        var input1 = $("#dim_"+eid+"_1");
        selectorOptions = {
            container: input1,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input1).val(uri);
                dimensions[dimensionURI].concept = uri;
            }
        };
        _propertySelector = new ObjectSelector(conceptModel, _subjectURI, "http://purl.org/linked-data/cube#concept", selectorOptions);
        _propertySelector.presentInContainer();
        
    });
    
    $('#csvimport-dimensions tr').live('click', function () {
        var name = $(this).children('td').eq(0).attr("name");

        var URI = $(this).attr("about");
        if( typeof URI === "undefined" ){
            URI = _getURI(name);
        }

        var dimInfo = dimensions[URI];        
        currentDimension = URI;        
        currentColor = dimInfo.color;        
    });

    $('#csvimport-dimensions tr').live('dblclick', function () {
        var name = $(this).children('td').eq(0).attr("name");
        var URI = _getURI(name);
        var newName = prompt('New name:', name);
        if ( typeof newName === 'undefined' || newName.length < 1) {return;}
        var newURI = _getURI(newName);

        var dimInfo = dimensions[URI];
        dimInfo.label = $.trim(newName);
        dimensions[newURI] = dimInfo;
        delete dimensions[URI];
        $(this).children('td').eq(0).html( $(this).children('td').eq(0).html().replace(name,newName) );
        $(this).children('td').eq(0).attr("name",newName);
    });


    /*
     * DATA RANGE 
     */
    $('#btn-datarange').live('click', function () {
        alert('Click on the upper left, then on the lower right data cell.');
        selectionMode = 'start';
    });
    
    /*
     * ATTRIBUTES STUFF 
     */
    $('#btn-attribute').live('click', function () {        
        var name = prompt('Attribute name:');
        if ( typeof name === 'undefined' || name.length < 1) {return;}
        
        var eid = name.replace(" ","_");
        var attributeInfo = {
            color: _getColor(),
            label: $.trim(name),
            attribute: true,
            selected: false,
            row: -1,
            col: -1,
            value: '',
            uri: ''
        };
        var attributeURI = _getURI(name);
        dimensions[attributeURI] = attributeInfo;
        currentDimension = attributeURI;
        currentColor = attributeInfo.color;
        var htmlText = '<tr style="background-color:' + currentColor + '"><td name="'+name+'">' + name; 
        htmlText += '<br/><sub>attribute:</sub><span id="attr_'+eid+'_0"></span>';
        htmlText += '</td></tr>';
        var tr = $(htmlText).data('attribute', name);

        $('#csvimport-attributes').append(tr);
        
        // property selector
        _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
        var input0 = $("#attr_"+eid+"_0");
        selectorOptions = {
            container: input0,
            filterDomain: false,
            selectionCallback: function (uri, label) {
                $("input", input0).val(uri);
                dimensions[attributeURI].uri = uri;
            }
        };
        // FIXME: title hack        
        _propertySelector = new ObjectSelector(attributeModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
        _propertySelector.presentInContainer();
        
        
    });
    
    $('#csvimport-attributes tr').live('click', function () {
        var name = $(this).children('td').eq(0).attr("name");

        var URI = $(this).attr("about");
        if( typeof URI === "undefined" ){
            URI = _getURI(name);
        }

        var dimInfo = dimensions[URI];        
        currentDimension = URI;        
        currentColor = dimInfo.color;        
    });

    $('#csvimport-attributes tr').live('dblclick', function () {
        var name = $(this).children('td').eq(0).attr("name");
        var URI = _getURI(name);
        var newName = prompt('New name:', name);
        if ( typeof newName === 'undefined' || newName.length < 1) {return;}
        var newURI = _getURI(newName);

        var dimInfo = dimensions[URI];
        dimInfo.label = $.trim(newName);
        dimensions[newURI] = dimInfo;
        delete dimensions[URI];
        $(this).children('td').eq(0).html( $(this).children('td').eq(0).html().replace(name,newName) );
        $(this).children('td').eq(0).attr("name",newName);
    });

    
    /*
     * EXTRACT BTN
     */
    $('#extract').click(function () {
        /*if( typeof(decodedConfig) == 'undefined' || decodedConfig === false ){
            if ($.isEmptyObject(dimensions)) {
                alert('Please select at least one dimension.');
                return false;
            };

            if ($.isEmptyObject(datarange)) {
                alert('Please select data range.');
                return false;
            }

            for (d in dimensions) {
                
                if( typeof dimensions[d].attribute != 'undefined' && dimensions[d].attribute == true ){
                    if(dimensions[d].uri.length < 1){
                        alert('One or several attributes missing URI!');
                        return;
                    }
                }else{
                    for (e in dimensions[d]['elements']) {
                        dimensions[d]['elements'][e]['items'] = datarange;
                    }
                }
            }
            
            dimensions.uribase = [uribase];
        }

//this does a good job of sorting the dimensions data for 2d data, it should be able to do more
//this next code adds the third dimension of Sample size directly
var element_uri = _getURI($('table.csvimport').attr('id')) + 'r' + datarange.start.row + '-c' + datarange.end.col;
dimensions[_getURI($('table.csvimport').attr('id'))] = {};
dimensions[_getURI($('table.csvimport').attr('id'))]['elements'] = {};
dimensions[_getURI($('table.csvimport').attr('id'))]['elements'][element_uri] = {};
dimensions[_getURI($('table.csvimport').attr('id'))]['elements'][element_uri]['items'] = datarange;
dimensions[_getURI($('table.csvimport').attr('id'))].label = 'Sample Size';
dimensions[_getURI($('table.csvimport').attr('id'))].subproperty = 'test_sdmx-sample-size';
dimensions[_getURI($('table.csvimport').attr('id'))].concept = 'test_sdmx_sample_size';
for (item in dimensions[_getURI($('table.csvimport').attr('id'))]['elements'][element_uri]['items']) {
	dimensions[_getURI($('table.csvimport').attr('id'))]['elements'][element_uri]['items'][item].label = "1930";
}
	dimensionString = $.toJSON(dimensions);*/
	//some namespaces:
	var ylcs =  'http://data.younglives.org.uk/data/summary/';
	var yls = 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/';
	var qb = 'http://purl.org/linked-data/cube#';
	var rdf = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
	var rdfs = 'http://www.w3.org/2000/01/rdf-schema#';
	var sdmx_measure = 'http://purl.org/linked-data/sdmx/2009/measures#';
	var sdmx_dimension = 'http://purl.org/linked-data/sdmx/2009/dimension#'; 
	var sdmx_code = 'http://purl.org/linked-data/sdmx/2009/code#';
	var xsd = 'http://www.w3.org/2001/XMLSchema#';
        
	//hardcode dimensionstring here. workout how to create it later.
	//generate a random (type 4) uuid code for stackoverflow
	var datacube_uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	return v.toString(16);
	});
	//our datacube uuid on it's own doesn't look like it plays nice with ontowiki which is hoping for it's own hashed patyh element, so we will add it back in.
	datacube_uuid = _getURI($('table.csvimport').attr('id')) + datacube_uuid ;

	//helpful functionality
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	Array.prototype.getUniquePoints = function () {
		var a = [];
		var l = this.length;
		var i, j;
		for(i=0; i<l; i++) {
			for(j=i+1; j<l; j++) {
				// If this[i] is found later in the array
				if (compare_points(this[i], this[j])) {
					j = ++i;
				}
			}
		a.push(this[i]);
		}
		return a;
	};
	Array.prototype.addArray = function (array) {
		var x;
		for (x in array) {if (array.hasOwnProperty(x)) {this.push(array[x]);}}
	};

	var top_left = {};
	var bottom_right = {};
	var triples = {};


/*ylcs:structureProportionOfSample a qb:DataStructureDefinition;  
/	qb:component [ qb:dimension yls:cohort; ],
				 [ qb:dimension yls:country; ],
	 			 [ qb:dimension yls:round; ],
	 			 [ qb:dimension yls:sampleSize; ],
				 [ qb:measure yls:measure-ProportionOfSample; ].


triples[ylcs + "structureProportionOfSample"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataStructureDefinition" }]};
triples[ylcs + "structureProportionOfSample"][qb + "component"]= [{"type": "bnode", "value" : "_:cohort"}, 
										{"type": "bnode", "value" : "_:country"},
										{"type": "bnode", "value" : "_:round"},
										{"type": "bnode", "value" : "_:sampleSize"},
										{"type": "bnode", "value" : "_:measure-ProportionOfSample"}];
triples["_:cohort"] = {};
triples["_:country"] = {};
triples["_:round"] = {};
triples["_:sampleSize"] = {};
triples["_:measure-ProportionOfSample"] = {};
triples["_:cohort"][qb + "dimension"] = [{"type": "uri", "value" :yls + "cohort"}];
triples["_:country"][qb + "dimension"] = [{"type": "uri", "value" :yls + "country"}];
triples["_:round"][qb + "dimension"] = [{"type": "uri", "value" :yls + "round"}];
triples["_:sampleSize"][qb + "dimension"] = [{"type": "uri", "value" :yls + "sampleSize"}];
triples["_:measure-ProportionOfSample"][qb + "measure"] = [{"type": "uri", "value" :yls + "measure-ProportionOfSample"}];
*/
/*yls:measure-ProportionOfSample a rdf:Property, qb:MeasureProperty;
	rdfs:label "The proportion of the total sample that belong in all the categories noted"@en;
	rdfs:subPropertyOf sdmx-measure:obsValue;
	rdfs:range xsd:decimal .

triples[yls + "measure-ProportionOfSample"] = { };
triples[yls + "measure-ProportionOfSample"][rdfs + "label"] = [{ "type": "literal", 
			 "value" : "The proportion of the total sample that belong in all the categories noted", 
			  "lang" : "en"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "subPropertyOf"] = [{"type": "uri", "value" : sdmx_measure + "obsValue"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "range"] =  [{"type": "uri", "value" : xsd + "decimal"}]; 
triples[yls + "measure-ProportionOfSample"][rdf + "Property"] = [{"type": "uri", "value" : qb + "MeasureProperty"}];
   
*/


//a dim must have a label or it is ignored ScovoImporter.php line 140// now hacked

/*
ylcs:structureProportionOfSampleGender rdfs:subClassOf ylcs:structureProportionOfSample;  
	qb:component [ qb:dimension sdmx-dimension:sex; ].
ylcs:datasetProportionOfSampleGender a qb:DataSet;
	qb:structure ylcs:structureProportionOfSampleGender.


triples[ylcs + "structureProportionOfSampleGender"] = { };
triples[ylcs + "structureProportionOfSampleGender"][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
triples[ylcs + "structureProportionOfSampleGender"][qb + "component"] =  [{"type": "bnode", "value" : "_:gender"}];
triples["_:gender"] = {};
triples["_:gender"][qb + "dimension"] = [{"type": "uri", "value" :sdmx_dimension + "sex"}];
triples[ylcs + "datasetProportionOfSampleGender"] = { };
triples[ylcs + "datasetProportionOfSampleGender"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
triples[ylcs + "datasetProportionOfSampleGender"][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSampleGender"}];
*/
/*ylcs:structureProportionOfSampleCohort rdfs:subClassOf ylcs:structureProportionOfSample;  
	qb:component [ qb:dimension yls:Cohort; ].

# The Dataset
ylcs:datasetProportionOfSampleCohort a qb:DataSet;
	qb:structure ylcs:structureProportionOfSampleCohort.

triples[ylcs + "structureProportionOfSampleCohort"] = { };
triples[ylcs + "structureProportionOfSampleCohort"][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
triples[ylcs + "structureProportionOfSampleCohort"][qb + "component"] =  [{"type": "bnode", "value" : "_:cohort"}];
triples[ylcs + "datasetProportionOfSampleCohort"] = { };
triples[ylcs + "datasetProportionOfSampleCohort"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
triples[ylcs + "datasetProportionOfSampleCohort"][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSampleCohort"}];
*/

/*ylcs:structureProportionOfSampleUrbanOrRural rdfs:subClassOf ylcs:structureProportionOfSample;  
	qb:component [ qb:dimension yls:urbanOrRural; ].

# The Dataset
ylcs:datasetProportionOfSampleUrbanOrRural a qb:DataSet;
	qb:structure ylcs:structureProportionOfSampleUrbanOrRural.

triples[ylcs + "structureProportionOfSampleUrbanOrRural"] = { };
triples[ylcs + "structureProportionOfSampleUrbanOrRural"][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
triples[ylcs + "structureProportionOfSampleUrbanOrRural"][qb + "component"] =  [{"type": "bnode", "value" : "_:urbanOrRural"}];
triples["_:urbanOrRural"] = {};
triples["_:urbanOrRural"][qb + "dimension"] = [{"type": "uri", "value" : yls + "urbanOrRural"}];
triples[ylcs + "datasetProportionOfSampleUrbanOrRural"] = { };
triples[ylcs + "datasetProportionOfSampleUrbanOrRural"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
triples[ylcs + "datasetProportionOfSampleUrbanOrRural"][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSampleUrbanOrRural"}];
*/
/*
ylcs:structureProportionOfSampleMothersEducation rdfs:subClassOf ylcs:structureProportionOfSample;  
	qb:component [ qb:dimension yls:mothersEducation; ].

# The Dataset
ylcs:datasetProportionOfSampleMothersEducation a qb:DataSet;
	qb:structure ylcs:structureProportionOfSampleMothersEducation.

triples[ylcs + "structureProportionOfSampleMothersEducation"] = { };
triples[ylcs + "structureProportionOfSampleMothersEducation"][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
triples[ylcs + "structureProportionOfSampleMothersEducation"][qb + "component"] =  [{"type": "bnode", "value" : "_:mothersEducation"}];
triples["_:mothersEducation"] = {};
triples["_:mothersEducation"][qb + "dimension"] = [{"type": "uri", "value" : yls + "mothersEducation"}];
triples[ylcs + "datasetProportionOfSampleMothersEducation"] = { };
triples[ylcs + "datasetProportionOfSampleMothersEducation"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
triples[ylcs + "datasetProportionOfSampleMothersEducation"][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSampleMothersEducation"}];
*/
/*
ylcs:structureProportionOfSampleRegion rdfs:subClassOf ylcs:structureProportionOfSample;  
	qb:component [ qb:dimension yls:region; ].

# The Dataset
ylcs:datasetProportionOfSampleRegion a qb:DataSet;
	qb:structure ylcs:structureProportionOfSampleRegion.

triples[ylcs + "structureProportionOfSampleRegion"] = { };
triples[ylcs + "structureProportionOfSampleRegion"][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
triples[ylcs + "structureProportionOfSampleRegion"][qb + "component"] =  [{"type": "bnode", "value" : "_:region"}];
triples["_:region"] = {};
triples["_:region"][qb + "dimension"] = [{"type": "uri", "value" : yls + "region"}];
triples[ylcs + "datasetProportionOfSampleRegion"] = { };
triples[ylcs + "datasetProportionOfSampleRegion"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
triples[ylcs + "datasetProportionOfSampleRegion"][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSampleRegion"}];
*/

//now we can define the observations

/*
the uri of an observation is made from
_getURI($('table.csvimport').attr('id')) is a hash made by ontowiki of the csv file imported
a uuid that is random for each import
the row and colum of the observation

this gives each observation a unique uri on each import, so if multiple imports are made then extar data can be found and removed uniquely.

data that come from the speadsheet is represented in single quotes

*/

/*
# The Observations for Gender
ylcs:statistic1 a qb:Observation;
	qb:dataset ylcs:datasetProportionOfSampleGender;
	yls:cohort yls:OlderCohort;
	yls:sampleSize "1930"^^<http://www.w3.org/2001/XMLSchema#integer>;
	yls:country yls:India;
	yls:round yls:RoundThree;
	sdmx-dimension:sex sdmx-code:sex-M;
	yls:measure-ProportionOfSample "0.54"^^<http://www.w3.org/2001/XMLSchema#decimal>. #Should measure be decimal or percentage? 

triples[ylcs + datacube_uuid + "_r3_c1"] = {};
triples[ylcs + datacube_uuid + "_r3_c1"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "Observation" }]};
triples[ylcs + datacube_uuid + "_r3_c1"][qb + "dataset"] = [{"type": "uri", "value": ylcs + "datasetProportionOfSampleGender" }];
triples[ylcs + datacube_uuid + "_r3_c1"][yls + "cohort"] = [{"type": "uri", "value": yls + 'YC' }]; //OC may need a lookup to 'YoungerCohort'
triples[ylcs + datacube_uuid + "_r3_c1"][yls + "sampleSize"] = [{"type": "literal", "value": '1930', "datatype": "http://www.w3.org/2001/XMLSchema#integer" }];
triples[ylcs + datacube_uuid + "_r3_c1"][yls + "country"] = [{"type": "uri", "value": yls + 'India' }]; //the value of this may not be in the speadsheet but  is important, it may be in the name of the sheet, or we may have to prompt the user directly.
triples[ylcs + datacube_uuid + "_r3_c1"][yls + "round"] = [{"type": "uri", "value": yls + 'RoundThree' }]; //as above
triples[ylcs + datacube_uuid + "_r3_c1"][sdmx_dimension + "sex"] = [{"type": "uri", "value": sdmx_code + 'sex-M' }];//we will need to map Male to sex-M
triples[ylcs + datacube_uuid + "_r3_c1"][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": '0.54', "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];

triples[ylcs + datacube_uuid + "_r3_c2"] = {};
triples[ylcs + datacube_uuid + "_r3_c2"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "Observation" }]};
triples[ylcs + datacube_uuid + "_r3_c2"][qb + "dataset"] = [{"type": "uri", "value": ylcs + "datasetProportionOfSampleGender" }];
triples[ylcs + datacube_uuid + "_r3_c2"][yls + "cohort"] = [{"type": "uri", "value": yls + 'OC' }]; //OC may need a lookup to 'OlderCohort'
triples[ylcs + datacube_uuid + "_r3_c2"][yls + "sampleSize"] = [{"type": "literal", "value": '976', "datatype": "http://www.w3.org/2001/XMLSchema#integer" }];
triples[ylcs + datacube_uuid + "_r3_c2"][yls + "country"] = [{"type": "uri", "value": yls + 'India' }]; //the value of this may not be in the speadsheet but  is important, it may be in the name of the sheet, or we may have to prompt the user directly.
triples[ylcs + datacube_uuid + "_r3_c2"][yls + "round"] = [{"type": "uri", "value": yls + 'RoundThree' }]; //as above
triples[ylcs + datacube_uuid + "_r3_c2"][sdmx_dimension + "sex"] = [{"type": "uri", "value": sdmx_code + 'sex-M' }];//we will need to map Male to sex-M
triples[ylcs + datacube_uuid + "_r3_c2"][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": '0.49', "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];

triples[ylcs + datacube_uuid + "_r4_c1"] = {};
triples[ylcs + datacube_uuid + "_r4_c1"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "Observation" }]};
triples[ylcs + datacube_uuid + "_r4_c1"][qb + "dataset"] = [{"type": "uri", "value": ylcs + "datasetProportionOfSampleGender" }];
triples[ylcs + datacube_uuid + "_r4_c1"][yls + "cohort"] = [{"type": "uri", "value": yls + 'YC' }]; //OC may need a lookup to 'YoungerCohort'
triples[ylcs + datacube_uuid + "_r4_c1"][yls + "sampleSize"] = [{"type": "literal", "value": '1930', "datatype": "http://www.w3.org/2001/XMLSchema#integer" }];
triples[ylcs + datacube_uuid + "_r4_c1"][yls + "country"] = [{"type": "uri", "value": yls + 'India' }]; //the value of this may not be in the speadsheet but  is important, it may be in the name of the sheet, or we may have to prompt the user directly.
triples[ylcs + datacube_uuid + "_r4_c1"][yls + "round"] = [{"type": "uri", "value": yls + 'RoundThree' }]; //as above
triples[ylcs + datacube_uuid + "_r4_c1"][sdmx_dimension + "sex"] = [{"type": "uri", "value": sdmx_code + 'sex-F' }];//we will need to map Female to sex-F
triples[ylcs + datacube_uuid + "_r4_c1"][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": '0.46', "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];


triples[ylcs + datacube_uuid + "_r4_c2"] = {};
triples[ylcs + datacube_uuid + "_r4_c2"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "Observation" }]};
triples[ylcs + datacube_uuid + "_r4_c2"][qb + "dataset"] = [{"type": "uri", "value": ylcs + "datasetProportionOfSampleGender" }];
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "cohort"] = [{"type": "uri", "value": yls + 'OC' }]; //OC may need a lookup to 'OlderCohort'
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "sampleSize"] = [{"type": "literal", "value": '976', "datatype": "http://www.w3.org/2001/XMLSchema#integer" }];
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "country"] = [{"type": "uri", "value": yls + 'India' }]; //the value of this may not be in the speadsheet but  is important, it may be in the name of the sheet, or we may have to prompt the user directly.
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "round"] = [{"type": "uri", "value": yls + 'RoundThree' }]; //as above
triples[ylcs + datacube_uuid + "_r4_c2"][sdmx_dimension + "sex"] = [{"type": "uri", "value": sdmx_code + 'sex-F' }];//we will need to map Female to sex-F
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": '0.51', "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];
*/


/*
the aim is now to define a series of data elements as if they had been selected from the speadsheet or other interface elements
and them serialise them into triples that are the same as above.
*/

/*
stage 1 define the dsd

aim to get this:
triples[ylcs + "structureProportionOfSample"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataStructureDefinition" }]};
triples[ylcs + "structureProportionOfSample"][qb + "component"]= [{"type": "bnode", "value" : "_:cohort"}, 
										{"type": "bnode", "value" : "_:country"},
										{"type": "bnode", "value" : "_:round"},
										{"type": "bnode", "value" : "_:sampleSize"},
										{"type": "bnode", "value" : "_:measure-ProportionOfSample"}];
triples["_:cohort"] = {};
triples["_:country"] = {};
triples["_:round"] = {};
triples["_:sampleSize"] = {};
triples["_:measure-ProportionOfSample"] = {};
triples["_:cohort"][qb + "dimension"] = [{"type": "uri", "value" :yls + "cohort"}];
triples["_:country"][qb + "dimension"] = [{"type": "uri", "value" :yls + "country"}];
triples["_:round"][qb + "dimension"] = [{"type": "uri", "value" :yls + "round"}];
triples["_:sampleSize"][qb + "dimension"] = [{"type": "uri", "value" :yls + "sampleSize"}];
triples["_:measure-ProportionOfSample"][qb + "measure"] = [{"type": "uri", "value" :yls + "measure-ProportionOfSample"}];


*/
// make an overall object to send, we will build it up peice by piece.

	var bnodes = {};
	var dsd = {};
	dsd_name = 'structureProportionOfSample';
	dsd_custom = false;
	// define a list of dimensions
	var components =       ['cohort',
				'country',
				'round',
				'sampleSize']; 
	
	//check for custom extra dimensions, if so change set dsd_name and add the y custom values
	if (dsd_custom) {
	//TODO set name
		dsd_name = 'new_name';
	//TODO collect values from ui
		//for each new value
		//components.push(new value);
	}
	//alwways need this
	dsd[ylcs + dsd_name] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataStructureDefinition" }]};
	//loop to add 
	dsd_components = [];
	var comp;
	for (comp in components) {
		if  ( components.hasOwnProperty(comp) ) {
			dsd_components.push({"type": "bnode", "value" : "_:" + components[comp]});
			bnodes["_:" + components[comp] ] = {};
			bnodes["_:" + components[comp] ][qb + "dimension"] = [{"type": "uri", "value" :yls + comp}];
		}
	}
	//add here any custom defined dimensions for the dsd
	
	//add the measure triple
	dsd_components.push({"type": "bnode", "value" : "_:measure-ProportionOfSample"});
	bnodes["_:measure-ProportionOfSample"] = {};
	bnodes["_:measure-ProportionOfSample"][qb + "measure"] = [{"type": "uri", "value" :yls + "measure-ProportionOfSample"}];
	//add the component triple
	dsd[ylcs + dsd_name][qb + "component"] = dsd_components;



/*
stage 2 
add the measure property needs to make triples as below 
*/
/*yls:measure-ProportionOfSample a rdf:Property, qb:MeasureProperty;
	rdfs:label "The proportion of the total sample that belong in all the categories noted"@en;
	rdfs:subPropertyOf sdmx-measure:obsValue;
	rdfs:range xsd:decimal .

triples[yls + "measure-ProportionOfSample"] = { };
triples[yls + "measure-ProportionOfSample"][rdfs + "label"] = [{ "type": "literal", 
			 "value" : "The proportion of the total sample that belong in all the categories noted", 
			  "lang" : "en"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "subPropertyOf"] = [{"type": "uri", "value" : sdmx_measure + "obsValue"}];
triples[yls + "measure-ProportionOfSample"][rdfs + "range"] =  [{"type": "uri", "value" : xsd + "decimal"}]; 
triples[yls + "measure-ProportionOfSample"][rdf + "Property"] = [{"type": "uri", "value" : qb + "MeasureProperty"}];
*/
/*this code provides a fixed uneditable measure*/
	var measure = {};
	measure[yls + "measure-ProportionOfSample"] = { };
	measure[yls + "measure-ProportionOfSample"][rdfs + "label"] = [{ "type": "literal", 
				"value" : "The proportion of the total sample that belong in all the categories noted", 
				"lang" : "en"}];
	measure[yls + "measure-ProportionOfSample"][rdfs + "subPropertyOf"] = [{"type": "uri", "value" : sdmx_measure + "obsValue"}];
	measure[yls + "measure-ProportionOfSample"][rdfs + "range"] =  [{"type": "uri", "value" : xsd + "decimal"}]; 
	measure[yls + "measure-ProportionOfSample"][rdf + "Property"] = [{"type": "uri", "value" : qb + "MeasureProperty"}];



/*
first we will provide a helper function to return a list of coordinates based on a rectangular range or an range and a potential row or column cordinate,
and for making a point
*/
	var make_point = function (col, row) {
		if (row && col){
			if ((typeof(parseInt(col, 10)) === 'number') && (typeof(parseInt(row, 10)) === 'number')) {
				return {'col' : parseInt(col, 10), 'row' : parseInt(row, 10)};
			}
		}
	};
	var is_point = function (point) {
		/*checks that the object can be a point
		*/
		if (typeof point !== 'undefined') {
			if ((typeof(parseInt(point.col, 10)) === 'number') && (typeof(parseInt(point.row, 10)) === 'number')) {
				return true;
			} else {
				return false;
			}
		}
	};
	var compare_points = function (pointA, pointB) {
		if (is_point(pointA) && is_point(pointB)) {
			if ((pointA.col === pointB.col) && (pointA.row === pointB.row)) {
				return true;
			} 
			return false;
		}
	};
		
	var get_coords = function (top_left, bottom_right, limit_point) {
		/*
		top_left, bottom_right,limit_point are expected to be like this {'row': row, 'col':col}
		top_left, bottom_right are required
		*/
		var points = [];
		var x = 0;
		var y = 0;
		if (! (is_point(top_left) && is_point(bottom_right))) {
			return points; //if we don't have correct input return an empty list/array
		} 
		var limit = is_point(limit_point);
		//make a list of points in the rectangle
		for (x = top_left.col; x <= bottom_right.col; x++) {
			for (y = top_left.row; y <= bottom_right.row; y++) {
				// and include those on the same row or column as the limit_point, or all of them
				if (!limit) {
					points.push(make_point(x,y));
				} else if ( x === limit_point.col || y === limit_point.row) {
					points.push(make_point(x,y));
				}
			}
		} 
		return points;
	}; 

/*
IMPORTANT on a shhet row=0, col=0 is top left

stage 3 the dimensions
IMPORTANT it will work like this:

0. optional prompt for an overall data range from top left to bottom right in a rectangle.
0a. callculate the list of points that this is. save it.(see 1c)

1. if a dimension is specified in the components list, we must prompt of either:
	1a. a text value
	1b. a cell that contains a text value
  and we must prompt for a data range over which this value holds true
	1c. data range
  we must now offer to repeat this process to add a subsequent values and ranges
the data structure for this should be {name from components list : {
				       'values': [{name from text or sheet : [{'row': X , 'col' :Y},{'row': X1 , 'col' :Y1}, {'row': X2 , 'col' :Y3}, ... ]}, ...
						]}}
	where each value is an object contaimning a list of the row:column value to which it is appicable.

2. if a dimension is specified by the user we must prompt for:
	2a. A dimension uri
	2b. the cell that contains the value (eg r2, c3 = Male) or
	2c. a text value
	2d. for each value prompt (an option if 0. has been defined) for a data range, if 0 has been defined then assume data points on the same row if the value is left of the data range, or if value is in a cell above the data range use data points in the column below, else error and request a defined range.

this should now provide us with the minimum data to be able to construct the dimensions and then the observations.	
	
*/

/*ok so given this definition the start of the india test table reuslts in this data structure

so we will start with making a data struct that reflects the user input then we will parse it to make our triples
*/
	var dimensions_raw = {};
	
	//all to be set fron ui
	top_left = make_point('1','3');
	bottom_right = make_point('2','20');
	dimensions_raw['cohort'] = {'values' : [{'YC' : get_coords(make_point('1','3'), make_point('1','20'))}, 
					{'OC' : get_coords(make_point('2','3'), make_point('2','20'))}]};
	dimensions_raw['country'] = {'values' : [{'India' : get_coords(make_point('1','3'), make_point('2','20'))}]};
	dimensions_raw['round'] = {'values' : [{'roundThree' : get_coords(make_point('1','3'), make_point('2','20'))}]};
	dimensions_raw['sampleSize'] = {'values' : [{'1930' : get_coords(make_point('1','3'), make_point('1','20'))}, 
					{'976' : get_coords(make_point('2','3'), make_point('2','20'))}]}; 
	//TODO work out how to handle number strings, do we do this with user input or just set them if they parseInt? (this is bad for year dates eg 2011, but easy)

	//TODO and IMPORTANT
	//all values from the speadsheet that are going to become uri's must have all spaces removed and replaced with something safe
	//my current best suggestion is to replace all spaces with underscores, utf-8 chars like ħħ ß work just fine, and ;' too
	//neil thinks this is a limitaion of ontowiki, he has tried to send spaces and %20 both of which fail
	dimensions_raw['gender'] = {'dimension_uri' : 'http://purl.org/linked-data/sdmx/2009/dimension#sex',
				'values' : [{'Male' : get_coords(top_left, bottom_right, make_point('0','3'))}, 
						{'Female' : get_coords(top_left, bottom_right, make_point('0','4'))}]};
	dimensions_raw['UrbanOrRural'] = {'dimension_uri' : 'http://data.younglives.org.uk/data/summary/UrbanOrRural',
				'values' : [{'Urban' : get_coords(top_left, bottom_right, make_point('0','5'))}, 
						{'rural' : get_coords(top_left, bottom_right, make_point('0','6'))}]};
	dimensions_raw['MothersEducation'] = {'dimension_uri' : 'http://data.younglives.org.uk/data/summary/MothersEducation',
				'values' : [{'Mother_has_no_education' : get_coords(top_left, bottom_right, make_point('0','7'))}, 
						{'Mother_has_primary_educ_or_below' : get_coords(top_left, bottom_right, make_point('0','8'))},
						//not !!! {'Mother has primary educ or below' : get_coords(top_left, bottom_right, make_point('0','8'))},
						{'Mother_has_secondary_educ_or_below' : get_coords(top_left, bottom_right, make_point('0','9'))}, 
						{'Mother_has_above_secondary_educ' : get_coords(top_left, bottom_right, make_point('0','10'))}]};
	dimensions_raw['Region'] = {'dimension_uri' : 'http://data.younglives.org.uk/data/summary/Region',
				'values' : [{'Coastal_andhra' : get_coords(top_left, bottom_right, make_point('0','11'))}, 
						{'Rayalseema' : get_coords(top_left, bottom_right, make_point('0','12'))},
						{'Telangana' : get_coords(top_left, bottom_right, make_point('0','13'))}]};
//end set from ui
/*
ok now the fun bit, lets parse the dimensions_raw object
*/
	var dimensions = {};
	
	var dim = '';
	for (dim in dimensions_raw) {
		if (dimensions_raw.hasOwnProperty(dim)) {
			//check to see if we have a new dimension or one defined in the dsd, we can tell by looking for the 'dimension_uri' key
			if (dimensions_raw[dim].hasOwnProperty('dimension_uri')) {
				bnodes["_:" + dim] = {};
				bnodes["_:" + dim][qb + "dimension"] = [{"type": "uri", "value" : dimensions_raw[dim].dimension_uri}];
			} 
			dimensions[ylcs + "structureProportionOfSample" + dim.capitalize()] = {};
			dimensions[ylcs + "structureProportionOfSample" + dim.capitalize()][rdfs + "subClassOf"] = [{"type": "uri", "value" : ylcs + "structureProportionOfSample"}];
			dimensions[ylcs + "structureProportionOfSample" + dim.capitalize()][qb + "component"] =  [{"type": "bnode", "value" : "_:" + dim}];
			dimensions[ylcs + "datasetProportionOfSample" + dim.capitalize()] = { };
			dimensions[ylcs + "datasetProportionOfSample" + dim.capitalize()] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "DataSet" }]};
			dimensions[ylcs + "datasetProportionOfSample" + dim.capitalize()][qb + "structure"] = [{"type": "uri", "value": ylcs + "structureProportionOfSample" + dim.capitalize()}];
			
		}
	}

/*
now we need to add the observations

they look like this:

triples[ylcs + datacube_uuid + "_r4_c2"] = {};
triples[ylcs + datacube_uuid + "_r4_c2"] = {"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : [{"type": "uri", "value": qb + "Observation" }]};

triples[ylcs + datacube_uuid + "_r4_c2"][qb + "dataset"] = [{"type": "uri", "value": ylcs + "datasetProportionOfSampleGender" }];
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "cohort"] = [{"type": "uri", "value": yls + 'OC' }]; //OC may need a lookup to 'OlderCohort'
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "sampleSize"] = [{"type": "literal", "value": '976', "datatype": "http://www.w3.org/2001/XMLSchema#integer" }];
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "country"] = [{"type": "uri", "value": yls + 'India' }]; //the value of this may not be in the speadsheet but  is important, it may be in the name of the sheet, or we may have to prompt the user directly.
triples[ylcs + datacube_uuid + "_r4_c2"][yls + "round"] = [{"type": "uri", "value": yls + 'RoundThree' }]; //as above
triples[ylcs + datacube_uuid + "_r4_c2"][sdmx_dimension + "sex"] = [{"type": "uri", "value": sdmx_code + 'sex-F' }];//we will need to map Female to sex-F

triples[ylcs + datacube_uuid + "_r4_c2"][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": '0.51', "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];

1. build a list of all the points in the sheet that contain an observation. this is the data range + any extra points from any of the dimensions.
2. for each of these points, loop throug all the dimensions recording those that are relevant.
2a. add the measure to each.

*/
	var observation_points = [];
	var dim_value, key;
	observation_points = get_coords(top_left, bottom_right);
	for (dim in dimensions_raw) { //for each dimension
		if (dimensions_raw.hasOwnProperty(dim)) {
			for (dim_value in dimensions_raw[dim]['values']) { //for each value add all points
				for (key in dimensions_raw[dim]['values'][dim_value]) {
					if (dimensions_raw[dim]['values'][dim_value].hasOwnProperty(key)) {
						observation_points.addArray(dimensions_raw[dim]['values'][dim_value][key]);
					}
				}
			}
		}
	}
	
	//remove duplicate points
	observation_points = observation_points.getUniquePoints();
	var observations = {};
	var observation = {};
	var obs_value = '';
	var loc_str = '';
	var obs_point, dim_point;
	//loop through all these points looking for which dimensions are usd
	for (obs_point in observation_points) {
		if(observation_points.hasOwnProperty(obs_point)){
			//begin constructing the observation
			//TODO set obsvalue from sheet here
			obs_value = '0.51';
			observation = {}; //clear this var
			loc_str = 'c' + observation_points[obs_point].col.toString() + '_r' + observation_points[obs_point].row.toString();
			observation[datacube_uuid + loc_str] = {};
			observation[datacube_uuid + loc_str]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"] = [{"type": "uri", "value": qb + "Observation" }];
			observation[datacube_uuid + loc_str][yls + "measure-ProportionOfSample"] = [{"type": "literal", "value": obs_value, "datatype" : "http://www.w3.org/2001/XMLSchema#decimal" }];
			//now we need to find which dimension this point is in.
			for (dim in dimensions_raw) { //for each dimension
				if (dimensions_raw.hasOwnProperty(dim)) {
					for (dim_value in dimensions_raw[dim]['values']) { //for each value add all points
						if (dimensions_raw[dim]['values'].hasOwnProperty(dim_value)) {
							for (key in dimensions_raw[dim]['values'][dim_value]) {
								if (dimensions_raw[dim]['values'][dim_value].hasOwnProperty(key)) {
									for (dim_point in dimensions_raw[dim]['values'][dim_value][key]) {
										if (dimensions_raw[dim]['values'][dim_value][key].hasOwnProperty(dim_point)) {
											if (compare_points(observation_points[obs_point], dimensions_raw[dim]['values'][dim_value][key][dim_point])) {
												//ok our point is in this dimension, easy and very readable uh.
												observation[datacube_uuid + loc_str][yls + dim] = [{"type": "uri", "value": yls + key}];
												//stop loop now
												break;
											}
										}
									}
								}
							}
						}
					}
				}
			}
			//ok at this point we should have an observation
			observations[datacube_uuid + loc_str] = observation[datacube_uuid + loc_str];
		}
	}
	
	
	
	//use jquery to merge objects together.
	jQuery.extend(triples, dsd, bnodes, measure, dimensions, observations);

	//dimensionString = $.toJSON(observations);




//IMPORTANT!!!!! we cannot pass a space in a uri value, nor a %20. ie this will not work!!!! ie this will fail, but will work if the first 3 %20 are removed, the last appears to work, I do not know why. 
	//dimensionString = $.toJSON( {"http://data.younglives.org.uk//7829f2eacb60b5f76a60316eae8573d9/74d71e57-8e62-4845-81e2-506b67006c94c1_r79":{"http://www.w3.org/1999/02/22-rdf-syntax-ns#type":[{"type":"uri","value":"http://purl.org/linked-data/cube#Observation"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/measure-ProportionOfSample":[{"type":"literal","value":"0.51","datatype":"http://www.w3.org/2001/XMLSchema#decimal"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/cohort":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/YC"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/country":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/India"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/round":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/roundThree"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/sampleSize":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/1930"}],"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/MothersEducation":[{"type":"uri","value":"http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/Mother%20has%20no%20educationßß;'%20f"}]}});


	dimensionString = $.toJSON(triples);
	
	

        var url = window.location.href + '/results';
        $.get(url, function(data){
            var div_str = '<div id="import-options" \
            style="width:400px;height:150px;padding:5px;align:center;\
            background:white;position:absolute;left:40%;top:30%;\
            border: 1px solid #900; overflow: auto;">'+
                data + '</div>';
            $('body').append( $(div_str) );
        });
    });

    theight = $(window).height() - $("#csvimport-dimensions").height() - $("#messagebox").height() - 150;
    $("#table-holder").css("height", theight);
});

function useCSVConfiguration(config) {
    // clear
    clearAll();

    // decode JSON
    decodedConfig = true;
    dimensions = $.evalJSON(config);
    
    uribase = '0';
    if( typeof dimensions["uribase"] === "undefined" || dimensions["uribase"].length < 1 ){ 
        uribase = RDFAUTHOR_DEFAULT_GRAPH + '/' + salt + '/';
    }else{
        uribase = dimensions["uribase"];
    }
    $("#uribase").val(uribase);
    var dimA;
    for (dimA in dimensions) {
	if (dimensions.hasOwnProperty(dimA)) {
		if(dimA !== 'uribase'){
			if( typeof dimensions[dimA].attribute !== 'undefined' && dimensions[dimA].attribute === true ){
				//console.log(dimensions[dim]);
				appendAttribute(dimA, dimensions[dimA].label, dimensions[dimA].color, dimensions[dimA].uri);
				drawAttribute(dimensions[dimA].row, dimensions[dimA].col, dimensions[dimA].color);
			}else{
				appendDimension(dimA, dimensions[dimA].label, dimensions[dimA].color, dimensions[dimA].subproperty, dimensions[dimA].concept);
				drawElements(dimensions[dimA].elements, dimensions[dimA].color);
			}
		}
	}
    }
}


function appendDimension(dim, label, color, subproperty, concept){
    var eid = $.trim(label);
    var htmlText = '<tr style="background-color:' + color + '" about="'+dim+'"><td name="'+label+'">' + label; 
        htmlText += '<br/><sub>subPropertyOf:</sub><span id="dim_'+eid+'_0"></span>';
        htmlText += '<sub>concept:</sub><span id="dim_'+eid+'_1"></span>';
        htmlText += '</td></tr>';
    
    var tr = $(htmlText).data('dimension', label);
    $('#csvimport-dimensions').append(tr);
    
    var dimensionURI = dim;
    // property selector
    _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
    var input0 = $("#dim_"+eid+"_0");
    selectorOptions = {
        container: input0,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input0).val(uri);
            dimensions[dimensionURI].subproperty = uri;
        }
    };
    // FIXME: title hack        
    _propertySelector = new ObjectSelector(dimensionModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input0).val(subproperty);
    
    // property selector 2
    var input1 = $("#dim_"+eid+"_1");
    selectorOptions = {
        container: input1,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input1).val(uri);
            dimensions[dimensionURI].concept = uri;
        }
    };
    _propertySelector = new ObjectSelector(conceptModel, _subjectURI, "http://purl.org/linked-data/cube#concept", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input1).val(concept);
}

function appendAttribute(dim, label, color, uri){
    var eid = $.trim(label);
    var htmlText = '<tr style="background-color:' + color + '" about="'+dim+'"><td name="'+label+'">' + label;
        htmlText += '<br/><sub>attribute:</sub><span id="attr_'+eid+'_0"></span>';
        htmlText += '</td></tr>';
    
    var tr = $(htmlText).data('dimension', label);
    $('#csvimport-attributes').append(tr);
    
    // property selector
    var attributeURI = dim;
    _subjectURI = "http://"+window.location.host+"/ontowiki/somegraph";
    var input0 = $("#attr_"+eid+"_0");
    selectorOptions = {
        container: input0,
        filterDomain: false,
        selectionCallback: function (uri, label) {
            $("input", input0).val(uri);
            dimensions[attributeURI].uri = uri;
        }
    };
    // FIXME: title hack
    _propertySelector = new ObjectSelector(attributeModel, _subjectURI, "http://www.w3.org/2000/01/rdf-schema#subPropertyOf", selectorOptions);
    _propertySelector.presentInContainer();
    
    $("input", input0).val(uri);
}

function drawAttribute(row, col, color){
    var id = "#r"+row+"-c"+col;

    $(id).data('dimension', null);
    $(id).css('background-color', color);
    $(id).addClass('csv-highlighted');
}

function drawElements(elements, color){
    var elem;
    for(elem in elements){
	if (elements.hasOwnProperty(elem)) {
		var id = "#r"+elements[elem].row+"-c"+elements[elem].col;
	
		$(id).data('dimension', null);
		$(id).css('background-color', color);
		$(id).addClass('csv-highlighted');
	
		setDatarange(elements[elem].items);
        }
    }
}

function setDatarange(range){
    datarange = range;
    $('#csvimportDatarange').html(' (' +
                    datarange['start'].row + ',' +
                    datarange['start'].col + ') to (' +
                    datarange['end'].row + ',' +
                    datarange['end'].col + ')');
}

function clearAll(){
    $('#csvimport-dimensions').children().remove();
    $('table.csvimport td').each(function(){
        if ($(this).hasClass('csv-highlighted')) {
            $(this).css('background-color', 'transparent');
            $(this).removeClass('csv-highlighted');
        }
    });
}
