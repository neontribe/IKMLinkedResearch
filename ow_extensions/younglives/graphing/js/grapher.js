/**
 * Grapher
 * Graphing UI for YoungLives
 *
 */

var Grapher = {  // Config object and api
                            'target': $('#grapher'), // Target dom element
                            'sparql_endpoint': 'http://localhost/IKMLinkedResearch/build/service/sparql', // Sparql Endpoint
                            'visType': 'columnchart', // Set default visualization
                            'availableVisTypes': [ // Available Visualization types
                                    {id:'columnchart',
                                      title:'Column Chart'},
                                    {id:'table',
                                      title:'Data Table'}
                            ] 
                           }; 
(function(){ // Self-executing closure
    // Hook up to the dom
    Grapher.target.data('Grapher', Grapher);
    
    /**
     * Request graphable data
     */
   Grapher.getData = function(measure, dimension){
        $.sparql(Grapher.sparql_endpoint)
            .prefix('ylss', 'http://data.younglives.org.uk/data/vocab/younglivesStudyStructure/')
            .prefix('qb', 'http://purl.org/linked-data/cube#')
            .select(['?cohort', '?country', '?round', '?value', '?dimension'])
                .where('?obs', 'ylss:' + measure, '?value')
                    .where('ylss:' + dimension, '?dimension')
                    .where('ylss:Cohort', '?cohort')
                    .where('ylss:Round', '?round')
                    .where('ylss:Country', '?country')
            .execute(Grapher.updateData);
   };
   
   /**
    * Process the sparql json and store in Grapher.data
    * Emit an updated event
    */
   Grapher.updateData = function(data){
        var items = [];
        $.each(data, function(i,v){
            // Data conversion
            $.each(v, function(key, val){
                if ( val.type == 'typed-literal' && parseFloat(val.value) ) {
                    val.value = parseFloat(val.value);
                    val.label = val.value.toString();
                    val.coltype = 'number';
                }  
                if ( val.type == 'uri' ) {
                    val.coltype = 'string';
                    val.label = this.hasOwnProperty(key + '_label')
                        ?this[key + '_label']:val.value.slice(val.value.lastIndexOf('/')+1);
                }
            });
            items.push(v);
        
        });
        
        Grapher.data = items;
        Grapher.target.trigger('grapherDataUpdated');
   };
   
   Grapher.drawVis = function(){
        
        var options = {'title': 'The Title',
                                'height': 400,
                                'width': 400};
        var chart = null;
        var table = null;
        
        switch (Grapher.visType) {
            case 'table':
                chart = new google.visualization.Table(Grapher.vis);
                table = new google.visualization.DataTable();
                // Add a columnfor each of our dimensions
                table.addColumn('string', 'Cohort');
                table.addColumn('string', 'Round');
                table.addColumn('string', 'Country');
                table.addColumn('number', 'Value');
                table.addColumn('string', 'Dimension');
                $.each(Grapher.data, function(i,v) { 
                    table.addRow([
                                    v.cohort.label,
                                    v['round'].label,
                                    v.country.label,
                                    v.value.value,
                                    v.dimension.label
                                  ])
                });
                break;
                
            case 'columnchart':
                chart = new google.visualization.ColumnChart(Grapher.vis);
                table = new google.visualization.DataTable();
                table.addColumn('string', 'Country');
                table.addColumn('number', 'YC / Urban');
                table.addColumn('number', 'OC / Urban');
                table.addColumn('number', 'YC / Rural');
                table.addColumn('number', 'OC / Rural');
                
                var getVal = function(filters){
                    var item = _.detect(Grapher.data, function(item){
                        var pass = true;
                        _.each(filters, function(val, key){
                            if(item[key].label != val) { pass = false };
                        });
                        return pass;
                    });
                    return item ? item.value.value : 0;
                };
                
                table.addRow(['India', 
                                        getVal({cohort:'YC', dimension:'Urban'}),
                                        getVal({cohort:'OC',dimension:'Urban'}),
                                        getVal({cohort:'OC',dimension:'Rural'}),
                                        getVal({cohort:'YC',dimension:'Rural'})
                                       ]);
                break;
        }
        
        // Draw the chart
        chart.draw(table, options);
        
        
   };
   
   /**
    * Initialise Event Bindings
    */
   Grapher.initBindings = function(){
        this.target.bind('grapherDataUpdated', this.drawVis);
        this.target.bind('grapherVisTypeChanged', this.drawVis);
   };
   
   /**
    * Initialise
    * 
    * Build html in target element
    */
   Grapher.init = function(){
        
        var typeSwitch = $('<select id="grapher-vis-type-switch"></select>');
        $.each(Grapher.availableVisTypes, function(i,v){
            typeSwitch.append('<option value="' + v.id + '">' + v.title + '</option>');
        });
        typeSwitch.bind('change', function(evt, el){
            Grapher.visType = $(this).val();
            Grapher.target.trigger('grapherVisTypeChanged');
        });
        Grapher.target.append(typeSwitch);
        
        Grapher.target.append('<div id="grapher-vis"></div>');
        Grapher.vis = Grapher.target.find('#grapher-vis')[0];
        
        Grapher.initBindings();
        
        // Load the Visualization API and the piechart package.
       google.load('visualization', '1', {'packages':['corechart', 'table']});
       google.setOnLoadCallback(function(){
            Grapher.getData('measure-ProportionOfSample', 'UrbanOrRural');
       });

   };

   // Kick Off
   Grapher.init();
   
}()); // End self-executing closure
