steal(
    {path:'https://www.google.com/jsapi'}, //Google JS Api
    'resources/jquery-1.6.4.js', // Use jQuery
    'resources/underscore.js', // Underscore.js
    'resources/jquery.view.ejs', // EJS View Templates
    'resources/jquerytools/src/tabs/tabs.js', //jquery.tools Tabs
    'resources/jquery.sparql.js', // SPARQL Query Generation
    'resources/urlEncode.js', // URLEncoding Utility
    {path:'resources/jquery.fixture.js',
     ignore:true} // Add fixtures in development mode
)
.css(
    'styles/grapher',   // Use our own CSS
    'styles/tabs-accordion'   // Tab styling
)
.then( function(){
    (function($){

        var ns = {
            qb: 'http://purl.org/linked-data/cube#',
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs:'http://www.w3.org/2000/01/rdf-schema#'
        };

        // Store for grapher plugins
        var plugins = {};
        // Registered via $.fn.yl_grapher.registerPlugin



        var settings = {
            dsd: 'http://data.younglives.org.uk/data/statistics/SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e',
            sparql_endpoint: 'http://localhost/IKMLinkedResearch/build/service/sparql',
            http_host:'localhost',
            host_path: '/IKMLinkedResearch/build/younglives/display/r/ylstats?SumaryStatistics-e55f586a-b105-4ee4-ad75-ab87cb97e21e',
            graph_type: 'columnchart',
            chart_options: {'height': 400,
                                     'width': 700},
            measureType: "MeasureProperty",
            dimensionType: "DimensionProperty"
        };

        var methods = {
            /**
             * Perform Initial startup
             *
             * - parse options
             * - build initial UI
             * - set up bindings
             * - perform initial data load
             */
            init: function(options) {
                return this.each(function(){
                    var $this = $(this)
                          data = $(this).data('grapher');
                    if (!data) {
                        data = {};
                        // Merge options with defaults
                        if (options) {
                            $.extend(settings, options, true);
                        }
                        // Build UI
                        var ui = $($.View('views/init-accordion.ejs'));

                        $this.html(ui);
                        $(".accordion", $this).tabs(".accordion div.pane",
                                                        {tabs:'h2',
                                                          effect:'slide',
                                                          initialIndex: null
                                                        });
                        // Store a reference to the place we ant the chart drawn
                        // Mostly for Google's convenience
                        data.graph_target = $("#grapher-vis", ui)[0];
                        // Store a reference to our settings
                        data.settings = settings;

                        // Store our state
                        $this.data('grapher', data);

                        // Set up initial bindings
                        $this.bind('graphDataLoaded',
                            function(){
                                $this.yl_grapher('drawGraph');
                            }
                        );

                        /**
                         * Kick off by calling getObservations
                         */
                        $this.yl_grapher('loadGraphData');
                    }
                });
            }, // END INIT

            /**
             * Fetch a full table of observations for our configured DSD
             * Parse the result into observations and dsd_components objects
             * and store them in our data stash
             */
            loadGraphData:function(callback) {
                var $this = $(this)
                        data = $(this).data('grapher');

                // Fetch observations for DSD
                // Formulate a sparql request
                var squery = $.sparql(settings.sparql_endpoint)
                    .prefix('qb', ns.qb)
                    .prefix('rdfs', ns.rdfs)
                    .prefix('rdf', ns.rdf)
                    .select(['?dataset', '?obs', '?propertyLabel',
                                 '?valueLabel', '?value', '?property',
                                 '?propertyType', '?propertyOrder'])
                    .where('?dataset', 'qb:structure', '<' + settings.dsd + '>')
                    .where('?obs', 'qb:dataSet', '?dataset')
                    .where('?obs', '?property', '?value')
                    .where('?property', 'rdf:type', '?propertyType')
                    .where('?propertyType', 'rdfs:subClassOf', 'qb:ComponentProperty')
                    .where('?property', 'rdfs:label', '?propertyLabel')
                    .optional()
                        .where('?propertyClass', 'qb:dimension', '?property')
                        .where('?propertyClass', 'qb:order', '?propertyOrder')
                        .where('?value', 'rdfs:label', '?valueLabel')
                    .end();
                    //.orderby('?obs');

                var qurl = squery.config.endpoint
                    + '?query='
                    + $.URLEncode(squery.serialiseQuery());

                var fetch = $.when(
                    $.Deferred( // Get the google packages we need
                        function(deferred){
                            google.load('visualization', '1', {'packages':['corechart', 'table']});
                            google.setOnLoadCallback(function(){ deferred.resolve(); });
                        }
                    ),
                    $.Deferred(function(deferred){ // Fetch our observation data
                        $.ajax({
                            url: qurl,
                            dataType: 'json',
                            method:'GET',
                            success: function(observations){
                                data.raw_observations = observations;
                                deferred.resolve();
                            },
                            fixture: 'fixtures/sparql_result.json'
                        });
                    })
                );

                // Wait for completion of the fetch before proceeding
                fetch.done(
                    function(){
                        // Build stores of Observations, Dimensions and Measures
                        var obs = {};
                        var dsd_comps = {};
                        $.each(data.raw_observations.bindings, function(i, ob) {
                            // Populate the Observation
                            if (!obs[ob.obs.value]) {
                                obs[ob.obs.value] = {};
                            }
                            var cast_val = $.fn.yl_grapher.sparqlCaster(ob.value);
                            obs[ob.obs.value].dataset = ob.dataset.value;
                            obs[ob.obs.value].uri = ob.obs.value;
                            obs[ob.obs.value][ob.property.value] = {
                                value:cast_val,
                                label:ob.valueLabel?ob.valueLabel.value:null
                            };
                            // Ensure we've got the measure or dimension stores
                            var store = dsd_comps[ob.propertyType.value];
                            if(!store) {
                                store = dsd_comps[ob.propertyType.value] = {};
                            }
                            // Ensure we've got an entry in the appropriate store
                            var entry = store[ob.property.value];
                            if(!entry) {
                                entry = dsd_comps[ob.propertyType.value][ob.property.value] = {
                                   label:ob.propertyLabel.value,
                                   order:ob.propertyOrder?ob.propertyOrder.value:null,
                                   uri:ob.property.value,
                                   type: typeof(cast_val),
                                   observations:[]
                                };
                            }
                            // Now add to its known values
                            entry.observations.push(ob);
                        });

                        // Enhance dsd_comps with utility functions
                        /**
                         * Return a sorted list of dsd components
                         * of the supplied type
                         * The sort order is Alpahbetical by component label
                         */
                        dsd_comps.sortType = function(type){
                            return _.sortBy(
                                            _.values(this[ns.qb + type]),
                                            function(comp){ return comp.label?comp.label:comp.uri; }
                                        );
                        };

                        /**
                         * Retrieve a component specification by URI
                         */
                        dsd_comps.getComponent = function(componentURI){
                            // Locate the component scan all our subobjects
                            var comps = Array.prototype.concat.apply([], _.map(this, function(v){
                                        return _.values(v);
                                })
                            );
                            // Find the coponent object we're looking for
                            var comp = _.detect(
                                    comps,
                                    function(val){
                                        return val.uri == componentURI;
                                    }
                            );
                            return comp;
                        }

                        /**
                         * Return an array of values for a dsd component
                         */
                        dsd_comps.valuesFor = function(componentURI) {
                            var comp = this.getComponent(componentURI);
                            // Map out its values
                            var compvalues = _.map(comp.observations, function(ob){
                                return {label:ob.valueLabel?ob.valueLabel.value:null,
                                             value: ob.value.value};
                            });
                            return compvalues;
                        }

                        /**
                         * Return an array of unique values for a dsd component
                         */
                        dsd_comps.uniqueValuesFor = function(componentURI) {
                            return _.uniq(
                                this.valuesFor(componentURI),
                                false,
                                function(val){return val.value; }
                            ).sort();
                        }

                        /**
                         *Get the Label for a value for a component
                         *
                         *@param valuri {String} Value URI
                         *@param componentURI {String} Component URI
                         */
                        dsd_comps.getValueLabel = function(valuri, componentURI) {
                            var values = this.valuesFor(componentURI);
                            return _.detect(values, function(val){return val.value === valuri;})
                                .label;
                        }

                        /**
                         * Returns true if all observations in the set have a value for the componets
                         */
                        dsd_comps.isCoreComponent = function(componentURI) {
                            return (this.valuesFor(componentURI).length === _.keys(obs).length);
                        }

                        // Store parsed observations and dsd componetry
                        data.observations = obs;
                        data.dsd_components = dsd_comps;
                        // Call supplied callback & emit loaded event
                        $this.trigger('graphDataLoaded');
                        if (callback) {
                            callback(data);
                        }
                    }
                );
            }, // END loadGraphData

            /**
             * Check that we've got all the information we need
             * then hand off to a graph drawing routine
             */
            drawGraph: function(){
                if (plugins[settings.graph_type] !== undefined) {
                    var prepped_vis = plugins[settings.graph_type]
                                                    .prepare(data);
                    // Draw the chart
                    prepped_vis.chart.draw(
                        prepped_vis.table,
                        $.extend(settings.chart_options, prepped_vis.options, true)
                    );
                } else {
                    $.error('No Grapher plugin has been registered with an id of ' + settings.graph_type);
                }
            }
        }

        /**
         * Standard method calling logic
         */
        $.fn.yl_grapher = function(method){
            if ( methods[method] ) {
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                return $.error( 'Method ' +  method + ' does not exist on jQuery.yl_grapher' );
            }
        }; // END YL_GRAPHER

        // Plugin registration
        $.fn.yl_grapher.registerPlugin = function(plugin){
            plugins[plugin.id] = plugin;
        };

        /**
         *Cast sparql result values to js types
         *
         *@param {Object} item A sparql result value
         *@returns {Object} the cast value
         */
        $.fn.yl_grapher.sparqlCaster = function(item){
            var datatypes = {
                "http://www.w3.org/2001/XMLSchema#integer": parseInt,
                "http://www.w3.org/2001/XMLSchema#double":parseFloat
            }
            if (item.type === "typed-literal") {
                return datatypes[item.datatype](item.value);
            } else if (item.type === "literal") {
                return item.value.toString();
            } else {
                return item.value.toString();
            }
        };



    })(jQuery, google);
})
.then(
    // Load any Plugins we want included by default
    'resources/grapher_plugins/grapher.table.js', // Data Table Plugin
    'resources/grapher_plugins/grapher.columnchart.js' // Column Chart Plugin
);
